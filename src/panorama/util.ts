class Hud {
	constructor() {
	}

	static GetResolutionRatio(): number {
		return 1080 / Game.GetScreenHeight();
	}
}

class ObjectUtils {
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