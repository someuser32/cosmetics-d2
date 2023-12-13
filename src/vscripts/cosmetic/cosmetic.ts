import "../lib/kvparser/kvparser";
import { reloadable } from "../lib/tstl-utils";
import { GetAttribute, MathUtils, ObjectUtils, SetAttribute } from "../lib/client";
import { ATTACH_TYPES } from "./vars";

import { modifier_cosmetic_ts } from "./modifiers/modifier_cosmetic";
import { modifier_cosmetic_wearable_ts } from "./modifiers/modifier_cosmetic_wearable";
import { modifier_cosmetic_model_ts } from "./modifiers/modifier_cosmetic_model";

const ITEMS_GAME_URL = "https://raw.githubusercontent.com/spirit-bear-productions/dota_vpk_updates/main/scripts/items/items_game.txt";
// const BEHAViORS_JSON_URL = "https://pastebin.com/raw/3URRriEz";
const BEHAViORS_JSON_URL = "http://localhost:8000/behaviors.json";

declare global {
	interface ParticleManager {
		CreateParticle(particleName: string, particleAttach: ParticleAttachment, owner: CBaseEntity | undefined, source?: PlayerID) : ParticleID
	}
}


@reloadable
export class Cosmetic {
	slots : Slots = {};
	items_game : ItemsGameKV | undefined;
	items : Items = {};
	hero_items : HeroItems = {};
	model_to_ids : {[model_name : string] : number} = {};
	equipped_items : PlayersEquippedItems = {};
	behaviors_json : BehaviorsJSON = {};
	// particle_owners : {[particle : ParticleID] : [string, PlayerID]} = {}

	constructor() {
	}

	public Init(): void {
	}

	public InitOnce(): void {
		CustomGameEventManager.RegisterListener("cosmetic_request_items", (userId, event) => this.RequestItems(event));
		CustomGameEventManager.RegisterListener("cosmetic_request_equipped_items", (userId, event) => this.RequestEquippedItems(event));
		CustomGameEventManager.RegisterListener("cosmetic_equip_item", (userId, event) => this.EquipItem(event));
		this.override_methods();
	}

	private override_methods(): void {
		const valve_create_particle = ParticleManager.CreateParticle;

		ParticleManager.CreateParticle = function(particleName: string, partileAttach: ParticleAttachment, owner: CBaseEntity | undefined, source?: PlayerID): ParticleID {
			const playerOwnerID = source != undefined ? source : owner != undefined && owner.IsBaseNPC() ? owner.GetPlayerOwnerID() : -1;
			const particleReplacement = GameRules.Cosmetic.GetParticleReplacements(playerOwnerID);
			if (particleReplacement[particleName] != undefined) {
				if (particleReplacement[particleName]["name"] != undefined) {
					particleName = particleReplacement[particleName]["name"]!;
				}

				if (particleReplacement[particleName]["pattach"] != undefined) {
					partileAttach = particleReplacement[particleName]["pattach"]!;
				}
			}
			const fx = valve_create_particle.bind(this)(particleName, partileAttach, owner);
			// if (playerOwnerID != -1) {
			// 	GameRules.Cosmetic.particle_owners[fx] = [particleName, playerOwnerID];
			// }
			if (particleReplacement[particleName] != undefined && owner != undefined) {
				if (particleReplacement[particleName]["control_points"] != undefined) {
					for (const [control_point_index, control_point] of Object.entries(particleReplacement[particleName]["control_points"]!)) {
						ParticleManager.SetParticleControlEnt(fx, parseInt(control_point_index), owner, ATTACH_TYPES[control_point["pattach"] ?? ""] ?? ParticleAttachment.ABSORIGIN_FOLLOW, control_point["attach"] ?? "attach_hitloc", owner?.GetAbsOrigin(), true);
					}
				}
			}
			return fx;
		}
	}

	public PostInit(): void {
		this.InitSlots();
		this.InitItems();
		this.InitParticles();
	}

