_G.SOUNDS_COOLDOWN = SOUNDS_COOLDOWN or {}
_G.TEAMS = {DOTA_TEAM_GOODGUYS, DOTA_TEAM_BADGUYS}

require("timers")

require("server")

require("cosmetic")

CAddonTemplateGameMode = CAddonTemplateGameMode or class({})

function Precache(context)
end

function Activate()
	CAddonTemplateGameMode():InitGameMode()
end

function CAddonTemplateGameMode:InitGameMode()
	ListenToGameEvent("game_rules_state_change", self.OnStateChanged, self)
	Cosmetic:InitOnce()
	Cosmetic:Init()
end

function CAddonTemplateGameMode:OnStateChanged()
	if GameRules:State_Get() == DOTA_GAMERULES_STATE_CUSTOM_GAME_SETUP then
		Cosmetic:PostInit()
	end
end

-- local hero = PlayerResource:GetSelectedHeroEntity(0)
-- hero:SetHealthBarOffsetOverride(200)

-- CreateRune(GetGroundPosition(Vector(0,0,0), nil), DOTA_RUNE_ILLUSION)