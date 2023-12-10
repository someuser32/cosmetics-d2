import { reloadable } from "./lib/tstl-utils";
import { Cosmetic as CosmeticClass } from "./cosmetic/cosmetic";

declare global {
    interface CDOTAGameRules {
        Addon: GameMode;
    }

    var Cosmetic : CosmeticClass | undefined;
}


@reloadable
export class GameMode {
    public static Precache(this: void, context: CScriptPrecacheContext): void {
        // PrecacheResource("particle", "particles/units/heroes/hero_meepo/meepo_earthbind_projectile_fx.vpcf", context);
        // PrecacheResource("soundfile", "soundevents/game_sounds_heroes/game_sounds_meepo.vsndevts", context);
    }

    public static Activate(this: void): void {
        GameRules.Addon = new GameMode();
        Cosmetic = new CosmeticClass();
    }

    constructor() {
        ListenToGameEvent("game_rules_state_change", () => this.OnStateChange(), undefined);
        ListenToGameEvent("npc_spawned", (event) => this.OnNPCSpawned(event), undefined);
        Cosmetic!.InitOnce();
        Cosmetic!.Init();
    }

    public OnStateChange(): void {
        const state = GameRules.State_Get();

        if (state === GameState.CUSTOM_GAME_SETUP) {
            Cosmetic!.PostInit();
        }
    }

    private OnNPCSpawned(event: NpcSpawnedEvent): void {
		const npc = EntIndexToHScript(event.entindex) as CDOTA_BaseNPC;
		if (!IsValidEntity(npc)) {
			return;
		}
        const playerID = npc.GetPlayerOwnerID();
        const original_hero = playerID != -1 ? PlayerResource.GetSelectedHeroEntity(playerID): undefined;
		if ((npc as any).bFirstSpawn != false) {
            if (IsValidEntity(original_hero)) {
                if (npc.IsHero() && npc.GetUnitName() == original_hero.GetUnitName()) {
                    Timers.CreateTimer({"endTime": 0.2, "callback": () => {
                        if (!IsValidEntity(npc)) {
                            return;
                        }
                        Cosmetic!.OnNPCSpawned(npc);
                    }}, this);
                }
            }
            (npc as any).bFirstSpawn = false;
        }
	}

    public Reload(): void {
        print("Script reloaded!");
    }

    public ReloadInitialized(): void {
        Cosmetic!.Init();
    }

    public ReloadPostInitialized(): void {
        Cosmetic!.PostInit();
    }
}