	public InitSlots(): void {
		for (const [heroname, heroinfo] of Object.entries(LoadKeyValues("scripts/npc/npc_heroes.txt") as NPCHeroesKV)) {
			if (typeof(heroinfo) == "object" && heroinfo["ItemSlots"] != undefined) {
				const slots : CosmeticSlots = {}
				for (const [slot_id, slot_info] of Object.entries(heroinfo["ItemSlots"])) {
					slots[slot_info["SlotName"]] = {
						"index": slot_info["SlotIndex"],
						"text": slot_info["SlotText"],
						"visible": slot_info["DisplayInLoadout"] ?? 1,
					}
				}
				this.slots[heroname] = {
					"slots": slots,
					"model_scale": MathUtils.roundFloat(heroinfo["ModelScale"] ?? 1, 3),
				}
				CustomNetTables.SetTableValue("cosmetic", `slots_${heroname}`, slots);
			}
		}
	}

	public InitItems(): void {
		if (this.items_game != undefined) {
			// return this.HandleItems(this.items_game);
			return;
		}

		const r = CreateHTTPRequestScriptVM("GET", ITEMS_GAME_URL);

		this.items_game = KVParser.LoadKeyValueFromString(require("./items_game"), KVParser.MODE_UNIQUE) as ItemsGameKV;
		this.HandleItems(this.items_game);

		// NOTE: memory leak after each map restart, so do not load kv multiple times
		if (!IsInToolsMode()) {
			const _this = this;

			r.Send((req: CScriptHTTPResponse) => {
				if (req.StatusCode == 200) {
					_this.items_game = KVParser.LoadKeyValueFromString(req.Body, KVParser.MODE_UNIQUE) as ItemsGameKV;
					_this.HandleItems(_this.items_game);
				}
			});
		};
	}

	public InitParticles(): void {
		if (this.behaviors_json != undefined && Object.keys(this.behaviors_json).length > 0) {
			// return;
		}

		this.behaviors_json = {} as BehaviorsJSON;

		const r = CreateHTTPRequestScriptVM("GET", BEHAViORS_JSON_URL);

		const _this = this;

		r.Send((req: CScriptHTTPResponse) => {
			if (req.StatusCode == 200) {
				const result = json.decode(req.Body)[0];
				if (result != undefined) {
					_this.behaviors_json = result as BehaviorsJSON;
				} else {
					GameRules.SendCustomMessage("[Cosmetic] Failed to get special behaviors from database: particles or styles may look wrong", 0, 0);
				}
			}
		});
	}

	public HandleItems(items_game: ItemsGameKV) {
		const attach_ids : {[particle : string] : number} = {}
		for (const [id, attach] of Object.entries(items_game["items_game"]["attribute_controlled_attached_particles"])) {
			attach_ids[attach["system"]] = parseInt(id);
		}

		const item_ids : {
			[item_name : string] : number
		} = {};
		const bundles = [];
		for (const [_item_id, item_info] of Object.entries(items_game["items_game"]["items"])) {
			const item_id = parseInt(_item_id);
			if (!isNaN(item_id) && item_info["prefab"] != undefined && ["default_item", "wearable", "bundle"].includes(item_info["prefab"])) {
				const item = Object.assign(Object.assign({}, items_game["items_game"]["prefabs"][item_info["prefab"]]), item_info)
				if (typeof(item["used_by_heroes"]) == "object") {
					const item_name = item["item_name"] ?? item["name"] ?? "unknown";
					const item_slot = item["item_slot"] ?? "weapon";
					const item_icon = item["image_inventory"] ?? "";
					const item_heroes = Object.keys(item["used_by_heroes"]) as string[];
					const item_rarity = item["item_rarity"] ?? "common";
					if (item["prefab"] == "bundle") {
						const item_bundle = item["bundle"] != undefined ? Object.keys(item["bundle"]): [];
						this.items[item_id] = {
							"name": item_name,
							"slot": item_slot,
							"icon": item_icon,
							"heroes": item_heroes,
							"rarity": item_rarity,
							"bundle": item_bundle,
							"styles": 1,
							"type": item["prefab"],
						};
						bundles.push(item_id);
					} else {
						const item_model = item["model_player"] ?? "";
						const item_visuals = item["visuals"] ?? {};
						for (const [_, asset] of Object.entries(item_visuals)) {
							if (asset != null && typeof(asset) == "object") {
								if (["particle", "particle_create"].includes(asset["type"])) {
									const attach_id = attach_ids[asset["modifier"]]
									if (attach_id != undefined) {
										item_visuals[_]["attachments"] = items_game["items_game"]["attribute_controlled_attached_particles"][attach_id];
									}
								}
							}
						}
						const item_styles = item_visuals["styles"] != undefined ? Object.keys(item_visuals["styles"]).length : 1;
						this.items[item_id] = {
							"name": item_name,
							"slot": item_slot,
							"icon": item_icon,
							"heroes": item_heroes,
							"rarity": item_rarity,
							"model": item_model,
							"visuals": item_visuals,
							"styles": item_styles,
							"type": item["prefab"] ?? "no_prefab",
						};
						item_ids[item["name"]] = item_id;
						this.model_to_ids[item_model] = item_id;
					}
				}
			}
		}

		for (const bundle_id of bundles) {
			const bundle_info = this.items[bundle_id] as Bundle;
			let styles = bundle_info["styles"];
			const bundle = [];
			for (const item_name of bundle_info["bundle"]) {
				const item_id = item_ids[item_name];
				if (item_id != undefined) {
					styles = Math.max(styles, this.items[item_id]["styles"]);
					bundle.push(item_id);
				}
			}
			this.items[bundle_id]["styles"] = styles;
			(this.items[bundle_id] as Bundle)["bundle"] = bundle;
		}

		for (const [item_id, item] of Object.entries(this.items)) {
			for (const hero of item["heroes"]) {
				if (this.hero_items[hero] == undefined) {
					this.hero_items[hero] = {};
				}
				if (this.hero_items[hero][item["slot"]] == undefined) {
					this.hero_items[hero][item["slot"]] = {};
				}
				this.hero_items[hero][item["slot"]][parseInt(item_id)] = item;
			}
		}
	}

