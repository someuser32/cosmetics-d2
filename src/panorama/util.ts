class Hud {
	constructor() {
	}

	static GetResolutionRatio(): number {
		return 1080 / Game.GetScreenHeight();
	}

	static GetDOTAHud(): Panel {
		let temp_pan : Panel = $.GetContextPanel();
		while (temp_pan.GetParent() != null) {
			temp_pan = temp_pan.GetParent()!;
		};
		return temp_pan;
	};

	static GetCustomHud(): Panel {
		return Hud.GetDOTAHud().FindChildTraverse("CustomUIContainer_Hud")!.GetParent()!;
	};
}

class TopbarModule {
	static teamnames : {[topbar_style: string]: {[team: DOTATeam_t | number]: string}} = {
		"dota": {
			[DOTATeam_t.DOTA_TEAM_GOODGUYS]: "Radiant",
			[DOTATeam_t.DOTA_TEAM_BADGUYS]: "Dire",
			[DOTATeam_t.DOTA_TEAM_CUSTOM_1]: "Custom1",
			[DOTATeam_t.DOTA_TEAM_CUSTOM_2]: "Custom2",
			[DOTATeam_t.DOTA_TEAM_CUSTOM_3]: "Custom3",
			[DOTATeam_t.DOTA_TEAM_CUSTOM_4]: "Custom4",
			[DOTATeam_t.DOTA_TEAM_CUSTOM_5]: "Custom5",
			[DOTATeam_t.DOTA_TEAM_CUSTOM_6]: "Custom6",
			[DOTATeam_t.DOTA_TEAM_CUSTOM_7]: "Custom7",
			[DOTATeam_t.DOTA_TEAM_CUSTOM_8]: "Custom8",
		},
		"multiteam": {
			[DOTATeam_t.DOTA_TEAM_GOODGUYS]: "Radiant",
			[DOTATeam_t.DOTA_TEAM_BADGUYS]: "Dire",
			[DOTATeam_t.DOTA_TEAM_CUSTOM_1]: "Custom1",
			[DOTATeam_t.DOTA_TEAM_CUSTOM_2]: "Custom2",
			[DOTATeam_t.DOTA_TEAM_CUSTOM_3]: "Custom3",
			[DOTATeam_t.DOTA_TEAM_CUSTOM_4]: "Custom4",
			[DOTATeam_t.DOTA_TEAM_CUSTOM_5]: "Custom5",
			[DOTATeam_t.DOTA_TEAM_CUSTOM_6]: "Custom6",
			[DOTATeam_t.DOTA_TEAM_CUSTOM_7]: "Custom7",
			[DOTATeam_t.DOTA_TEAM_CUSTOM_8]: "Custom8",
		},
	};

	constructor() {
	}

	static GetTopbarStyle(): string | undefined {
		const dotahud = Hud.GetDOTAHud();
		const customhud = Hud.GetCustomHud();
		const customtopbar = customhud.FindChildTraverse("CustomUIContainer_HudTopBar");
		if (dotahud.FindChildTraverse("topbar")!.FindChildTraverse("TopBarRadiantTeam")!.visible) {
			return "dota"
		} else if (customtopbar != null) {
			if (customtopbar.FindChildTraverse("BlackScreen") != null && customtopbar.FindChildTraverse("BlackScreen")!.visible) {
				return "multiteam";
			}
		}
	}

	static GetTopbarPlayerSlot(playerID: PlayerID): Panel | null {
		const style = TopbarModule.GetTopbarStyle();
		if (style == undefined) {
			return null;
		}
		const teamname = TopbarModule.teamnames[style][Players.GetTeam(playerID)];
		const dotahud = Hud.GetDOTAHud();
		const customhud = Hud.GetCustomHud();
		if (style == "dota") {
			return dotahud.FindChildTraverse("HUDElements")!.FindChildTraverse("topbar")!.FindChildTraverse(`${teamname}Player${playerID}`);
		} else if (style == "multiteam") {
			return customhud.FindChildTraverse("MultiteamScoreboard")!.FindChildTraverse(`_dynamic_player_${playerID}`);
		}
		return null;
	}

	static GetTopbarPlayerImage(playerID: PlayerID): HeroImage | ImagePanel | null {
		const slot = TopbarModule.GetTopbarPlayerSlot(playerID);
		if (slot == null) {
			return null;
		}
		const style = TopbarModule.GetTopbarStyle();
		if (style == "dota") {
			return slot.FindChildTraverse("HeroImage") as HeroImage;
		}
		return null;
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

	static findKey<T extends Object, K extends keyof T>(obj: T, value: T[K]): K | undefined {
		return Object.keys(obj).find((key) => (obj as any)[key] === value) as K | undefined;
	}
}