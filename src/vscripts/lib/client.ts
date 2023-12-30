const DOTABaseNPC = IsServer() ? CDOTA_BaseNPC : C_DOTA_BaseNPC;

declare global {
	interface DOTABaseNPC {
		IsTempestDouble(): boolean,
		IsTempestDoubleCustom(): boolean
	}

	interface CDOTA_BaseNPC extends DOTABaseNPC {}

	interface C_DOTA_BaseNPC extends DOTABaseNPC {}

	interface CDOTA_Buff {
		GetModifierStates(): {[state : string] : boolean}
	}
}

export class MathUtils {
	constructor() {
	}

	static roundFloat(num: number, to: number): number {
		return Number(num.toFixed(to));
	}
}

export class ObjectUtils {
	constructor() {
	}

	static fromEntries<V>(entries: Array<[keyof V, V[keyof V]]>): V {
        return entries.reduce((obj, [key, val]) => {
            obj[key] = val;
            return obj;
        }, {} as V);
    }

	static filter<V extends {}>(obj: V, predicate: (entry: [keyof V, V[keyof V]]) => boolean): V {
        return ObjectUtils.fromEntries(
            (Object.entries(obj) as [keyof V, V[keyof V]][]).filter(entry => predicate(entry))
        ) as V;
    }
}

export function hexToRGB(hex: string): RGBColorArray {
	const decimal = parseInt(hex, 16);
	return [(decimal >> 16) & 255, (decimal >> 8) & 255, decimal & 255];
}

export function GetAttribute(obj: any, attribute: string, default_value?: any): any | undefined {
	return obj[attribute] ?? default_value;
}

export function SetAttribute(obj: any, attribute: string, value?: any): void {
	if (value === undefined) {
		delete obj[attribute];
		return;
	}
	obj[attribute] = value;
}

if (IsServer()) {
	if (GameRules == undefined || GameRules.Addon == undefined) {
		const valve_is_tempest_double = CDOTA_BaseNPC.IsTempestDouble;
		CDOTA_BaseNPC.IsTempestDouble = function(): boolean {
			return GetAttribute(this, "_is_tempest_double", false) == true || (IsValidEntity(this) && (valve_is_tempest_double.bind(this)() || this.IsTempestDoubleCustom()));
		}
	}
} else {
	C_DOTA_BaseNPC.IsTempestDouble = function(): boolean {
		return GetAttribute(this, "_is_tempest_double", false) == true || (IsValidEntity(this) && this.IsTempestDoubleCustom());
	}
}

DOTABaseNPC.IsTempestDoubleCustom = function(): boolean {
	return GetAttribute(this, "_is_tempest_double", false) == true || (IsValidEntity(this) && (this.HasModifier("modifier_arc_warden_tempest_double_lua")));
}

CDOTA_Buff.GetModifierStates = function() : {[state : string] : boolean} {
	const states = {};
	this.CheckStateToTable(states);
	return states;
}