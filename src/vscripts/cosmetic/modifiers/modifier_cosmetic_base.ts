import { GetAttribute } from "../../lib/client";
import { BaseModifier } from "../../addon_init";

import { modifier_cosmetic_model_ts } from "./modifier_cosmetic_model";
import { modifier_cosmetic_activity_ts } from "./modifier_cosmetic_activity";

export declare type params = {
	style?: number,
	model: string,
	item_id: number
}

export class ModifierCosmeticBase extends BaseModifier {
	kv? : params;

	caster : CDOTA_BaseNPC = this.GetCaster()!;
	parent : CDOTA_BaseNPC = this.GetParent();

	style : number = 0;
	special_style? : number;
	model? : string;
	model_skin? : number;
	model_bodygroups : SpecialBehaviorModelInfo["bodygroups"] = {};
	activity? : string;

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
		this.caster = this.GetCaster()!;
		this.parent = this.GetParent();

		if (!IsServer()) {
			return;
		}

		this.style = kv.style ?? 0;
	}

	OnRefresh(kv: params): void {
		this.style = kv.style ?? this.style;
	}

	ReadAsset(asset_name: string, asset: any, array?: ItemsGameItem["visuals"][]): void {
	}

	ReadVisuals(visuals: ItemsGameItem["visuals"]={}): void {
		const styled_assets : ItemsGameItem["visuals"][] = [];
		for (const [asset_name, asset] of Object.entries(visuals)) {
			this.ReadAsset(asset_name, asset, styled_assets);
		}

		for (const styled_asset of styled_assets) {
			for (const [asset_name, asset] of Object.entries(styled_asset!)) {
				this.ReadAsset(asset_name, asset);
			}
		}

		this.SpecialBehaviors();
	}

	ReadSpecialBehavior(behavior_name: keyof SpecialBehavior, behavior: SpecialBehavior[keyof SpecialBehavior], array?: SpecialBehavior[]): void {
	}

	SpecialBehaviors(): boolean {
		const behaviors = GameRules.Cosmetic.behaviors_json["items"][this.kv!.item_id.toString()];

		if (behaviors == undefined) {
			return false;
		}

		this.special_style = this.style;

		if (behaviors["parent_style"] != undefined) {
			const item = GameRules.Cosmetic.items[behaviors["parent_style"]] as Item;
			if (item != undefined) {
				const modifier = GameRules.Cosmetic.GetModifierForSlot(this.caster, item["slot"]);
				if (modifier != undefined && modifier.kv != undefined && modifier.kv.item_id == behaviors["parent_style"]) {
					this.special_style = modifier.style;
				}
			}
		}

		const styled_behaviors : SpecialBehavior[] = [];

		for (const [behavior_name, behavior] of Object.entries(behaviors)) {
			this.ReadSpecialBehavior(behavior_name as keyof SpecialBehavior, behavior, styled_behaviors);
		}

		for (const styled_behavior of styled_behaviors) {
			for (const [behavior_name, behavior] of Object.entries(styled_behavior)) {
				this.ReadSpecialBehavior(behavior_name as keyof SpecialBehaviorInfo, behavior);
			}
		}

		return true;
	}

	ApplyVisuals(): void {
		if (!IsValidEntity(this.parent)) {
			return;
		}
		const [model, model_source] : [string, ModifierCosmeticBase] | [] = this.GetSharedValueAndSource("model");
		if (model != undefined) {
			modifier_cosmetic_model_ts.apply(this.parent, this.parent, undefined, {"model": model});
		} else {
			this.parent.RemoveModifierByName(modifier_cosmetic_model_ts.name);
		}

		const model_skin : number | undefined = this.GetSharedValue("model_skin");
		this.parent.SetSkin(model_skin ?? 0);
		this.parent.SetMaterialGroup(model_skin != undefined ? model_skin.toString() : "default");

		const model_bodygroups = this.GetUnionValue("model_bodygroups") as SpecialBehaviorModelInfo["bodygroups"];
		if (model_bodygroups != undefined) {
			for (const [bodygroup, value] of Object.entries(model_bodygroups)) {
				this.parent.SetBodygroupByName(bodygroup, value);
			}
		}

		const activity : string | undefined = this.GetSharedValue("activity");
		if (activity != undefined) {
			modifier_cosmetic_activity_ts.apply(this.parent, this.parent, undefined, {"activity": activity});
		} else {
			this.parent.RemoveModifierByName(modifier_cosmetic_activity_ts.name);
		}
	}

	ResetVisuals(): void {
		delete this.model;
		delete this.model_skin;

		if (this.model_bodygroups != undefined) {
			for (const [bodygroup, value] of Object.entries(this.model_bodygroups)) {
				this.parent.SetBodygroupByName(bodygroup, 0);
			}

			const model_bodygroups = this.GetUnionValue("model_bodygroups", true) as SpecialBehaviorModelInfo["bodygroups"];
			if (model_bodygroups != undefined) {
				for (const [bodygroup, value] of Object.entries(model_bodygroups)) {
					this.parent.SetBodygroupByName(bodygroup, value);
				}
			}

			this.model_bodygroups = {};
		}
	};

	OnDestroy(): void {
		if (!IsServer()) {
			return;
		}

		this.ResetVisuals();
		this.ApplyVisuals();
	}

	GetSharedValueAndSource(value: string, ignore_self?: boolean): [any, ModifierCosmeticBase] | [] {
		if (!IsValidEntity(this.parent)) {
			return [];
		}
		const mods = this.parent.FindAllModifiersByName(this.GetName()) as ModifierCosmeticBase[];
		mods.sort((a: ModifierCosmeticBase, b: ModifierCosmeticBase) => (b.GetPriority() - a.GetPriority() || a.GetCreationTime() - b.GetCreationTime()));
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

	GetUnionValue(value: string, ignore_self?: boolean): {[key : string | number | symbol] : any} | undefined {
		if (!IsValidEntity(this.parent)) {
			return;
		}
		const mods = this.parent.FindAllModifiersByName(this.GetName()) as ModifierCosmeticBase[];
		mods.sort((a: ModifierCosmeticBase, b: ModifierCosmeticBase) => (a.GetPriority() - b.GetPriority() || b.GetCreationTime() - a.GetCreationTime()));
		let result : {[key : string | number | symbol] : any} | undefined = undefined;
		for (const mod of mods) {
			if (ignore_self && mod == this) {
				continue;
			}
			const attribute = GetAttribute(mod, value);
			if (attribute != undefined) {
				if (attribute instanceof Object) {
					if (result == undefined) {
						result = attribute;
					} else if (typeof attribute == typeof result) {
						for (const [key, value] of Object.entries(attribute)) {
							result[key as string | number | symbol] = value;
						}
					}
				}
			}
		}
		return result;
	}
}