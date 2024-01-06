// [x] hero model replacement
// [x] particle replacement
// [x] ranged projectile replacement
// [x] styles
// [x] translate activity
// [x] unit model replacement
// [x] sound replacement
// [x] wearable model replacement
// [x] hero icon replacement
// [x] ability icon replacement
// [x] item icon replacement
// [x] bundles
// [ ] prismatic gems
// [ ] kinetic gems
// [ ] taunts
// [ ] apply when equipped ability effect
// [ ] voice


import "../lib/kvparser/kvparser";
import { reloadable } from "../lib/tstl-utils";
import { GetAttribute, MathUtils, ObjectUtils, SetAttribute, hexToRGB } from "../lib/client";
import { ATTACH_TYPES } from "./vars";

import { modifier_cosmetic_ts } from "./modifiers/modifier_cosmetic";
import { modifier_cosmetic_wearable_ts } from "./modifiers/modifier_cosmetic_wearable";
import { modifier_cosmetic_model_ts } from "./modifiers/modifier_cosmetic_model";

const ITEMS_GAME_URL = "https://raw.githubusercontent.com/spirit-bear-productions/dota_vpk_updates/main/scripts/items/items_game.txt";
// const BEHAVIORS_JSON_URL = "https://pastebin.com/raw/3URRriEz";
const BEHAVIORS_JSON_URL = "http://127.0.0.1:8000/behaviors.json";

declare global {
	interface CScriptParticleManager {
		CreateParticle(particleName: string, particleAttach: ParticleAttachment, owner: CBaseEntity | undefined, source?: PlayerID): ParticleID
	}

	interface CBaseEntity {
		EmitSound(soundName: string, source?: PlayerID): void,
		EmitSoundParams(soundName: string, pitch: number, volume: number, delay: number, source?: PlayerID): void,
		StopSound(soundName: string, source?: PlayerID): void
	}

	function EmitSoundOn(soundName: string, entity: CBaseEntity, source?: PlayerID): void;
	function EmitSoundOnClient(soundName: string, player: CDOTAPlayerController, source?: PlayerID): void;
	function EmitSoundOnEntityForPlayer(soundName: string, entity: CBaseEntity, playerID: PlayerID, source?: PlayerID): void;
	function EmitSoundOnLocationForAllies(location: Vector, soundName: string, caster: CBaseEntity, source?: PlayerID): void;
	function EmitSoundOnLocationForPlayer(soundName: string, location: Vector, playerID: PlayerID, source?: PlayerID): void;
	function EmitSoundOnLocationWithCaster(location: Vector, soundName: string, caster: CDOTA_BaseNPC, source?: PlayerID): void;
	function StartSoundEvent(soundName: string, entity: CBaseEntity, source?: PlayerID): void;
	function StartSoundEventFromPosition(soundName: string, position: Vector, source?: PlayerID): void;
	function StartSoundEventFromPositionReliable(soundName: string, position: Vector, source?: PlayerID): void;
	function StartSoundEventFromPositionUnreliable(soundName: string, position: Vector, source?: PlayerID): void;
	function StartSoundEventReliable(soundName: string, entity: CBaseEntity, source?: PlayerID): void;
	function StartSoundEventUnreliable(soundName: string, entity: CBaseEntity, source?: PlayerID): void;
	function StopGlobalSound(soundName: string, source?: PlayerID): void;
	function StopSoundEvent(soundName: string, entity: CBaseEntity, source?: PlayerID): void;
	function StopSoundOn(soundName: string, entity: CBaseEntity, source?: PlayerID): void;
}


