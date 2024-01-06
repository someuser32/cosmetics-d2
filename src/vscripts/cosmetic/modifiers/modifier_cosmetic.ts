import { registerModifier } from "../../lib/dota_ts_adapter";
import { ModifierCosmeticBase, params } from "./modifier_cosmetic_base";

import { modifier_cosmetic_wearable_ts } from "./modifier_cosmetic_wearable";
import { modifier_cosmetic_ranged_projectile_ts } from "./modifier_cosmetic_ranged_projectile";


@registerModifier()
export class modifier_cosmetic_ts extends ModifierCosmeticBase {
	hEntity?: CDOTA_BaseNPC;
	hEntityModifier?: modifier_cosmetic_wearable_ts;

	persona?: number;
	healthbar_offset? : number;
	ranged_projectile? : string;

	unit_models : UnitModelsReplacements = {};
	wearable_models : WearableModelsReplacements = {};
	particle_replacements: ParticleReplacements = {};
	sound_replacements: SoundReplacements = {};
	hero_icons: HeroIconReplacements = {};
	ability_icons: AbilityIconReplacements = {};
	item_icons: ItemIconReplacements = {};
	prismatic_particles : ParticlePrismaticGems = {};

	GetAttributes(): ModifierAttribute {
		return ModifierAttribute.PERMANENT + ModifierAttribute.MULTIPLE;
	}

	OnCreated(kv: params): void {
		if (!IsServer()) {
			return;
		}

		this.caster = this.GetCaster()!;
		this.parent = this.GetParent();
		this.kv = kv;
		this.style = kv.style ?? 0;

		this.hEntity = CreateUnitByName("npc_dota_base_additive", this.parent.GetAbsOrigin(), false, undefined, undefined, this.parent.GetTeamNumber());
		this.hEntity.SetDayTimeVisionRange(0);
		this.hEntity.SetNightTimeVisionRange(0);
		this.hEntity.FollowEntity(this.parent, true);
		this.hEntityModifier = modifier_cosmetic_wearable_ts.apply(this.hEntity, this.parent, undefined, kv);
	}

	OnRefresh(kv: params): void {
		if (!IsServer()) {
			return;
		}

		this.kv = kv;
		this.style = kv.style ?? this.style;

		this.hEntityModifier!.OnRefresh(kv);
		this.hEntityModifier!.ForceRefresh();

		this.ResetVisuals();
	}

	CopyTo(hero: CDOTA_BaseNPC): modifier_cosmetic_ts {
		const modifier = modifier_cosmetic_ts.apply(hero, hero, undefined, this.kv);
		const item = GameRules.Cosmetic.items[this.kv != undefined ? this.kv.item_id : -1] as Item;
		if (item == undefined) {
			return modifier;
		}
		modifier.ReadVisuals(item.visuals);
		modifier.ApplyVisuals();
		return modifier;
	}

	ReadAsset(asset_name: string, asset: any, array?: ItemsGameItem["visuals"][]): void {
		if (typeof(asset) == "object") {
			if (array != undefined && asset["style"] == this.style) {
				array.push({[asset_name]: asset});
			} else if (array != undefined && (asset_name == "styles" || string.match(asset_name, "^styles_%d+$")[0] != undefined)) {
				if (asset[this.style] != undefined) {
					for (const [styled_asset_name, styled_asset] of Object.entries(asset[this.style])) {
						array.push({[styled_asset_name as string]: styled_asset as any});
					};
				}
			} else if (asset["style"] == undefined || (array == undefined && asset["style"] == this.style)) {
				if (asset["type"] == "entity_model") {
					if (asset["asset"] == undefined || asset["asset"] == this.parent.GetUnitName()) {
						this.model = asset["modifier"];
					} else if (asset["asset"] != undefined) {
						this.unit_models[asset["asset"]] = {
							"model": asset["modifier"]
						};
					}
				} else if (asset["type"] == "model_skin") {
					this.model_skin = asset["skin"];
				} else if (asset["type"] == "healthbar_offset") {
					this.healthbar_offset = asset["offset"];
				} else if (asset["type"] == "activity") {
					if (asset["asset"] == "ALL") {
						this.activity = asset["modifier"];
					}
				} else if (asset["type"] == "persona") {
					this.persona = asset["persona"];
				} else if (asset["type"] == "model") {
					this.wearable_models[asset["asset"]] = {"model": asset["modifier"], "priority": asset["minimum_priority"] ?? 0};
				} else if (asset["type"] == "particle") {
					const [original_particle, modified_particle] = [asset["asset"], asset["modifier"]];
					if (original_particle != undefined && modified_particle != undefined) {
						this.particle_replacements[original_particle] = {"name": modified_particle, "priority": asset["minimum_priority"] ?? 0};
						if (original_particle == this.parent.GetRangedProjectileName()) {
							this.ranged_projectile = modified_particle;
						}
					}
				} else if (asset["type"] == "sound") {
					this.sound_replacements[asset["asset"]] = {"name": asset["modifier"], "priority": asset["minimum_priority"] ?? 0};
				} else if (asset["type"] == "ability_icon") {
					this.ability_icons[asset["asset"]] = {"name": asset["modifier"], "priority": asset["minimum_priority"] ?? 0};
				} else if (asset["type"] == "inventory_icon") {
					this.item_icons[asset["asset"]] = {"name": asset["modifier"], "priority": asset["minimum_priority"] ?? 0};
				} else if (asset["type"] == "icon_replacement_hero") {
					this.hero_icons[asset["asset"]] = {"name": asset["modifier"], "priority": asset["minimum_priority"] ?? 0};
				}
			}
		}
	}

