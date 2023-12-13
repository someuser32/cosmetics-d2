import { BaseModifier } from "../../lib/dota_ts_adapter";


export declare interface CosmeticModifier extends BaseModifier {
	GetEffect(): string
}

export class CosmeticModifier extends BaseModifier {
	GetEffectName(): string {
		return this.GetEffect();
	}

	GetEffect(): string {
		return "";
	}
}