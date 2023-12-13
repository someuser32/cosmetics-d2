import { registerModifier } from "../../lib/dota_ts_adapter";
import { ModifierCosmeticBase, params } from "./modifier_cosmetic_base";

import { modifier_cosmetic_wearable_ts } from "./modifier_cosmetic_wearable";


@registerModifier()
export class modifier_cosmetic_ts extends ModifierCosmeticBase {
	hEntity?: CDOTA_BaseNPC;
	hEntityModifier?: ModifierCosmeticBase;
	particle_replacements: ParticleReplacements = {};
	ranged_projectile?: string;
	persona?: number;

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
		this.style = kv.style ?? -1;

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
		return modifier_cosmetic_ts.apply(hero, hero, undefined, this.kv);
	}

	ReadAsset(asset_name: string, asset: any, array?: ItemsGameItemAssetModifier[]): void {
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
				} else if (asset["type"] == "particle") {
					const [original_particle, modified_particle] = [asset["asset"], asset["modifier"]];
					if (original_particle != undefined && modified_particle != undefined) {
						this.particle_replacements[original_particle] = {"name": modified_particle};
						if (original_particle == this.parent.GetRangedProjectileName()) {
							this.ranged_projectile = modified_particle;
						}
					}
				}
			}
		}
	}

	ReadVisuals(visuals: ItemsGameItemAssetModifier): void {
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
		}
	}

	ApplyVisuals(): void {
		super.ApplyVisuals();

		this.hEntityModifier!.ApplyVisuals();
	}

	OnDestroy(): void {
		if (!IsServer()) {
			return;
		}

		super.OnDestroy();
		this.hEntityModifier!.Destroy();
	}
}
