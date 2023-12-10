import { reloadable } from "./lib/tstl-utils";
import { Cosmetic as CosmeticClass } from "./cosmetic/cosmetic";
import { GetAttribute, SetAttribute } from "./lib/client";
import { IsTrueHero } from "./lib/server";

declare global {
    interface CDOTAGameRules {
        Addon: GameMode;
        Cosmetic: CosmeticClass;
    }
}


@reloadable
export class GameMode {
    public static Precache(this: void, context: CScriptPrecacheContext): void {
        // PrecacheResource("particle", "particles/units/heroes/hero_meepo/meepo_earthbind_projectile_fx.vpcf", context);
        // PrecacheResource("soundfile", "soundevents/game_sounds_heroes/game_sounds_meepo.vsndevts", context);
    }

    public static Activate(this: void): void {
        GameRules.Addon = new GameMode();
        GameRules.Cosmetic = new CosmeticClass();
        GameRules.Cosmetic.InitOnce();
        GameRules.Cosmetic.Init();
    }

    constructor() {
        ListenToGameEvent("game_rules_state_change", () => this.OnStateChange(), undefined);
        ListenToGameEvent("npc_spawned", (event) => this.OnNPCSpawned(event), undefined);
    }

    public OnStateChange(): void {
        const state = GameRules.State_Get();

        if (state === GameState.CUSTOM_GAME_SETUP) {
            GameRules.Cosmetic.PostInit();
        }
    }

    private OnNPCSpawned(event: NpcSpawnedEvent): void {
		const npc = EntIndexToHScript(event.entindex) as CDOTA_BaseNPC;
		if (!IsValidEntity(npc)) {
			return;
		}
        const playerID = npc.GetPlayerOwnerID();
        const original_hero = playerID != -1 ? PlayerResource.GetSelectedHeroEntity(playerID): undefined;
		if (GetAttribute(npc, "bFirstSpawn", true) == true) {
            if (npc.IsHero()) {
                if (IsValidEntity(original_hero) || IsTrueHero(npc)) {
                    if (original_hero == undefined || npc.GetUnitName() == original_hero.GetUnitName()) {
                        Timers.CreateTimer({"endTime": 0.2, "callback": () => {
                            if (!IsValidEntity(npc)) {
                                return;
                            }
                            GameRules.Cosmetic.OnNPCSpawned(npc);
                        }}, this);
                    }
                }
            }
            SetAttribute(npc, "bFirstSpawn", false);
        }
	}

    public Reload(): void {
        print("Script reloaded!");
    }

    public ReloadInitialized(): void {
        GameRules.Cosmetic.Init();
    }

    public ReloadPostInitialized(): void {
        GameRules.Cosmetic.PostInit();
    }
}