	public GetEquippedItems(playerID: PlayerID): CosmeticEquippedItems {
		if (this.equipped_items[playerID] == undefined) {
			return {} as CosmeticEquippedItems;
		}
		const hero = PlayerResource.GetSelectedHeroEntity(playerID);
		if (!IsValidEntity(hero)) {
			return {} as CosmeticEquippedItems;
		}
		return this.equipped_items[playerID][hero.GetUnitName()] ?? {} as CosmeticEquippedItems;
	}

	public GetAvaiableItems(playerID: PlayerID): CosmeticHeroItems {
		const hero = PlayerResource.GetSelectedHeroEntity(playerID);
		if (!IsValidEntity(hero)) {
			return {} as CosmeticHeroItems;
		}
		const heroname = hero.GetUnitName();
		const items : CosmeticHeroItems = {};
		for (const [slot, hero_items] of Object.entries(this.hero_items[heroname] || {})) {
			items[slot] = {}
			for (const [item_id, item] of Object.entries(hero_items)) {
				items[slot][item_id] = Object.assign({"avaiable": 1}, ObjectUtils.filter(item, ([key, value]) => (["name", "slot", "icon", "rarity", "styles", "type"].includes(key as string))));
			}
		}
		return items
	}

	private RequestItems(event: NetworkedData<CustomGameEventDeclarations["cosmetic_request_items"] & { PlayerID: PlayerID }>): void {
		const player = PlayerResource.GetPlayer(event.PlayerID);
		if (player == undefined) {
			return;
		}
		const items = this.GetAvaiableItems(event.PlayerID);
		CustomGameEventManager.Send_ServerToPlayer(player, "cosmetic_respond_items", {"items": items});
	}

	private RequestEquippedItems(event: NetworkedData<CustomGameEventDeclarations["cosmetic_request_equipped_items"] & { PlayerID: PlayerID }>): void {
		const player = PlayerResource.GetPlayer(event.PlayerID);
		if (player == undefined) {
			return;
		}
		const items = this.GetEquippedItems(event.PlayerID);
		CustomGameEventManager.Send_ServerToPlayer(player, "cosmetic_respond_equipped_items", {"items": items});
	}

	private EquipItem(event: NetworkedData<CustomGameEventDeclarations["cosmetic_equip_item"] & { PlayerID: PlayerID }>): void {
		if (event.item == undefined) {
			return;
		}
		const item = this.items[event.item];
		if (item == undefined) {
			return;
		}

		const hero = PlayerResource.GetSelectedHeroEntity(event.PlayerID)
		if (!IsValidEntity(hero)) {
			return;
		}
		const heroname = hero.GetUnitName()

		if (this.equipped_items[event.PlayerID] == undefined) {
			this.equipped_items[event.PlayerID] = {}
		}
		if (this.equipped_items[event.PlayerID][heroname] == undefined) {
			this.equipped_items[event.PlayerID][heroname] = {}
		}

		if (!this._EquipItem(event.PlayerID, event.item, event.style ?? 1, false)) {
			return;
		}
		this.equipped_items[event.PlayerID][heroname][item["slot"]] = {"item": event.item, "style": event.style ?? -1}

		this.RequestEquippedItems({"PlayerID": event.PlayerID});
	}

