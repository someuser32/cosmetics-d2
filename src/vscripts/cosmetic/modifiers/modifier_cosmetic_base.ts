import { GetAttribute } from "../../lib/client";
import { BaseModifier } from "../../lib/dota_ts_adapter";

import { modifier_cosmetic_model_ts } from "./modifier_cosmetic_model";

declare type params = {
	style: number | undefined
};

interface UnitModel {
	model : string
}

interface UnitModels {
	[unit_name : string] : UnitModel
}

export class ModifierCosmeticBase extends BaseModifier {
	parent : CDOTA_BaseNPC = this.GetParent();
	style : number = -1;

	model? : string;
	model_skin? : number;
	healthbar_offset? : number;
	unit_models : UnitModels = {};

	IsHidden(): boolean {
		return true;
	}

	IsPurgable(): boolean {
		return false;
	}

	RemoveOnDeath(): boolean {
		return false;
	}

	GetAttributes(): ModifierAttribute {
		return ModifierAttribute.PERMANENT;
	}

	OnCreated(kv: params): void {
		this.parent = this.GetParent();

		if (!IsServer()) {
			return;
		}

		this.style = kv.style ?? -1;
	}

	OnRefresh(kv: params): void {
		this.style = kv.style ?? this.style;
	}

	ReadAsset(asset_name: string, asset: any, array?: ItemsGameItemAssetModifier[]): void {
	}

	ReadVisuals(visuals: ItemsGameItemAssetModifier): void {
		const styled_assets : ItemsGameItemAssetModifier[] = [];
		for (const [asset_name, asset] of Object.entries(visuals)) {
			this.ReadAsset(asset_name, asset, styled_assets);
		}

		for (const styled_asset of styled_assets) {
			for (const [asset_name, asset] of Object.entries(styled_asset)) {
				this.ReadAsset(asset_name, asset);
			}
		}
	}

	ApplyVisuals(): void {
		const healthbar_offset : number | undefined = this.GetSharedValue("healthbar_offset");
		this.parent.SetHealthBarOffsetOverride(healthbar_offset ?? this.parent.GetBaseHealthBarOffset());

		const [model, model_source] : [string, CDOTA_Modifier_Lua] | [] = this.GetSharedValueAndSource("model");
		if (model != undefined) {
			modifier_cosmetic_model_ts.apply(this.parent, this.parent, undefined, {"model": model});

			// const model_source_style : number | undefined = GetAttribute(model_source!, "style");
			// if (model_source_style != undefined) {
			// 	this.parent.SetMaterialGroup(model_source_style.toString());
			// }
		} else {
			this.parent.RemoveModifierByName(modifier_cosmetic_model_ts.name);
			// this.parent.SetMaterialGroup("default");
		}

		const model_skin : number | undefined = this.GetSharedValue("model_skin");
		this.parent.SetSkin(model_skin ?? 0);
		this.parent.SetMaterialGroup(model_skin != undefined ? model_skin.toString() : "default");
	}

	ResetVisuals(): void {
		delete this.model;
		delete this.model_skin;
		delete this.healthbar_offset;
		this.unit_models = {};
	};

	OnDestroy(): void {
		if (!IsServer()) {
			return;
		}

		this.ResetVisuals();
		this.ApplyVisuals();
	}

	GetSharedValueAndSource(value: string, ignore_self?: boolean): [any, CDOTA_Modifier_Lua] | [] {
		const mods = this.parent.FindAllModifiersByName(this.GetName()) as CDOTA_Modifier_Lua[];
		mods.sort((a: CDOTA_Modifier_Lua, b: CDOTA_Modifier_Lua) => (
			b.GetPriority() - a.GetPriority() || a.GetCreationTime() - b.GetCreationTime()
		));
		for (const mod of mods) {
			if (ignore_self && mod == this) {
				continue;
			}
			const attribute = GetAttribute(mod, value);
			if (attribute != undefined) {
				return [attribute, mod];
			}
		}
		return [];
	}

	GetSharedValue(value: string, ignore_self?: boolean): any | undefined {
		return this.GetSharedValueAndSource(value, ignore_self)[0];
	}
}