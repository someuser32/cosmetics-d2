import { registerModifier } from "../../lib/dota_ts_adapter";
import { BaseModifier } from "../../addon_init";

declare type params = {
	ranged_projectile: string
};

@registerModifier()
export class modifier_cosmetic_ranged_projectile_ts extends BaseModifier {
	ranged_projectile : string = "";

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
		return [ModifierFunction.PROJECTILE_NAME];
	}

	OnCreated(kv: params): void {
		if (!IsServer()) {
			return;
		}

		this.ranged_projectile = kv.ranged_projectile;
	}

	OnRefresh(kv: params): void {
		this.OnCreated(kv);
	}

	GetModifierProjectileName(): string {
		return this.ranged_projectile;
	}
}