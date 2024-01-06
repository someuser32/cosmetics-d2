/**
	NOTE:
	for unknown reason, fandom.com is currently unavaiable for me
	so i manually scrapped https://dota2.fandom.com/wiki/Kinetic_Gem to kinetic.html
	and reading it from code
	TODO:
	rewrite this when fandom.com will be avaiable from my ip
	or use proxies to bypass block??
*/

import "dotenv/config";
import {KeyValues, KeyValues3} from "easy-keyvalues";
import {VPK} from "vpk2";
import {promisified as regedit} from "regedit";
import {parse as parse_kv} from "kvparser";
import {parse as parse_html} from "node-html-parser";
import { tabletojson } from "tabletojson"
import * as fs from "node:fs";
import path from "path";
import fetch from "node-fetch";
import {FormData} from "node-fetch";
import * as sync_request from "sync-request";
const {default: request_sync} = sync_request;

const ONLINE_MODE = true;

const ITEMS_GAME_URL = "https://raw.githubusercontent.com/spirit-bear-productions/dota_vpk_updates/main/scripts/items/items_game.txt";
const DOTA_ENGLISH_URL = "https://raw.githubusercontent.com/spirit-bear-productions/dota_vpk_updates/main/resource/localization/dota_english.txt";
const PARTICLES_SERVER_URL = "http://localhost:8080/api/cosmetic/update-particles";
const BACKEND_TOKEN = process.env.TOKEN

const ATTACH_TYPES = {
	"PATTACH_ABSORIGIN": "absorigin",
	"PATTACH_ABSORIGIN_FOLLOW": "absorigin_follow",
	"PATTACH_CUSTOMORIGIN": "customorigin",
	"PATTACH_CUSTOMORIGIN_FOLLOW": "customorigin_follow",
	"PATTACH_EYES_FOLLOW": "EYES_FOLLOW",
	"PATTACH_POINT_FOLLOW": "point_follow",
	"PATTACH_RENDERORIGIN_FOLLOW": "renderorigin_follow",
	"PATTACH_WORLDORIGIN": "worldorigin",
	"PATTACH_CENTER_FOLLOW": "CENTER_FOLLOW",
	"PATTACH_CUSTOM_GAME_STATE_1": "CUSTOM_GAME_STATE_1",
	"PATTACH_MAIN_VIEW": "MAIN_VIEW",
	"PATTACH_OVERHEAD_FOLLOW": "OVERHEAD_FOLLOW",
	"PATTACH_POINT": "POINT",
	"PATTACH_ROOTBONE_FOLLOW": "ROOTBONE_FOLLOW",
	"PATTACH_WATERWAKE": "WATERWAKE"
};

const not_existing_particles = [];
const non_configurable_particles = [];
const non_configured_kinetics = [];

/**
 * Simple object check.
 * @param {any} item
 * @returns {boolean}
 */
