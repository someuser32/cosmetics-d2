import { registerModifier } from "../../lib/dota_ts_adapter";
import { ModifierCosmeticBase } from "./modifier_cosmetic_base";

import { modifier_cosmetic_wearable_ts } from "./modifier_cosmetic_wearable";
import { modifier_cosmetic_model_ts } from "./modifier_cosmetic_model";

declare type params = {
	style : number | undefined,
	model : string,
	item_id : number
}

@registerModifier()
export class modifier_cosmetic_ts extends ModifierCosmeticBase {
	kv : params | undefined;
	hEntity : CDOTA_BaseNPC | undefined;
	hEntityModifier : ModifierCosmeticBase | undefined;

	GetAttributes(): ModifierAttribute {
		return ModifierAttribute.PERMANENT + ModifierAttribute.MULTIPLE;
	}

	OnCreated(kv: params): void {
		if (!IsServer()) {
			return;
		}

		this.parent = this.GetParent();
		this.kv = kv;
		this.style = kv.style ?? -1;

		this.hEntity = CreateUnitByName("npc_dota_base_additive", this.parent.GetAbsOrigin(), false, undefined, undefined, this.parent.GetTeamNumber());
		this.hEntity.FollowEntity(this.parent, true);
		this.hEntityModifier = this.hEntity.AddNewModifier(this.parent, undefined, "modifier_cosmetic_wearable_ts", kv) as modifier_cosmetic_wearable_ts;
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

	CopyTo(hero: CDOTA_BaseNPC): ModifierCosmeticBase {
		return hero.AddNewModifier(hero, undefined, this.GetName(), this.kv) as ModifierCosmeticBase;
	}

	ReadVisuals(visuals: ItemsGameItemAssetModifier): void {
		if (visuals["styles"] != undefined && visuals["styles"][this.style] != undefined) {
			visuals = Object.assign(visuals, visuals["styles"][this.style]);
		}

		for (const [asset_name, asset] of Object.entries(visuals)) {
			if (typeof(asset) == "object") {
				if (asset["style"] == undefined || asset["style"] == this.style) {
					if (asset["type"] == "entity_model") {
						if (asset["asset"] == undefined || asset["asset"] == this.parent.GetUnitName()) {
							this.model = asset["modifier"];
						} else if (asset["asset"] != undefined) {
							this.unit_models[asset["asset"]] = asset["modifier"];
						}
					} else if (asset["type"] == "model_skin") {
						this.model_skin = asset["skin"];
					} else if (asset["type"] == "healthbar_offset") {
						this.healthbar_offset = asset["offset"];
					}
				}
			}
		}

		this.hEntityModifier!.ReadVisuals(visuals);
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
