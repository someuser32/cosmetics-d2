import { registerModifier } from "../../lib/dota_ts_adapter";
import { BaseModifier } from "../../addon_init";

declare type params = {
	activity: string
};

@registerModifier()
export class modifier_cosmetic_activity_ts extends BaseModifier {
	activity : string = "";

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
		return [ModifierFunction.TRANSLATE_ACTIVITY_MODIFIERS];
	}

	OnCreated(kv: params): void {
		if (!IsServer()) {
			return;
		}

		this.activity = kv.activity;
	}

	OnRefresh(kv: params): void {
		this.OnCreated(kv);
	}

	GetActivityTranslationModifiers(): string {
		return this.activity;
	}
}