function isObject(item) {
	return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Deep merge two objects.
 * @param {Object} target
 * @param {Object} sources
 * @returns {Object}
 */
function mergeDeep(target, source) {
	let output = Object.assign({}, target);
	if (isObject(target) && isObject(source)) {
		Object.keys(source).forEach(key => {
			if (isObject(source[key])) {
				if (!(key in target)) {
					Object.assign(output, { [key]: source[key] });
				} else {
					output[key] = mergeDeep(target[key], source[key]);
				}
			} else {
				Object.assign(output, { [key]: source[key] });
			}
		});
	}
	return output;
}

/**
 * @returns {string|undefined}
 */
async function GetSteamPath() {
	const steam = await regedit.list("HKCU\\SOFTWARE\\Valve\\Steam");
	const key = Object.values(steam)[0]
	if (!key.exists) {
		return undefined;
	}
	return path.normalize(key.values["SteamPath"].value);
}

/**
 * @param {number} app_id
 * @returns {string|undefined}
 */
async function GetAppPath(app_id) {
	const steam = await GetSteamPath();
	if (steam == undefined) {
		return undefined;
	}
	const libraryfolders_vdf = path.join(steam, "config", "libraryfolders.vdf");
	if (!fs.existsSync(libraryfolders_vdf)) {
		return undefined;
	}
	const libraryfolders = parse_kv(fs.readFileSync(libraryfolders_vdf));
	for (let i=0; i<Object.keys(libraryfolders["libraryfolders"]).length; i++) {
		const catalogue = Object.values(libraryfolders["libraryfolders"])[i];
		if (Object.keys(catalogue["apps"]).includes(app_id.toString())) {
			const app_path = path.normalize(catalogue["path"]);
			if (fs.existsSync(app_path)) {
				return app_path;
			}
		}
	}
	return undefined;
}

/**
 * @returns {string|undefined}
 */
async function GetDotaPath() {
	const app_path = await GetAppPath(570);
	if (app_path == undefined) {
		return undefined;
	}
	const dota2path = path.join(app_path, "steamapps", "common", "dota 2 beta");
	if (!fs.existsSync(path.join(dota2path, "game", "bin", "win64", "dota2.exe"))) {
		return undefined;
	}
	return dota2path;
}

/**
 * @param {boolean} online_mode
 * @returns {string}
 */
async function GetItemsGame(online_mode) {
	if (!online_mode) {
		console.log("[Updater] Opening pak01_dir.vpk");
		const pak01_dir = new VPK(path.join(dota2, "game", "dota", "pak01_dir.vpk"));
		pak01_dir.load();
		console.log("[Updater] +");
		console.log("[Updater] Opening items_game.txt");
		const items_game = pak01_dir.getFile("scripts/items/items_game.txt");
		console.log("[Updater] +");
		return items_game;
	} else {
		console.log("[Updater] Obtaining items_game.txt from online");
		const r = request_sync("GET", ITEMS_GAME_URL);
		const items_game = r.getBody();
		console.log("[Updater] +");
		return items_game;
	}
}

/**
 * @param {KeyValues} items_game
 * @returns {Array<string>}
 */
async function GetConfiguredParticles(items_game) {
	const particles = [];
	for (const asset of items_game.FindKey("items_game").FindKey("attribute_controlled_attached_particles").FindAll(()=>(true))) {
		const particle_name = asset.FindKey("system").GetValue();
		particles.push(particle_name);
	}
	return particles;
}

/**
 * @param {string} particle_name
 * @param {string} dota2path
 * @param {string?} particle_type
 * @returns {Object<string, {pattach?: string, control_points?: Object<string, {pattach?: string, attach?: string}}}
 */
async function GetParticleInfo(particle_name, dota2path, particle_type) {
	const particle_info = {};
	const particle_path = path.join(dota2path, "content", "dota", path.normalize(particle_name));
	if (!fs.existsSync(particle_path)) {
		not_existing_particles.push(particle_name);
		return {};
	}
	const particle_kv3 = await KeyValues3.Load(particle_path);
	const particle_kv = particle_kv3.toObject();
	if (particle_kv["m_controlPointConfigurations"] != undefined) {
		for (const config of particle_kv["m_controlPointConfigurations"]) {
			if (config["m_drivers"] != undefined) {
				for (const cp of config["m_drivers"]) {
					const index = parseInt(cp["m_iControlPoint"] ?? "0");
					let attachtype = ATTACH_TYPES[cp["m_iAttachType"] ?? ""] ?? "absorigin_follow";
					if (particle_type == "particle_create" && attachtype == "worldorigin") {
						attachtype = "absorigin_follow";
					}
					const attachname = cp["m_attachmentName"];
					const owner = cp["m_entityName"];
					if ((index == 0 && attachtype == "absorigin_follow") || (particle_type == "particle" && attachtype == "worldorigin")) {
						continue;
					}
					if (particle_info["control_points"] == undefined) {
						particle_info["control_points"] = {};
					}
					particle_info["control_points"][index] = {"pattach": attachtype};
					if (attachname != undefined) {
						particle_info["control_points"][index]["attach"] = attachname;
					}
					if (owner != undefined) {
						particle_info["control_points"][index]["owner"] = owner ?? "self";
					}
				}
			}
		}
	}
	if (Object.keys(particle_info).length == 0) {
		non_configurable_particles.push(particle_name);
	} else {
		particle_info["create_on_equip"] = particle_type == "particle_create";
	}
	return particle_info;
}

/**
 * @param {KeyValues} asset
 * @param {Array<string>} exceptions
 * @param {string} dota2path
 * @param {number?} current_style
 * @param {Object?} particles
 * @returns {particles?: {Object<string, {pattach?: string, control_points?: Object<string, {pattach?: string, attach?: string}}}, styles?: {particles?: {Object<string, {pattach?: string, control_points?: Object<string, {pattach?: string, attach?: string}}}}}
 */
async function ReadParticleAsset(asset, exceptions, dota2path, current_style, particles) {
	particles = particles ?? {};
	if (asset.Key == "styles") {
		for (const styled_asset of asset.FindAll(() => (true))) {
			await ReadParticleAsset(styled_asset, exceptions, dota2path, styled_asset.Key, particles);
		}
	} else {
		const type = asset.FindKey("type");
		if (type != undefined && ["particle", "particle_create"].includes(type.GetValue())) {
			const particle = asset.FindKey("modifier");
			if (particle != undefined) {
				const particle_name = particle.GetValue();
				if (!exceptions.includes(particle_name)) {
					const style = parseInt(asset.FindKey("style") != undefined ? asset.FindKey("style").GetValue() : current_style);
					const particle_info = await GetParticleInfo(particle_name, dota2path, type.GetValue());
					if (Object.keys(particle_info).length > 0) {
						if (isNaN(style) || style == -1) {
							if (particles["particles"] == undefined) {
								particles["particles"] = {};
							}
							particles["particles"][particle_name] = particle_info;
						} else {
							if (particles["styles"] == undefined) {
								particles["styles"] = {};
							}
							if (particles["styles"][style] == undefined) {
								particles["styles"][style] = {"particles": {}};
							}
							particles["styles"][style]["particles"][particle_name] = particle_info;
						}
					}
				}
			}
		}
	}
	return particles
}

/**
 * @param {KeyValues} items_game
 * @param {Array<string>} exceptions
 * @param {string} dota2path
 * @returns {Object<string, {particles?: {Object<string, {pattach?: string, control_points?: Object<string, {pattach?: string, attach?: string}}}, styles?: {particles?: {Object<string, {pattach?: string, control_points?: Object<string, {pattach?: string, attach?: string}}}}}}
 */
async function GetConfigurableParticles(items_game, exceptions, dota2path) {
	const particles = {};
	const items = items_game.FindKey("items_game").FindKey("items");
	process.stdout.write(`[Updater] Reading items particle`);
	for (const item of items.FindAll(() => true)) {
		const item_id = item.Key;
		const visuals = item.FindKey("visuals");
		if (visuals == undefined) {
			continue;
		}
		const item_name = (item.FindKey("item_name") ?? item.FindKey("name")) != undefined ? (item.FindKey("item_name") ?? item.FindKey("name")).GetValue() : item_id.toString();
		process.stdout.write("\r\x1b[K");
		process.stdout.write(`[Updater] Reading particles of ${item_name}\r`);
		for (const visual of visuals.FindAll((kv) => (["styles", "asset_modifier"].includes(kv.Key)))) {
			const item_info = await ReadParticleAsset(visual, exceptions, dota2path);
			if (Object.keys(item_info).length > 0) {
				particles[item_id] = mergeDeep(particles[item_id] ?? {}, item_info);
			}
		}
	}
	process.stdout.write("\r\x1b[K");
	process.stdout.write("[Updater] Done\r\n");
	return particles;
}

/**
 * @param {boolean} online_mode
 * @returns {string}
 */
async function GetDotaEnglish(online_mode) {
	if (!online_mode) {
		console.log("[Updater] Opening pak01_dir.vpk");
		const pak01_dir = new VPK(path.join(dota2, "game", "dota", "pak01_dir.vpk"));
		pak01_dir.load();
		console.log("[Updater] +");
		console.log("[Updater] Opening dota_english.txt");
		const items_game = pak01_dir.getFile("resource/localozation/dota_english.txt");
		console.log("[Updater] +");
		return items_game;
	} else {
		console.log("[Updater] Obtaining dota_english.txt from online");
		const r = request_sync("GET", DOTA_ENGLISH_URL);
		const items_game = r.getBody();
		console.log("[Updater] +");
		return items_game;
	}
}

/**
 * @param {string} text
 * @param {KeyValues} dota_english
 * @return {string}
 */
function Localize(text, dota_english) {
	const ref = (text.startsWith("#") ? text.slice(1) : text).toLowerCase();
	const data = dota_english.Find((kv) => kv.Key.toLowerCase() == ref);
	return data != undefined ? data.GetValue() ?? text : text;
}

/**
 * @param {string} localized_text
 * @param {KeyValues} dota_english
 * @return {string}
 */
function DeLocalize(localized_text, dota_english) {
	const ref = localized_text.toLowerCase();
	const data = dota_english.Find((kv) => (kv.GetValue().toLowerCase() == ref));
	return data != undefined ? data.Key : localized_text;
}

/**
 * @param {HTMLElement} html
 * @param {KeyValues} items_game
 * @param {Object<string, string>} dota_english
 * @returns {Object<string, number>}
 */
function GetKineticItems(html, items_game, dota_english) {
	const content = html.getElementById("content");
	const mw_parser_output = content.querySelector(".mw-parser-output");
	const wikitables = mw_parser_output.querySelectorAll('table.wikitable[style*="text-align:center"]');
	const kinetics = {};
	const kinetic_infos = {};
	const items = items_game.FindKey("items_game").FindKey("items");
	process.stdout.write(`[Updater] Reading kinetics`);
	for (const wikitable of wikitables) {
		const table = tabletojson.convert(`<table>${wikitable.innerHTML}</table>`, {stripHtmlFromCells: false})[0];
		for (const row of table) {
			const default_on_html = parse_html(row["Default On"]).querySelectorAll("*").map((item) => (item.text.trim()));
			const default_items = items.FindAll((kv) => (default_on_html.includes(kv.FindKey("name").GetValue())));
			const gem_html = parse_html(row["Gem"]).querySelectorAll("*").map((gem) => (gem.text.trim()));
			for (const gem of gem_html) {
				kinetic_infos[gem.startsWith("Kinetic: ") ? gem.slice("Kinetic: ".length) : gem] = default_items.map((kv) => kv.Key);
			}
		}
	}
	for (const asset_modifier of items_game.FindKey("items_game").FindKey("asset_modifiers").GetChildren()) {
		const loc_name = asset_modifier.FindKey("loc_key");
		if (loc_name == undefined) {
			continue;
		}
		const localized_name = Localize(loc_name.GetValue(), dota_english);
		process.stdout.write("\r\x1b[K");
		process.stdout.write(`[Updater] Reading kinetic of ${localized_name}\r`);
		const name = asset_modifier.FindKey("name").GetValue();
		const default_items = kinetic_infos[localized_name];
		if (default_items == undefined || default_items.length <= 0) {
			continue;
		}
		kinetics[name] = default_items;
		delete kinetic_infos[localized_name];
	}
	non_configured_kinetics.push(...Object.keys(kinetic_infos))
	process.stdout.write("\r\x1b[K");
	process.stdout.write("[Updater] Done\r\n");
	return kinetics;
}

/**
 * @returns {string}
 */
async function GetKineticHTML() {
	return fs.readFileSync("kinetic.html");
}

async function main() {
	console.log("[Updater] Looking for dota 2");
	const dota2 = await GetDotaPath();
	if (!fs.existsSync(dota2)) {
		console.log("ERROR: No dota 2 found");
		return;
	}
	console.log("[Updater] +");
	const items_game_txt = await GetItemsGame(ONLINE_MODE);
	fs.writeFileSync("items_game.txt", items_game_txt);
	console.log("[Updater] Reading items_game.txt");
	const items_game = await KeyValues.Load("items_game.txt");
	console.log("[Updater] +");
	console.log("[Updater] Obtaining list with already configured particles");
	const configured_particles = await GetConfiguredParticles(items_game);
	console.log("[Updater] +");
	console.log("[Updater] Configuring particles");
	const particles = await GetConfigurableParticles(items_game, configured_particles, dota2);
	console.log("[Updater] +");
	if (not_existing_particles.length > 0) {
		console.log(`[Updater] Particles that are not in content folder: ${not_existing_particles.map((fx) => ('"' + fx + '"')).join(", ")}`);
	} else {
		console.log("[Updater] All particles are exists!");
	}
	if (non_configurable_particles.length > 0) {
		console.log(`[Updater] There are ${non_configurable_particles.length} particles without auto-configuration!`);
		fs.writeFileSync("non_configurable_particles.txt", non_configurable_particles.join("\n"));
	} else {
		console.log("[Updater] All particles are auto-configurable!");
		fs.writeFileSync("non_configurable_particles.txt", "");
	}
	const dota_english_txt = await GetDotaEnglish(ONLINE_MODE);
	fs.writeFileSync("dota_english.txt", dota_english_txt);
	const dota_english = (await KeyValues.Load("dota_english.txt")).FindKey("lang").FindKey("Tokens");
	console.log("[Updater] Obtaining dota 2 wiki kinetic HTML page");
	const kinetic_html = parse_html(await GetKineticHTML());
	console.log("[Updater] +");
	console.log("[Updater] Configuring kinetic items");
	const kinetic_gems = await GetKineticItems(kinetic_html, items_game, dota_english);
	console.log("[Updater] +");
	if (non_configured_kinetics.length > 0) {
		console.log(`[Updater] There are ${non_configured_kinetics.length} kinetic gems without auto-configuration!`);
		fs.writeFileSync("non_configurable_kinetics.txt", non_configured_kinetics.join("\n"));
	} else {
		console.log("[Updater] All kinetic gems are auto-configurable!")
		fs.writeFileSync("non_configurable_kinetics.txt", "");
	}
	console.log("[Updater] Merging data with manual-configured");
	const behaviors_config = mergeDeep({"items": particles, "kinetic_gems": kinetic_gems}, JSON.parse(fs.readFileSync("behaviors_manual.json")));
	console.log("[Updater] +");
	console.log("[Updater] Saving");
	const behaviors_json = JSON.stringify(behaviors_config, undefined, "\t");
	fs.writeFileSync("behaviors.json", behaviors_json);
	console.log("[Updater] +");
	// console.log("[Updater] Sending to server");
	// const form = new FormData();
	// form.append("file", fs.readFileSync("behaviors.json"));
	// form.append("token", BACKEND_TOKEN);
	// const r = await fetch(PARTICLES_SERVER_URL, {
	// 	"method": "POST",
	// 	"body": form,
	// }).then(function(res) {
	// 	return res.text();
	// }).then(function(text) {
	// 	console.log(text);
	// });
	// console.log("[Updater] +");
}

main();