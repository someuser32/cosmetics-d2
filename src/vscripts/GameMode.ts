import { reloadable } from "./lib/tstl-utils";
import { Cosmetic as CosmeticClass } from "./cosmetic/cosmetic";
import { GetAttribute, SetAttribute } from "./lib/client";

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
            GameRules.Cosmetic.PostInitOnce();
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
        GameRules.Cosmetic.OnNPCSpawned(npc);
		if (GetAttribute(npc, "bFirstSpawn", true) == true) {
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
