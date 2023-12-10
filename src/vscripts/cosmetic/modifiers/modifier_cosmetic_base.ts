import { GetAttribute } from "../../lib/client";
import { BaseModifier } from "../../lib/dota_ts_adapter";

declare type params = {
	style: number | undefined
};

export class ModifierCosmeticBase extends BaseModifier {
	parent : CDOTA_BaseNPC = this.GetParent();
	style : number = -1;

	model : string | undefined;
	model_skin : number | undefined;
	healthbar_offset : number | undefined;
	unit_models : string[] = [];

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

	ReadVisuals(visuals: ItemsGameItemAssetModifier): void {
	}

	ApplyVisuals(): void {
		const model_skin : number | undefined = this.GetSharedValue("model_skin");
		const healthbar_offset : number | undefined = this.GetSharedValue("healthbar_offset");
		const [model, model_source] : [string, CDOTA_Modifier_Lua] | [] = this.GetSharedValueAndSource("model");
		this.parent.SetSkin(model_skin ?? 0);
		this.parent.SetHealthBarOffsetOverride(healthbar_offset ?? this.parent.GetBaseHealthBarOffset());
		if (model != undefined) {
			this.parent.AddNewModifier(this.parent, undefined, "modifier_cosmetic_model_ts", {"model": model});
			const model_source_style : number | undefined = GetAttribute(model_source!, "style");
			if (model_source_style != undefined) {
				this.parent.SetMaterialGroup(model_source_style.toString());
			}
		} else {
			this.parent.RemoveModifierByName("modifier_cosmetic_model_ts");
			this.parent.SetMaterialGroup("default");
		}
	}

	ResetVisuals(): void {
		delete this.model;
		delete this.model_skin;
		delete this.healthbar_offset;
		this.unit_models = [];
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