	public _EquipItem(playerID: PlayerID, item_id: number, style: number, ignore_default_check?: boolean): boolean {
		style = style - 1
		const item = this.items[item_id] as Item;
		if (item == undefined) {
			return false;
		}
		const hero = PlayerResource.GetSelectedHeroEntity(playerID)
		if (!IsValidEntity(hero)) {
			return false;
		}
		const modifier_data = {"item_id": item_id, "model": item.model, "style": style, "name": item.name};
		let modifier = this.GetModifierForSlot(hero, item.slot);
		if (modifier != undefined) {
			if (!IsInToolsMode()) {
				modifier.OnRefresh(modifier_data);
				modifier.ForceRefresh();
			} else {
				modifier.Destroy();
				modifier = modifier_cosmetic_ts.apply(hero, hero, undefined, modifier_data);
			}
		} else {
			modifier = modifier_cosmetic_ts.apply(hero, hero, undefined, modifier_data);
		}
		modifier.ReadVisuals(item.visuals);
		modifier.ApplyVisuals();
		// if (!ignore_default_check) {
		// 	const default_equipped = item["type"] == "default_item";
		// 	if (default_equipped) {
		// 		for (const [slot, data] in Object.entries(this.equipped_items[playerID][hero.GetUnitName()])) {
		// 			const equipped_item = slot != item["slot"] ? this.items[data.item] : item;
		// 			if (equipped_item != undefined) {
		// 				if (equipped_item["type"] != "default_item") {
		// 					default_equipped = false;
		// 				}
		// 			}
		// 		}
		// 	}
		// 	if (default_equipped) {
		// 		Cosmetic.EquipDOTAItems(playerID);
		// 	} else {
		// 		Cosmetic.UnequipDOTAItems(playerID);
		// 	}
		// }
		return true;
	}

	public GetModifierForSlot(hero: CDOTA_BaseNPC, slot: string) : modifier_cosmetic_ts | undefined {
		for (const mod of hero.FindAllModifiersByName(modifier_cosmetic_ts.name)) {
			const modifier = mod as modifier_cosmetic_ts;
			if (modifier.kv != undefined && modifier.kv.item_id != undefined) {
				const item = this.items[modifier.kv.item_id] as Item;
				if (item != undefined && item.slot == slot) {
					return modifier;
				}
			}
		}
	}

	public RemoveSlot(playerID: PlayerID, slot: string): void {
		const hero = PlayerResource.GetSelectedHeroEntity(playerID);
		if (!IsValidEntity(hero)) {
			return;
		}
		const modifier = this.GetModifierForSlot(hero, slot);
		if (modifier != undefined) {
			modifier.Destroy();
		}
	}

	public DefaultSlot(playerID: PlayerID, slot: string, ignore_default_check?: boolean): void {
		const hero = PlayerResource.GetSelectedHeroEntity(playerID)
		if (!IsValidEntity(hero)) {
			return;
		}
		const hero_items = this.hero_items[hero.GetUnitName()][slot];
		if (hero_items != undefined) {
			for (const [item_id, item] of Object.entries(hero_items)) {
				if (item.type == "default_item") {
					this._EquipItem(playerID, parseInt(item_id), 1, ignore_default_check);
					return;
				}
			}
		}
		this.RemoveSlot(playerID, slot);
	}

	public GetItemIDFromModel(model: string): number | undefined {
		return this.model_to_ids[model];
	}

	public GetDOTAWearableForSlot(hero : CDOTA_BaseNPC, slot: string): CBaseEntity | undefined {
		for (const child of hero.GetChildren()) {
			if (IsValidEntity(child) && child.GetClassname() == "dota_item_wearable") {
				const modelname = child.GetModelName();
				if (modelname != "") {
					const item_id = this.GetItemIDFromModel(modelname);
					if (item_id != undefined) {
						const item = this.items[item_id] as Item;
						if (item != undefined) {
							if (item["slot"] == slot) {
								return child;
							}
						}
					}
				}
			}
		}
	}

