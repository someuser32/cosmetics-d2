import { registerModifier } from "../../lib/dota_ts_adapter";
import { BaseModifier } from "../../addon_init";

declare type params = {
	model: string
};

@registerModifier()
export class modifier_cosmetic_model_ts extends BaseModifier {
	model : string = "";

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

	GetPriority(): ModifierPriority {
		return ModifierPriority.LOW;
	}

	DeclareFunctions(): ModifierFunction[] {
		return [ModifierFunction.MODEL_CHANGE];
	}

	OnCreated(kv: params): void {
		if (!IsServer()) {
			return;
		}

		this.model = kv.model;
	}

	OnRefresh(kv: params): void {
		this.OnCreated(kv);
	}

	GetModifierModelChange(): string {
		return this.model;
	}
}