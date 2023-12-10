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
	kv? : params;
	hEntity? : CDOTA_BaseNPC;
	hEntityModifier? : ModifierCosmeticBase;

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
				}
			}
		}
	}

	ReadVisuals(visuals: ItemsGameItemAssetModifier): void {
		super.ReadVisuals(visuals);

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
