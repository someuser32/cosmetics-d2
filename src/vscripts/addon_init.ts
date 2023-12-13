declare global {
	interface CDOTA_Buff {
		IsNull(): boolean
	}
}


import "./lib/client";
import { CosmeticModifier } from "./cosmetic/modifiers/basemodifier";


export declare class BaseModifier extends CosmeticModifier {};