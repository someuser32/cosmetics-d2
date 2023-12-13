declare global {
	interface CDOTA_Buff {
		IsNull(): boolean
	}
}


import "./lib/client";
import { CosmeticModifier } from "./cosmetic/modifiers/basemodifier";


export class BaseModifier extends CosmeticModifier {};