@reloadable
export class Cosmetic {
	slots : Slots = {};
	items_game : ItemsGameKV | undefined;
	items : Items = {};
	hero_items : HeroItems = {};
	model_to_ids : {[model_name : string] : number} = {};
	equipped_items : PlayersEquippedItems = {};
	behaviors_json : BehaviorsJSON = {"items": {}, "kinetic_gems": {}};
	// particle_owners : {[particle : ParticleID] : [string, PlayerID]} = {}
	possible_sound_replacements : {[sound_name: string]: string[]} = {};
	prismatic_gems : CosmeticPrismaticGems = {};
	kinetic_gems : KineticGems = {};

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
			const playerOwnerID = source != undefined ? source : IsValidEntity(owner) && owner.IsBaseNPC() ? owner.GetPlayerOwnerID() : -1;
			const particleReplacements = GameRules.Cosmetic.GetParticleReplacements(playerOwnerID);
			const particleReplacement = particleReplacements[particleName];
			if (particleReplacement != undefined) {
				if (particleReplacement["name"] != undefined) {
					particleName = particleReplacement["name"]!;
				}

				if (particleReplacement["pattach"] != undefined) {
					partileAttach = particleReplacement["pattach"]!;
				}
			}
			const fx = valve_create_particle.bind(this)(particleName, partileAttach, owner);
			// if (playerOwnerID != -1) {
			// 	GameRules.Cosmetic.particle_owners[fx] = [particleName, playerOwnerID];
			// }
			if (particleReplacement != undefined && owner != undefined) {
				if (particleReplacement["control_points"] != undefined) {
					for (const [control_point_index, control_point] of Object.entries(particleReplacement["control_points"]!)) {
						let vector = owner.GetAbsOrigin();
						if (control_point["vector"] != undefined) {
							if (typeof control_point["vector"] == "object") {
								vector = Vector(...control_point["vector"])
							} else if (control_point["vector"] == "parent") {
								vector = owner.GetAbsOrigin();
							}
						}
						ParticleManager.SetParticleControlEnt(fx, parseInt(control_point_index), owner, ATTACH_TYPES[control_point["pattach"] ?? ""] ?? ParticleAttachment.ABSORIGIN_FOLLOW, control_point["attach"] ?? "attach_hitloc", vector, true);
					}
				}
			}
			const prismaticInfo = GameRules.Cosmetic.GetPrismaticGemsParticlesInfo(playerOwnerID);
			if (prismaticInfo[particleName] != undefined) {

			}
			return fx;
		}

		function GetSoundForPlayerID(soundName: string, playerID: PlayerID): string {
			const soundReplacements = GameRules.Cosmetic.GetSoundReplacements(playerID);
			const soundReplacement = soundReplacements[soundName];
			if (soundReplacement != undefined) {
				if (GameRules.Cosmetic.possible_sound_replacements[soundName] == undefined) {
					GameRules.Cosmetic.possible_sound_replacements[soundName] = [];
				}
				if (!GameRules.Cosmetic.possible_sound_replacements[soundName].includes(soundReplacement)) {
					GameRules.Cosmetic.possible_sound_replacements[soundName].push(soundReplacement);
				}
				soundName = soundReplacement;
			}
			return soundName;
		}

		function GetPossibleSounds(soundName: string, playerID: PlayerID): string[] {
			const sounds = [];
			if (GameRules.Cosmetic.possible_sound_replacements[soundName] != undefined) {
				sounds.push(...GameRules.Cosmetic.possible_sound_replacements[soundName]);
			}
			const soundReplacements = GameRules.Cosmetic.GetSoundReplacements(playerID);
			const soundReplacement = soundReplacements[soundName];
			if (soundReplacement != undefined && !sounds.includes(soundReplacement)) {
				sounds.push(soundReplacement);
			}
			return sounds;
		}

		const valve_emitsound = CBaseEntity.EmitSound;

		CBaseEntity.EmitSound = function(soundName: string, source?: PlayerID): void {
			const soundOwnerID = source != undefined ? source : this.IsBaseNPC() ? this.GetPlayerOwnerID() : -1;
			return valve_emitsound.bind(this)(GetSoundForPlayerID(soundName, soundOwnerID));
		}

		const valve_emitsound_params = CBaseEntity.EmitSoundParams;

		CBaseEntity.EmitSoundParams = function(soundName: string, pitch: number, volume: number, delay: number, source?: PlayerID): void {
			const soundOwnerID = source != undefined ? source : this.IsBaseNPC() ? this.GetPlayerOwnerID() : -1;
			return valve_emitsound_params.bind(this)(GetSoundForPlayerID(soundName, soundOwnerID), pitch, volume, delay);
		}

		const valve_stopsound = CBaseEntity.StopSound;

		CBaseEntity.StopSound = function(soundName: string, source?: PlayerID): void {
			const soundOwnerID = source != undefined ? source : this.IsBaseNPC() ? this.GetPlayerOwnerID() : -1;
			for (const possible_sound of GetPossibleSounds(soundName, soundOwnerID)) {
				valve_stopsound.bind(this)(possible_sound);
			}
			return valve_stopsound.bind(this)(soundName);
		}

		const valve_emitannouncersound = EmitAnnouncerSound;

		(EmitAnnouncerSound as any) = function(soundName: string, source?: PlayerID): void {
			const soundOwnerID = source ?? -1;
			return valve_emitannouncersound(GetSoundForPlayerID(soundName, soundOwnerID));
		}

		const valve_emitannouncersoundforplayer = EmitAnnouncerSoundForPlayer;

		(EmitAnnouncerSoundForPlayer as any) = function(soundName: string, playerId: PlayerID, source?: PlayerID): void {
			const soundOwnerID = source ?? playerId;
			return valve_emitannouncersoundforplayer(GetSoundForPlayerID(soundName, soundOwnerID), playerId);
		}

		const valve_emitannouncersoundforteam = EmitAnnouncerSoundForTeam;

		(EmitAnnouncerSoundForTeam as any) = function(soundName: string, team: DotaTeam, source?: PlayerID): void {
			const soundOwnerID = source ?? -1;
			return valve_emitannouncersoundforteam(GetSoundForPlayerID(soundName, soundOwnerID), team);
		}

		const valve_emitannouncersoundforteamonlocation = EmitAnnouncerSoundForTeamOnLocation;

		(EmitAnnouncerSoundForTeamOnLocation as any) = function(soundName: string, team: DotaTeam, location: Vector, source?: PlayerID): void {
			const soundOwnerID = source ?? -1;
			return valve_emitannouncersoundforteamonlocation(GetSoundForPlayerID(soundName, soundOwnerID), team, location);
		}

		const valve_emitglobalsound = EmitGlobalSound;

		(EmitGlobalSound as any) = function(soundName: string, source?: PlayerID): void {
			const soundOwnerID = source ?? -1;
			return valve_emitglobalsound(GetSoundForPlayerID(soundName, soundOwnerID));
		}

		const valve_emitsoundon = EmitSoundOn;

		(EmitSoundOn as any) = function(soundName: string, entity: CBaseEntity, source?: PlayerID): void {
			const soundOwnerID = source != undefined ? source : entity.IsBaseNPC() ? entity.GetPlayerOwnerID() : -1;
			return valve_emitsoundon(GetSoundForPlayerID(soundName, soundOwnerID), entity);
		}

		const valve_emitsoundonclient = EmitSoundOnClient;

		(EmitSoundOnClient as any) = function(soundName: string, player: CDOTAPlayerController, source?: PlayerID): void {
			const soundOwnerID = source ?? player.GetPlayerID();
			return valve_emitsoundonclient(GetSoundForPlayerID(soundName, soundOwnerID), player);
		}

		const valve_emitsoundonentityforplayer = EmitSoundOnEntityForPlayer;

		(EmitSoundOnEntityForPlayer as any) = function(soundName: string, entity: CBaseEntity, playerID: PlayerID, source?: PlayerID): void {
			const soundOwnerID = source ?? playerID;
			return valve_emitsoundonentityforplayer(GetSoundForPlayerID(soundName, soundOwnerID), entity, playerID);
		}

		const valve_emitsoundonlocationforallies = EmitSoundOnLocationForAllies;

		(EmitSoundOnLocationForAllies as any) = function(location: Vector, soundName: string, caster: CBaseEntity, source?: PlayerID): void {
			const soundOwnerID = source != undefined ? source : caster.IsBaseNPC() ? caster.GetPlayerOwnerID() : -1;
			return valve_emitsoundonlocationforallies(location, GetSoundForPlayerID(soundName, soundOwnerID), caster);
		}

		const valve_emitsoundonlocationforplayer = EmitSoundOnLocationForPlayer;

		(EmitSoundOnLocationForPlayer as any) = function(soundName: string, location: Vector, playerID: PlayerID, source?: PlayerID): void {
			const soundOwnerID = source ?? playerID;
			return valve_emitsoundonlocationforplayer(GetSoundForPlayerID(soundName, soundOwnerID), location, playerID);
		}

		const valve_emitsoundonlocationwithcaster = EmitSoundOnLocationWithCaster;

		(EmitSoundOnLocationWithCaster as any) = function(location: Vector, soundName: string, caster: CDOTA_BaseNPC, source?: PlayerID): void {
			const soundOwnerID = source ?? caster.GetPlayerOwnerID();
			return valve_emitsoundonlocationwithcaster(location, GetSoundForPlayerID(soundName, soundOwnerID), caster);
		}

		const valve_startsoundevent = StartSoundEvent;

		(StartSoundEvent as any) = function(soundName: string, entity: CBaseEntity, source?: PlayerID): void {
			const soundOwnerID = source != undefined ? source : entity.IsBaseNPC() ? entity.GetPlayerOwnerID() : -1;
			return valve_startsoundevent(GetSoundForPlayerID(soundName, soundOwnerID), entity);
		}

		const valve_startsoundeventfromposition = StartSoundEventFromPosition;

		(StartSoundEventFromPosition as any) = function(soundName: string, position: Vector, source?: PlayerID): void {
			const soundOwnerID = source ?? -1;
			return valve_startsoundeventfromposition(GetSoundForPlayerID(soundName, soundOwnerID), position);
		}

		const valve_startsoundeventfrompositionreliable = StartSoundEventFromPositionReliable;

		(StartSoundEventFromPositionReliable as any) = function(soundName: string, position: Vector, source?: PlayerID): void {
			const soundOwnerID = source ?? -1;
			return valve_startsoundeventfrompositionreliable(GetSoundForPlayerID(soundName, soundOwnerID), position);
		}

		const valve_startsoundeventfrompositionunreliable = StartSoundEventFromPositionUnreliable;

		(StartSoundEventFromPositionUnreliable as any) = function(soundName: string, position: Vector, source?: PlayerID): void {
			const soundOwnerID = source ?? -1;
			return valve_startsoundeventfrompositionunreliable(GetSoundForPlayerID(soundName, soundOwnerID), position);
		}

		const valve_startsoundeventreliable = StartSoundEventReliable;

		(StartSoundEventReliable as any) = function(soundName: string, entity: CBaseEntity, source?: PlayerID): void {
			const soundOwnerID = source != undefined ? source : entity.IsBaseNPC() ? entity.GetPlayerOwnerID() : -1;
			return valve_startsoundeventreliable(GetSoundForPlayerID(soundName, soundOwnerID), entity);
		}

		const valve_startsoundeventunreliable = StartSoundEventUnreliable;

		(StartSoundEventUnreliable as any) = function(soundName: string, entity: CBaseEntity, source?: PlayerID): void {
			const soundOwnerID = source != undefined ? source : entity.IsBaseNPC() ? entity.GetPlayerOwnerID() : -1;
			return valve_startsoundeventunreliable(GetSoundForPlayerID(soundName, soundOwnerID), entity);
		}

		const valve_stopglobalsound = StopGlobalSound;

		(StopGlobalSound as any) = function(soundName: string, source?: PlayerID): void {
			const soundOwnerID = source ?? -1;
			for (const possible_sound of GetPossibleSounds(soundName, soundOwnerID)) {
				valve_stopglobalsound(possible_sound);
			}
			return valve_stopglobalsound(soundName);
		}

		const valve_stopsoundevent = StopSoundEvent;

		(StopSoundEvent as any) = function(soundName: string, entity: CBaseEntity, source?: PlayerID): void {
			const soundOwnerID = source != undefined ? source : entity.IsBaseNPC() ? entity.GetPlayerOwnerID() : -1;
			for (const possible_sound of GetPossibleSounds(soundName, soundOwnerID)) {
				valve_stopsoundevent(possible_sound, entity);
			}
			return valve_stopsoundevent(soundName, entity);
		}

		const valve_stopsoundon = StopSoundOn;

		(StopSoundOn as any) = function(soundName: string, entity: CBaseEntity, source?: PlayerID): void {
			const soundOwnerID = source != undefined ? source : entity.IsBaseNPC() ? entity.GetPlayerOwnerID() : -1;
			for (const possible_sound of GetPossibleSounds(soundName, soundOwnerID)) {
				valve_stopsoundon(possible_sound, entity);
			}
			return valve_stopsoundon(soundName, entity);
		}
	}

	public PostInit(): void {
		this.InitItems();
		this.InitBehaviors();
		this.HandlePrismaticGems();
	}

	public PostInitOnce(): void {
		this.InitSlots();
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

	public InitBehaviors(): void {
		if (this.behaviors_json["items"] != undefined && Object.keys(this.behaviors_json["items"]).length > 0) {
			// return;
		}

		this.behaviors_json = {"items": {}, "kinetic_gems": {}} as BehaviorsJSON;

		const r = CreateHTTPRequestScriptVM("GET", BEHAVIORS_JSON_URL);

		const _this = this;

		r.Send((req: CScriptHTTPResponse) => {
			if (req.StatusCode == 200) {
				const result = json.decode(req.Body)[0];
				if (result != undefined) {
					_this.behaviors_json = result as BehaviorsJSON;
					_this.HandleKineticGems();
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
							"slot": "bundle",
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
							if (typeof(asset) == "object" && typeof asset["modifier"] == "string" && ["particle", "particle_create"].includes(asset["type"]!)) {
								const attach_id = attach_ids[asset["modifier"]]
								if (attach_id != undefined) {
									item_visuals[_]["attachments"] = items_game["items_game"]["attribute_controlled_attached_particles"][attach_id];
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

	public HandlePrismaticGems(): void {
		for (const [gem_name, gem] of Object.entries(this.items_game!["items_game"]["colors"])) {
			if (gem_name.startsWith("unusual_")) {
				this.prismatic_gems[gem_name] = hexToRGB(gem["hex_color"]);
			}
		}
	}

	public HandleKineticGems(): void {
		for (const [gem_name, item_ids] of Object.entries(this.behaviors_json["kinetic_gems"])) {
			this.kinetic_gems[gem_name] = item_ids
		}
	}

	public GetEquippedItems(playerID: PlayerID): CosmeticEquippedItems {
		if (this.equipped_items[playerID] == undefined) {
			return {};
		}
		const hero = PlayerResource.GetSelectedHeroEntity(playerID);
		if (!IsValidEntity(hero)) {
			return {};
		}
		return this.equipped_items[playerID][hero.GetUnitName()] ?? {};
	}

	public GetAvaiableItems(playerID: PlayerID): CosmeticHeroItems {
		const hero = PlayerResource.GetSelectedHeroEntity(playerID);
		if (!IsValidEntity(hero)) {
			return {};
		}
		const heroname = hero.GetUnitName();
		const items : CosmeticHeroItems = {};
		for (const [slot, hero_items] of Object.entries(this.hero_items[heroname] || {})) {
			items[slot] = {}
			for (const [item_id, item] of Object.entries(hero_items)) {
				items[slot][item_id] = Object.assign({"avaiable": 1}, ObjectUtils.filter(item, ([key, value]) => (["name", "slot", "icon", "rarity", "styles", "type", "bundle"].includes(key as string))));
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
		let item = this.items[event.item];
		if (item == undefined) {
			return;
		}

		const hero = PlayerResource.GetSelectedHeroEntity(event.PlayerID)
		if (!IsValidEntity(hero)) {
			return;
		}
		const heroname = hero.GetUnitName()

		if (item["type"] == "bundle") {
			item = item as Bundle;
			const items = Object.fromEntries(item["bundle"].filter((item_id) => type(item_id) == "number").map((item_id) => ([this.items[item_id as number]["slot"], item_id])));
			const unused_slots = Object.keys(this.slots[heroname]["slots"]).filter((slot) => (!Object.keys(items).includes(slot)));
			Object.values(items).map((item_id) => (this.EquipItem(Object.assign(Object.assign({}, event), {"item": item_id}))));
			unused_slots.map((slot) => this.DefaultSlot(event.PlayerID, slot, false, true));
			return;
		}
		item = item as Item;

		const style = Math.min(event.style, item["styles"]);

		if (this.equipped_items[event.PlayerID] == undefined) {
			this.equipped_items[event.PlayerID] = {}
		}
		if (this.equipped_items[event.PlayerID][heroname] == undefined) {
			this.equipped_items[event.PlayerID][heroname] = {}
		}

		if (!this._EquipItem(event.PlayerID, event.item, style ?? 1, false)) {
			return;
		}
		this.equipped_items[event.PlayerID][heroname][item["slot"]] = {"item": event.item, "style": style ?? 0}

		this.RequestEquippedItems({"PlayerID": event.PlayerID});

		const hero_icons_replacement = this.GetHeroIconReplacements(event.PlayerID);
		const ability_icons_replacement = this.GetAbilityIconReplacements(event.PlayerID);
		const item_icons_replacement = this.GetItemIconReplacements(event.PlayerID);
		const data = CustomNetTables.GetTableValue("cosmetic", "replacements") ?? {};
		const player_data : CosmeticReplacements = {};
		if (Object.keys(hero_icons_replacement).length > 0) {
			player_data["hero_icons"] = hero_icons_replacement
		}
		if (Object.keys(ability_icons_replacement).length > 0) {
			player_data["ability_icons"] = ability_icons_replacement
		}
		if (Object.keys(item_icons_replacement).length > 0) {
			player_data["item_icons"] = item_icons_replacement
		}
		if (Object.keys(player_data).length > 0) {
			data[event.PlayerID.toString()] = player_data;
		} else {
			delete data[event.PlayerID.toString()];
		}
		CustomNetTables.SetTableValue("cosmetic", "replacements", data);
	}

	public _EquipItem(playerID: PlayerID, item_id: number, style: number, ignore_default_check?: boolean): boolean {
		style = style - 1;
		let item = this.items[item_id];
		if (item == undefined) {
			return false;
		}
		const hero = PlayerResource.GetSelectedHeroEntity(playerID);
		if (!IsValidEntity(hero)) {
			return false;
		}
		const heroname = hero.GetUnitName();
		if (item["type"] == "bundle") {
			item = item as Bundle;
			const items = Object.fromEntries(item["bundle"].filter((item_id) => type(item_id) == "number").map((item_id) => ([this.items[item_id as number]["slot"], item_id])));
			const unused_slots = Object.keys(this.slots[heroname]["slots"]).filter((slot) => (!Object.keys(items).includes(slot)));
			const result = Object.values(items).map((item_id) => (this._EquipItem(playerID, item_id as number, style, ignore_default_check)));
			unused_slots.map((slot) => this.DefaultSlot(playerID, slot, false, true));
			return result.every((v) => v);
		}
		item = item as Item;
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
		const current_persona = this.GetCurrentPersona(playerID);
		for (const slot of Object.keys(this.hero_items[hero.GetUnitName()])) {
			const mod = this.GetModifierForSlot(hero, slot);
			if (mod != undefined && mod.persona != undefined) {
				continue;
			}
			if (this.GetPersonaForSlot(slot) != current_persona) {
				if (mod != undefined) {
					mod.Destroy();
				}
			} else {
				if (mod == undefined) {
					const {item, style} = this.equipped_items[playerID] != undefined && this.equipped_items[playerID][heroname] != undefined ? this.equipped_items[playerID][heroname][slot] : {item: undefined, style: undefined};
					if (item != undefined) {
						this._EquipItem(playerID, item, style ?? 1, true);
					} else {
						this.DefaultSlot(playerID, slot, true);
					}
				}
			}
		}
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

	public GetModifiersAndSlots(hero: CDOTA_BaseNPC) : {[slot : string] : modifier_cosmetic_ts} {
		const slots : {[slot : string] : modifier_cosmetic_ts} = {};
		for (const mod of hero.FindAllModifiersByName(modifier_cosmetic_ts.name)) {
			const modifier = mod as modifier_cosmetic_ts;
			if (!modifier.IsNull() && modifier.kv != undefined && modifier.kv.item_id != undefined) {
				const item = this.items[modifier.kv.item_id] as Item;
				if (item != undefined && item.slot != undefined) {
					slots[item.slot] = modifier;
				}
			}
		}
		return slots;
	}

	public GetModifierForSlot(hero: CDOTA_BaseNPC, slot: string) : modifier_cosmetic_ts | undefined {
		return this.GetModifiersAndSlots(hero)[slot];
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

	public GetDefaultItemForSlot(playerID: PlayerID, slot: string): number | undefined {
		const hero = PlayerResource.GetSelectedHeroEntity(playerID)
		if (!IsValidEntity(hero)) {
			return undefined;
		}
		const hero_items = this.hero_items[hero.GetUnitName()][slot];
		if (hero_items != undefined) {
			for (const [item_id, item] of Object.entries(hero_items)) {
				if (item.type == "default_item") {
					return parseInt(item_id);
				}
			}
		}
		return undefined
	}

	public DefaultSlot(playerID: PlayerID, slot: string, ignore_default_check?: boolean, save?: boolean): void {
		const item = this.GetDefaultItemForSlot(playerID, slot);
		if (item != undefined) {
			if (!save) {
				this._EquipItem(playerID, item, 1, ignore_default_check);
			} else {
				this.EquipItem({"PlayerID": playerID, "item": item, "style": 1});
			}
			return;
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
		// NOTE: for unknown reason, valve does not give us any way to remove their wearables
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
		hero.RemoveAllModifiersOfName(modifier_cosmetic_ts.name);
		for (const mod of original_hero.FindAllModifiersByName(modifier_cosmetic_ts.name)) {
			(mod as modifier_cosmetic_ts).CopyTo(hero);
		}
	}

	public OnNPCSpawned(npc: CDOTA_BaseNPC): void {
		const playerID = npc.GetPlayerOwnerID();
        const original_hero = playerID != -1 ? PlayerResource.GetSelectedHeroEntity(playerID): undefined;

		if (!IsValidEntity(original_hero) && !npc.IsTrueHero()) {
			return;
		}

		const unit_name = npc.GetUnitName();
		if (npc.IsTrueHero()) {
			if (GetAttribute(npc, "bFirstSpawn", true) == true) {
				const _this = this;
				Timers.CreateTimer({"endTime": 0.2, "callback": () => {
					if (!IsValidEntity(npc)) {
						return;
					}
					_this.EquipDOTAItems(npc.GetPlayerOwnerID());
				}}, this);
			}
		} else if (IsValidEntity(original_hero) && unit_name == original_hero.GetUnitName()) {
			this.CopyWearables(npc);
		} else {
			const unitmodel_replacements = this.GetUnitModelReplacements(playerID);
			const model_replacement = unitmodel_replacements[unit_name];
			if (model_replacement != undefined) {
				npc.SetModel(model_replacement["model"]);
				npc.SetOriginalModel(model_replacement["model"]);
			}
		}
	}

	public GetPersonaForSlot(slot: string): number | undefined {
		const persona = string.match(slot, "_persona_(%d+)")[0];
		return persona != undefined ? parseInt(persona) : undefined
	}

	public GetCurrentPersona(playerID: PlayerID): number | undefined {
		const hero = PlayerResource.GetSelectedHeroEntity(playerID);
		if (!IsValidEntity(hero)) {
			return;
		}
		const modifier = this.GetModifierForSlot(hero, "persona_selector");
		if (modifier != undefined) {
			return modifier.persona;
		}
	}

	public GetParticleReplacements(playerID: PlayerID): ParticleReplacements {
		const replacements : ParticleReplacements = {};
		const hero = PlayerResource.GetSelectedHeroEntity(playerID);
		if (!IsValidEntity(hero)) {
			return {};
		}
		const modifiers = hero.FindAllModifiersByName(modifier_cosmetic_ts.name) as modifier_cosmetic_ts[];
		modifiers.sort((a: modifier_cosmetic_ts, b: modifier_cosmetic_ts) => (a.GetPriority() - b.GetPriority() || b.GetCreationTime() - a.GetCreationTime()));
		for (const modifier of modifiers) {
			for (const [asset, asset_modifier] of Object.entries(modifier.particle_replacements)) {
				if (replacements[asset] == undefined) {
					replacements[asset] = asset_modifier;
				} else {
					if ((replacements[asset]["priority"] ?? 0) <= (asset_modifier["priority"] ?? 0)) {
						replacements[asset] = asset_modifier;
					}
				}
			}
		}
		return Object.fromEntries(Object.entries(replacements).map(([asset, modifier]) => ([asset, ObjectUtils.filter(modifier, ([modifier_key, modifier_value]) => (modifier_key != "priority"))])));
	}

	public GetSoundReplacements(playerID: PlayerID): ActualSoundReplacements {
		const replacements : SoundReplacements = {};
		const hero = PlayerResource.GetSelectedHeroEntity(playerID);
		if (!IsValidEntity(hero)) {
			return {};
		}
		const modifiers = hero.FindAllModifiersByName(modifier_cosmetic_ts.name) as modifier_cosmetic_ts[];
		modifiers.sort((a: modifier_cosmetic_ts, b: modifier_cosmetic_ts) => (a.GetPriority() - b.GetPriority() || b.GetCreationTime() - a.GetCreationTime()));
		for (const modifier of modifiers) {
			for (const [asset, asset_modifier] of Object.entries(modifier.sound_replacements)) {
				if (replacements[asset] == undefined) {
					replacements[asset] = asset_modifier;
				} else {
					if ((replacements[asset]["priority"] ?? 0) <= (asset_modifier["priority"] ?? 0)) {
						replacements[asset] = asset_modifier;
					}
				}
			}
		}
		return Object.fromEntries(Object.entries(replacements).map(([asset, modifier]) => ([asset, modifier["name"]])));
	}

	public GetUnitModelReplacements(playerID: PlayerID): UnitModelsReplacements {
		const replacements : UnitModelsReplacements = {};
		const hero = PlayerResource.GetSelectedHeroEntity(playerID);
		if (!IsValidEntity(hero)) {
			return replacements;
		}
		const modifiers = hero.FindAllModifiersByName(modifier_cosmetic_ts.name) as modifier_cosmetic_ts[];
		modifiers.sort((a: modifier_cosmetic_ts, b: modifier_cosmetic_ts) => (a.GetPriority() - b.GetPriority() || b.GetCreationTime() - a.GetCreationTime()));
		for (const modifier of modifiers) {
			for (const [asset, asset_modifier] of Object.entries(modifier.unit_models)) {
				if (replacements[asset] == undefined) {
					replacements[asset] = asset_modifier;
				} else {
					if ((replacements[asset]["priority"] ?? 0) <= (asset_modifier["priority"] ?? 0)) {
						replacements[asset] = asset_modifier;
					}
				}
			}
		}
		return Object.fromEntries(Object.entries(replacements).map(([asset, modifier]) => ([asset, ObjectUtils.filter(modifier, ([modifier_key, modifier_value]) => (modifier_key != "priority"))])));
	}

	public GetHeroIconReplacements(playerID: PlayerID): CosmeticHeroIconReplacements {
		const replacements : HeroIconReplacements = {};
		const hero = PlayerResource.GetSelectedHeroEntity(playerID);
		if (!IsValidEntity(hero)) {
			return {};
		}
		const modifiers = hero.FindAllModifiersByName(modifier_cosmetic_ts.name) as modifier_cosmetic_ts[];
		modifiers.sort((a: modifier_cosmetic_ts, b: modifier_cosmetic_ts) => (a.GetPriority() - b.GetPriority() || b.GetCreationTime() - a.GetCreationTime()));
		for (const modifier of modifiers) {
			for (const [asset, asset_modifier] of Object.entries(modifier.hero_icons)) {
				if (replacements[asset] == undefined) {
					replacements[asset] = asset_modifier;
				} else {
					if ((replacements[asset]["priority"] ?? 0) <= (asset_modifier["priority"] ?? 0)) {
						replacements[asset] = asset_modifier;
					}
				}
			}
		}
		return Object.fromEntries(Object.entries(replacements).map(([asset, modifier]) => ([asset, modifier["name"]])));
	}

	public GetAbilityIconReplacements(playerID: PlayerID): CosmeticAbilityIconReplacements {
		const replacements : AbilityIconReplacements = {};
		const hero = PlayerResource.GetSelectedHeroEntity(playerID);
		if (!IsValidEntity(hero)) {
			return {};
		}
		const modifiers = hero.FindAllModifiersByName(modifier_cosmetic_ts.name) as modifier_cosmetic_ts[];
		modifiers.sort((a: modifier_cosmetic_ts, b: modifier_cosmetic_ts) => (a.GetPriority() - b.GetPriority() || b.GetCreationTime() - a.GetCreationTime()));
		for (const modifier of modifiers) {
			for (const [asset, asset_modifier] of Object.entries(modifier.ability_icons)) {
				if (replacements[asset] == undefined) {
					replacements[asset] = asset_modifier;
				} else {
					if ((replacements[asset]["priority"] ?? 0) <= (asset_modifier["priority"] ?? 0)) {
						replacements[asset] = asset_modifier;
					}
				}
			}
		}
		return Object.fromEntries(Object.entries(replacements).map(([asset, modifier]) => ([asset, modifier["name"]])));
	}

	public GetItemIconReplacements(playerID: PlayerID): CosmeticItemIconReplacements {
		const replacements : ItemIconReplacements = {};
		const hero = PlayerResource.GetSelectedHeroEntity(playerID);
		if (!IsValidEntity(hero)) {
			return {};
		}
		const modifiers = hero.FindAllModifiersByName(modifier_cosmetic_ts.name) as modifier_cosmetic_ts[];
		modifiers.sort((a: modifier_cosmetic_ts, b: modifier_cosmetic_ts) => (a.GetPriority() - b.GetPriority() || b.GetCreationTime() - a.GetCreationTime()));
		for (const modifier of modifiers) {
			for (const [asset, asset_modifier] of Object.entries(modifier.item_icons)) {
				if (replacements[asset] == undefined) {
					replacements[asset] = asset_modifier;
				} else {
					if ((replacements[asset]["priority"] ?? 0) <= (asset_modifier["priority"] ?? 0)) {
						replacements[asset] = asset_modifier;
					}
				}
			}
		}
		return Object.fromEntries(Object.entries(replacements).map(([asset, modifier]) => ([asset, modifier["name"]])));
	}

	public GetPrismaticGemsParticlesInfo(playerID: PlayerID): ParticlePrismaticGems {
		const info : ParticlePrismaticGems = {};
		const hero = PlayerResource.GetSelectedHeroEntity(playerID);
		if (!IsValidEntity(hero)) {
			return {};
		}
		const modifiers = hero.FindAllModifiersByName(modifier_cosmetic_ts.name) as modifier_cosmetic_ts[];
		modifiers.sort((a: modifier_cosmetic_ts, b: modifier_cosmetic_ts) => (a.GetPriority() - b.GetPriority() || b.GetCreationTime() - a.GetCreationTime()));
		for (const modifier of modifiers) {
			Object.assign(info, modifier.prismatic_particles);
		}
		return info;
	}

	public GetEquippedPrismatic(playerID: PlayerID): RGBColorArray | undefined {
		return undefined;
	}
}