	public UnequipDOTAItems(playerID: PlayerID): void {
		// NOTE:
		// for unknown reason, valve does not give us any way to remove their wearables
		// neither of SetParent, SetModel, AddEffects, Destroy, UTIL_Remove works
		// idk how to fix it without using kv DisableWearables 1
		// if you know, PM me at steam

		// const hero = PlayerResource.GetSelectedHeroEntity(playerID)
		// if (!IsValidEntity(hero)) {
		// 	return;
		// }
		// const slots = this.hero_items[hero.GetUnitName()];
		// if (slots != undefined) {
		// 	for (const slot of Object.keys(slots)) {
		// 		const wearable = this.GetDOTAWearableForSlot(hero, slot);
		// 		if (wearable != undefined) {
		// 			SetAttribute(hero, "__cosmetic_dota_items", Object.assign(GetAttribute(hero, "__cosmetic_dota_items", {}), {[slot]: this.GetItemIDFromModel(wearable.GetModelName())}));
		// 			// wearable.SetParent(undefined, undefined);
		// 			// wearable.SetModel("models/development/invisiblebox.vmdl");
		// 			wearable.AddEffects(EntityEffects.EF_NODRAW);
		// 			wearable.Destroy();
		// 			UTIL_Remove(wearable);
		// 		}
		// 		if (this.GetModifierForSlot(hero, slot) == undefined) {
		// 			this.DefaultSlot(playerID, slot, true);
		// 		}
		// 	}
		// };
		// for (const child of hero.GetChildren()) {
		// 	if (IsValidEntity(child) && child.GetClassname() == "dota_item_wearable") {
		// 		if (child.GetModelName() == "") {
		// 			// child.SetParent(undefined, undefined);
		// 			// child.SetModel("models/development/invisiblebox.vmdl");
		// 			child.AddEffects(EntityEffects.EF_NODRAW);
		// 			child.Destroy();
		// 			UTIL_Remove(child);
		// 		}
		// 	}
		// }
	}

	public EquipDOTAItems(playerID: PlayerID) {
		const hero = PlayerResource.GetSelectedHeroEntity(playerID);
		if (!IsValidEntity(hero)) {
			return;
		}
		if (this.equipped_items[playerID] != undefined) {
			delete this.equipped_items[playerID][hero.GetUnitName()];
		}
		// const dota_items : DOTAEquippedItems = GetAttribute(hero, "__cosmetic_dota_items", {});
		// for (const [slot, slot_info] of Object.entries(this.slots[hero.GetUnitName()]["slots"])) {
		// 	if (typeof slot != "string") {
		// 		continue;
		// 	}
		// 	const item_id = dota_items[slot];
		// 	if (item_id != undefined) {
		// 		this._EquipItem(playerID, item_id, 1, true);
		// 	} else {
		// 		this.DefaultSlot(playerID, slot, true);
		// 	}
		// }
		for (const [slot, slot_info] of Object.entries(this.slots[hero.GetUnitName()]["slots"])) {
			this.DefaultSlot(playerID, slot);
		}
	}

	public CopyWearables(hero: CDOTA_BaseNPC) {
		if (!IsValidEntity(hero)) {
			return;
		}
		const original_hero = PlayerResource.GetSelectedHeroEntity(hero.GetPlayerOwnerID());
		if (!IsValidEntity(original_hero)) {
			return;
		}
		for (const mod of original_hero.FindAllModifiersByName(modifier_cosmetic_ts.name)) {
			(mod as modifier_cosmetic_ts).CopyTo(hero);
		}
	}

	public OnNPCSpawned(npc: CDOTA_BaseNPC): void {
		if (npc.IsTrueHero()) {
			this.EquipDOTAItems(npc.GetPlayerOwnerID());
		} else {
			this.CopyWearables(npc);
		}
	}

	public GetParticleReplacements(playerID: PlayerID): ParticleReplacements {
		const replacements : ParticleReplacements = {};
		const hero = PlayerResource.GetSelectedHeroEntity(playerID);
		if (!IsValidEntity(hero)) {
			return replacements;
		}
		for (const mod of hero.FindAllModifiersByName(modifier_cosmetic_ts.name)) {
			const modifier = mod as modifier_cosmetic_ts;
			Object.assign(replacements, modifier.particle_replacements);
		}
		return replacements;
	}
}