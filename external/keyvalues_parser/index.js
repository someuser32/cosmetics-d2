import {KeyValues, KeyValues3} from "easy-keyvalues";
import {VPK} from "vpk2";
import {promisified as regedit} from "regedit";
import {parse} from "kvparser";
import rdiff from "recursive-diff";
const {getDiff} = rdiff;
import * as fs from "node:fs";
import path from "path";
import * as util from "node:util";


const FILENAME = "items_game.txt";


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
 * @param {Object} source
 * @returns {Object}
 */
function mergeDeep(target, source) {
	let output = Object.assign({}, target);

	if (isObject(target) && isObject(source)) {
		Object.keys(source).forEach(key => {
			if (isObject(source[key]) && Array.isArray(output[key])) {
				output[key] = Object.assign({"___$$$array": output[key]}, source[key]);
			} else if (Array.isArray(source[key]) && isObject(output[key])) {
				if (output[key]["___$$$array"] == undefined) {
					output[key]["___$$$array"] = [];
				}
				output[key]["___$$$array"].push(...source[key]);
			} else if (isObject(source[key]) && isObject(output[key])) {
				output[key] = mergeDeep(output[key], source[key]);
			} else if (Array.isArray(source[key]) && Array.isArray(output[key])) {
				output[key] = output[key].concat(source[key]);
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
 * @param {string} filepath
 * @returns {string?}
 */
async function SaveFile(filepath) {
	return fs.writeFileSync(path.parse(filepath).name, await GetFile(filepath));
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
	console.log("parsing", kv.Key)
	const kv_interface = {};
	const [group_name, group_type] = GetGroupForKV(kv, kv_types);
	const keyname = group_name != undefined ? `[${group_name}: ${group_type}]` : kv.Key
	if (kv.HasChildren()) {
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
		if (parent_obj != undefined) {
			if (parent_obj[keyname] != undefined) {
				for (const key of Object.keys(parent_obj[keyname])) {
					if (parsed_kv[keyname][key] == undefined) {
						if (Array.isArray(parent_obj[keyname][key]) && !parent_obj[keyname][key].includes("undefined")) {
							parent_obj[keyname][key].push("undefined");
						}
					}
				}
			}
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
	} else {
		const type = GetValueType(kv.value);
		kv_interface[keyname] = [type];
	}
	return kv_interface;
}

/**
 * @param {KeyValues} kv
 * @returns {Array<string>}
 */
function GetKVPath(kv) {
	const kv_path = [];
	let parent = kv.GetParent();
	while (parent != undefined) {
		if (parent.Key == "__KeyValues_Root__") {
			break;
		}
		kv_path.unshift(parent.Key);
		parent = parent.GetParent();
	}
	return kv_path;
}

const groups_cache = {};
/**
 * @param {KeyValues} kv
 * @param {KeyValues} kv_types
 * @returns {Array<string, string>}
 */
function GetGroupForKV(kv, kv_types) {
	const hash = GetKVPath(kv).join("|");
	if (groups_cache[hash] != undefined) {
		return groups_cache[hash];
	}
	console.log("get group", kv.Key);
	let kv_path = [];
	let parent = kv.GetParent();
	while (parent != undefined) {
		if (parent.Key == "__KeyValues_Root__") {
			break;
		}
		kv_path.unshift(GetGroupForKV(parent, kv_types)[0] || parent.Key);
		parent = parent.GetParent();
	}
	let child = kv_types;
	for (const current_key of kv_path) {
		child = child.FindKey(current_key);
		if (child == undefined || !child.HasChildren()) {
			groups_cache[hash] = [];
			return [];
		}
	}
	for (const child_kv of child.FindAll(() => (true))) {
		let [group_type, regex] = [child_kv.FindKey("___$$$types"), child_kv.FindKey("___$$$regex")];
		if (group_type != undefined) {
			[group_type, regex] = [Object.keys(group_type.toObject()).join(" | ").replaceAll("'", "\""), regex.GetValue()];
			const regexp = new RegExp(regex);
			if (regex != "" && regexp.exec(kv.Key) != null) {
				groups_cache[hash] = [child_kv.Key, group_type];
				return [child_kv.Key, group_type];
			}
		}
	}
	groups_cache[hash] = [];
	return [];
}

function generateTypeScriptInterface(obj, indent=1) {
	function convertValue(value) {
		if (Array.isArray(value)) {
			return `${value.join(" | ")}`;
		} else if (typeof value === 'object' && value !== null) {
			if (value["___$$$kv_parser_maybe_undefined"] != undefined) {
				delete value["___$$$kv_parser_maybe_undefined"];
			}
			let other_types = undefined;
			if (value["___$$$array"] != undefined) {
				other_types = value["___$$$array"].slice();
				delete value["___$$$array"];
			}
			return other_types != undefined && other_types.length > 0 ? `${generateTypeScriptInterface(value, indent + 1)} | ${convertValue(other_types)}` : generateTypeScriptInterface(value, indent + 1);
		} else {
			return value;
		}
	}

	let interfaceString = '{\n';
	for (const key in obj) {
		interfaceString += '\t'.repeat(indent);
		const optionalSyntax = obj[key]["___$$$kv_parser_maybe_undefined"] === 1 || (Array.isArray(obj[key]) && obj[key].includes("undefined")) ? '?' : '';
		const types = convertValue(obj[key]).split(" | ").filter((v, i, a) => v != "undefined").join(" | ");
		const keyname = (!key.startsWith("[") && !key.endsWith("]") && key.indexOf(" ") !== -1) || ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].some((char, i, a) => (key.startsWith(char))) || ["/", "'"].some((char, i, a) => (key.indexOf(char) !== -1)) ? `"${key}"` : key;
		const use_optional = !keyname.endsWith("]");
		interfaceString += `${keyname}${use_optional ? optionalSyntax : ""}: ${types}${!use_optional && optionalSyntax == "?" ? " | undefined" : ""},\n`;
	}
	interfaceString += '\t'.repeat(indent - 1) + '}';
	return interfaceString;
}


async function main() {
	const items_game_kv = await KeyValues.Load(FILENAME);
	const items_game_types_kv = await KeyValues.Load(`${path.parse(FILENAME).name}_types${path.extname(FILENAME)}`);
	console.log("start")
	const interface_kv = ParseKeyValues(items_game_kv, items_game_types_kv)["__KeyValues_Root__"];
	const interface_string = `interface ${Object.keys(interface_kv)[0]} ${generateTypeScriptInterface(interface_kv)};`;
	fs.writeFileSync(`${path.parse(FILENAME).name}.d.ts`, interface_string);
}

main();