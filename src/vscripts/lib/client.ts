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

export function IsTempestDouble(npc: CBaseEntity): boolean {
	return GetAttribute(npc, "_is_tempest_double", false) == true || (IsValidEntity(npc) && !npc.IsNull() && npc.IsBaseNPC() && ((npc.IsTempestDouble != undefined && npc.IsTempestDouble()) || npc.HasModifier("modifier_arc_warden_tempest_double_lua")));
}