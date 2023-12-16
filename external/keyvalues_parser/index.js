import {KeyValues, KeyValues3} from "easy-keyvalues";
import {VPK} from "vpk2";
import {promisified as regedit} from "regedit";
import {parse} from "kvparser";
import rdiff from "recursive-diff";
const {getDiff} = rdiff;
import * as fs from "node:fs";
import * as util from "node:util";
import path from "path";


/**
 * Simple object check.
 * @param {any} item
 * @returns {boolean}
 */
function isObject(item) {
	return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Deep merge two objects and array contents.
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
					Object.assign(output, {[key]: source[key]});
				} else {
					output[key] = mergeDeep(target[key], source[key]);
				}
			} else if (Array.isArray(source[key])) {
				if (target[key] == undefined) {
					Object.assign(output, {[key]: source[key]});
				} else {
					output[key].push(...source[key]);
				}
			} else {
				Object.assign(output, {[key]: source[key]});
			}
		});
	}
	return output;
}

/**
 * @param {Array} arr1
 * @param {Array} arr2
 * @returns {boolean}
 */
function isArrayEquals(arr1, arr2) {
	if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
		return false;
	}
	if (arr1.length != arr2.length) {
		return false;
	}
	return arr1.every((v) => {
		return arr2.includes(v);
	});
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
	const libraryfolders = parse(fs.readFileSync(libraryfolders_vdf));
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
	};
	const dota2path = path.join(app_path, "steamapps", "common", "dota 2 beta");
	if (!fs.existsSync(path.join(dota2path, "game", "bin", "win64", "dota2.exe"))) {
		return undefined;
	};
	return dota2path;
};

/**
 * @param {string} filepath
 * @returns {string?}
 */
async function GetFileFromVPK(filepath) {
	const dota2 = await GetDotaPath();
	const pak01_dir = new VPK(path.join(dota2, "game", "dota", "pak01_dir.vpk"));
	pak01_dir.load();
	return pak01_dir.getFile(path);
}

/**
 * @param {string} filepath
 * @param {number?} state
 * @returns {string?}
 */
async function GetFile(filepath, state) {
	if (!fs.existsSync(filepath)) {
		const current_state = state ?? 0;
		filepath = filepath;
		switch (current_state) {
			case 0:
				filepath = path.join(await GetDotaPath(), "game", "dota", filepath);
				break;

			case 1:
				filepath = path.join(await GetDotaPath(), "content", "dota", filepath);

			default:
				return await GetFileFromVPK(filepath);
		}
		return await GetFile(filepath, current_state + 1);
	}
	return fs.readFileSync(filepath);
}


/**
 * @param {any} value
 * @returns {"number" | "string" | "object" | "unknown"}
 */
function GetValueType(value) {
	if (!isNaN(parseFloat(value)) && !isNaN(Number(value)) ) {
		return "number";
	} else if (typeof value == "string") {
		return "string";
	} else if (typeof value == "object") {
		return "object";
	}
	return "unknown";
}

/**
 * @param {Object} kv_types
 * @returns {Object}
 */
function MakeTypesArrayUnique(kv_types) {
	for (const [key, value] of Object.entries(kv_types)) {
		if (Array.isArray(value)) {
			kv_types[key] = value.filter((v, i, a) => (a.indexOf(v) == i));
		} else if (typeof value == "object") {
			MakeTypesArrayUnique(value);
		}
	}
}

/**
 * @param {KeyValues} kv
 * @param {KeyValues} kv_types
 * @param {Object?} parent_obj
 * @returns {Object}
 */
function ParseKeyValues(kv, kv_types, parent_obj) {
	const kv_interface = {};
	if (kv.HasChildren()) {
		const [group_name, group_type] = GetGroupForKV(kv, kv_types);
		const keyname = group_name != undefined ? `[${group_name}: ${group_type}]` : kv.Key
		const parsed_kv = {};
		let new_interface = undefined;
		for (const kv_child of kv.GetChildren()) {
			const parsed_types = ParseKeyValues(kv_child, kv_types, new_interface);
			const parsed_types_copy = Object.assign({}, parsed_types);
			if (parent_obj != undefined && parent_obj[keyname]) {
				for (const key of Object.keys(parsed_types)) {
					if (parent_obj[keyname][key] == undefined) {
						if (Array.isArray(parsed_types[key]) && !parsed_types[key].includes("undefined")) {
							parsed_types[key].push("undefined");
						}
					}
				}
			}
			if (parsed_kv[keyname] == undefined) {
				parsed_kv[keyname] = {};
			}
			if (new_interface == undefined) {
				new_interface = {};
			}
			new_interface = mergeDeep(new_interface, parsed_types);
			MakeTypesArrayUnique(new_interface);
			parsed_kv[keyname] = mergeDeep(parsed_kv[keyname], parsed_types_copy);
			MakeTypesArrayUnique(parsed_kv[keyname]);
		}
		if (kv_interface[keyname] == undefined) {
			kv_interface[keyname] = {};
		}
		if (group_name != undefined && parent_obj != undefined) {
			const difference = getDiff(parent_obj, parsed_kv);
			for (const diff of difference) {
				if (["add", "delete"].includes(diff["op"])) {
					let int = parent_obj;
					for (const p of diff["path"]) {
						int = int[p];
					}
					if (Array.isArray(diff["val"])) {
						if (!diff["val"].includes("undefined")) {
							diff["val"].push("undefined");
						}
					} else if (typeof diff["val"] == "object") {
						diff["val"]["___$$$kv_parser_maybe_undefined"] = 1;
					}
				}
			}
		}
		kv_interface[keyname] = mergeDeep(kv_interface[keyname], new_interface);
		// for (const key of Object.keys(kv_interface[keyname])) {
		// 	if (!parsed_keys.includes(key)) {
		// 		if (Array.isArray(kv_interface[keyname][key]) && !kv_interface[keyname][key].includes(undefined)) {
		// 			kv_interface[keyname][key].push(undefined);
		// 		} else if (kv_interface[keyname][key]["___$$$kv_parser_maybe_undefined"] == undefined) {
		// 			kv_interface[keyname][key]["___$$$kv_parser_maybe_undefined"] = 1;
		// 		}
		// 	}
		// }
	} else {
		const type = GetValueType(kv.value);
		kv_interface[kv.Key] = [type];
	}
	return kv_interface;
}

/**
 * @param {KeyValues} kv
 * @param {KeyValues} kv_types
 * @returns {Array<string, string>}
 */
function GetGroupForKV(kv, kv_types) {
	let kv_path = [];
	let parent = kv.GetParent();
	while (parent != undefined) {
		if (parent.Key == "__KeyValues_Root__") {
			break;
		}
		kv_path.unshift(parent.Key);
		parent = parent.GetParent();
	}
	let child = kv_types;
	for (const current_key of kv_path) {
		child = child.FindKey(current_key);
		if (child == undefined || !child.HasChildren()) {
			return [];
		}
	}
	for (const child_kv of child.FindAll(() => (true))) {
		const keys = child_kv.Key.split("|");
		const [group_name, group_type, regex] = [keys[0], keys[1], keys.slice(2)];
		if (group_name != undefined && group_type != undefined && regex != undefined) {
			const regexp = new RegExp(regex);
			if (regexp.exec(kv.Key) != null) {
				return [group_name, group_type];
			}
		}
	}
	return [];
}


async function main() {
	const items_game_kv = await KeyValues.Load("items_game.txt");
	const items_game_types_kv = await KeyValues.Load("items_game_1.txt");
	console.log(JSON.stringify(ParseKeyValues(items_game_kv, items_game_types_kv), undefined, "\t"));
}

main();