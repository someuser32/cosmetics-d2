import "./lib/timers";
import "./lib/server";
import { GameMode } from "./GameMode";

Object.assign(getfenv(), {
    Activate: GameMode.Activate,
    Precache: GameMode.Precache,
});

if (GameRules.Addon !== undefined) {
    GameRules.Addon.Reload();

    if (GameRules.GetGameModeEntity != undefined) {
        GameRules.Addon.ReloadInitialized();
    }

    if (CustomNetTables != undefined) {
        GameRules.Addon.ReloadPostInitialized();
    }
}