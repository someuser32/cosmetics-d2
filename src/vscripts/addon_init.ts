declare global {
	interface CDOTA_Buff {
		IsNull(): boolean
	}
}


import { CosmeticModifier } from "./cosmetic/cosmetic";
import "./lib/client";


export declare interface BaseModifier extends CosmeticModifier {};
export declare class BaseModifier extends CosmeticModifier {};