	ReadVisuals(visuals: ItemsGameItem["visuals"]): void {
		super.ReadVisuals(visuals);

		this.hEntityModifier!.ReadVisuals(visuals);
	}

	ReadSpecialBehavior(behavior_name: keyof SpecialBehavior, behavior: SpecialBehavior[keyof SpecialBehavior], array?: SpecialBehavior[]): void {
		if (behavior_name == "player") {
			const info = behavior as SpecialBehaviorModelInfo;
			if (info["bodygroups"] != undefined) {
				for (const [bodygroup, value] of Object.entries(info["bodygroups"])) {
					this.model_bodygroups![bodygroup] = value;
				}
			}
		} else if (behavior_name == "styles") {
			const info = behavior as {[style : string] : SpecialBehaviorInfo};
			if (info[this.special_style!.toString()] != undefined) {
				if (array != undefined) {
					for (const [name, value] of Object.entries(info[this.special_style!.toString()])) {
						array.push({[name]: value});
					}
				}
			}
		} else if (behavior_name == "particles") {
			const info = behavior as {[particle_name: string]: SpecialBehaviorParticleInfo | "destroy"};
			for (const [particle_name, particle_info] of Object.entries(info)) {
				if (particle_info != "destroy") {
					if (particle_info["prismatic_gems"] != undefined) {
						this.prismatic_particles[particle_name] = particle_info["prismatic_gems"];
					}
				}
			}
		}
	}

	SpecialBehaviors(): boolean {
		const special_behaviors = super.SpecialBehaviors();
		for (const mod of (this.parent.FindAllModifiersByName(this.GetName()) as modifier_cosmetic_ts[])) {
			const wearable = mod.hEntityModifier;
			if (wearable != undefined) {
				const wearable_item_id = wearable.kv!.item_id;
				const behaviors = GameRules.Cosmetic.behaviors_json["items"][wearable_item_id.toString()];
				if (behaviors != undefined && behaviors["parent_style"] == this.kv!.item_id) {
					if (this.style != wearable.special_style) {
						wearable.ResetVisuals();
						wearable.ReadVisuals((GameRules.Cosmetic.items[wearable_item_id] as Item).visuals);
						wearable.SpecialBehaviors();
						wearable.ApplyVisuals();
					}
				}
			}
		}
		return special_behaviors;
	}

	ApplyVisuals(): void {
		super.ApplyVisuals();

		if (!IsValidEntity(this.parent)) {
			this.hEntityModifier!.ApplyVisuals();
			return;
		}

		const healthbar_offset : number | undefined = this.GetSharedValue("healthbar_offset");
		this.parent.SetHealthBarOffsetOverride(healthbar_offset ?? this.parent.GetBaseHealthBarOffset());

		const ranged_projectile : string | undefined = this.GetSharedValue("ranged_projectile");
		if (ranged_projectile != undefined) {
			modifier_cosmetic_ranged_projectile_ts.apply(this.parent, this.parent, undefined, {"ranged_projectile": ranged_projectile});
		} else {
			this.parent.RemoveModifierByName(modifier_cosmetic_ranged_projectile_ts.name);
		}

		this.hEntityModifier!.ApplyVisuals();

		for (const mod of (this.parent.FindAllModifiersByName(this.GetName()) as modifier_cosmetic_ts[])) {
			const wearable = mod.hEntityModifier;
			if (wearable != undefined) {
				if (this.wearable_models[wearable.model] != undefined) {
					wearable.ApplyVisuals();
				}
			}
		}
	}

	ResetVisuals(): void {
		delete this.healthbar_offset;
		this.unit_models = {};
		this.wearable_models = {};
		this.sound_replacements = {};
		this.particle_replacements = {};
		this.prismatic_particles = {};

		super.ResetVisuals();
	};

	OnDestroy(): void {
		if (!IsServer()) {
			return;
		}

		super.OnDestroy();
		this.hEntityModifier!.Destroy();
	}
}
