-- PlayerResource
function CDOTA_PlayerResource:DisplayError(pId, msg)
	CustomGameEventManager:Send_ServerToPlayer(PlayerResource:GetPlayer(pId), "CreateIngameErrorMessage", {message=msg})
end
function CDOTA_PlayerResource:GetPlayerIDs()
	local players = {}
	for i=0, DOTA_MAX_TEAM_PLAYERS do
		if PlayerResource:IsValidPlayerID(i) then
			table.insert(players, i)
		end
	end
	return players
end
function CDOTA_PlayerResource:GetPlayerIDsInTeam(team)
	return table.values(table.filter(PlayerResource:GetPlayerIDs(), function(k, v)
		return PlayerResource:GetTeam(v) == team
	end))
end
function CDOTA_PlayerResource:GetTeams()
	return table.values(table.filter(TEAMS, function(_, team)
		return #PlayerResource:GetPlayerIDsInTeam(team) > 0
	end))
end
function CDOTA_PlayerResource:GetAvaiableTeams()
	return table.values(table.filter(TEAMS, function(_, team)
		return GameRules:GetCustomGameTeamMaxPlayers(team) > 0
	end))
end
function CDOTA_PlayerResource:GetOwningUnits(playerID)
	local hero = PlayerResource:GetSelectedHeroEntity(playerID)
	return table.values(table.filter(FindUnitsInRadius(PlayerResource:GetTeam(playerID), Vector(0, 0, 0), nil, FIND_UNITS_EVERYWHERE, DOTA_UNIT_TARGET_TEAM_FRIENDLY, DOTA_UNIT_TARGET_ALL, DOTA_UNIT_TARGET_FLAG_DEAD + DOTA_UNIT_TARGET_FLAG_INVULNERABLE + DOTA_UNIT_TARGET_FLAG_OUT_OF_WORLD, FIND_ANY_ORDER, false), function(_, unit)
		return unit:GetOwner() == hero:GetOwner()
	end))
end


-- Sounds
function EmitSoundOnLocationForTeam(sound, pos, team)
	local dummy = CreateUnitByName("npc_dummy_unit", pos, false, nil, nil, team)
	Timers:CreateTimer(60, function() UTIL_Remove(dummy) end)
	EmitSoundOnLocationForAllies(pos, sound, dummy)
end
function CDOTAPlayerController:EmitSoundOnClient(sound)
	CustomGameEventManager:Send_ServerToPlayer(self, "EmitSoundOnClient", {sound = sound})
end
function CDOTA_BaseNPC:EmitSoundOnClient(sound)
	local player = self:GetPlayerOwner()
	if player then
		CustomGameEventManager:Send_ServerToPlayer(player, "EmitSoundOnClient", {sound = sound})
	end
end
function EmitSoundWithCooldown(sound, cooldown, soundData)
	if SOUNDS_COOLDOWN[soundData["id"] or sound] == nil or (GameRules:GetGameTime() - SOUNDS_COOLDOWN[soundData["id"] or sound]) > cooldown then
		SOUNDS_COOLDOWN[soundData["id"] or sound] = GameRules:GetGameTime()
		if soundData["soundType"] == "unit" then
			soundData["unit"]:EmitSound(sound)
		elseif soundData["soundType"] == "unit_on" then
			EmitSoundOn(sound, soundData["unit"])
		elseif soundData["soundType"] == "unit_params" then
			soundData["unit"]:EmitSoundParams(sound, soundData["pitch"], soundData["volume"], soundData["delay"])
		elseif soundData["soundType"] == "player" then
			soundData["unit"]:EmitSoundOnClient(sound)
		elseif soundData["soundType"] == "location" then
			EmitSoundOnLocationWithCaster(soundData["location"], sound, soundData["unit"])
		elseif soundData["soundType"] == "location_team" then
			EmitSoundOnLocationForTeam(sound, soundData["location"], soundData["team"])
		elseif soundData["soundType"] == "global" then
			EmitGlobalSound(sound)
		elseif soundData["soundType"] == "announcer_team" then
			EmitAnnouncerSoundForTeam(sound, soundData["team"])
		elseif soundData["soundType"] == "announcer" then
			EmitAnnouncerSound(sound)
		elseif soundData["soundType"] == "announcer_player" then
			EmitAnnouncerSoundForPlayer(sound, soundData["unit"])
		elseif soundData["soundType"] == "announcer_team_location" then
			EmitAnnouncerSoundForTeamOnLocation(sound, soundData["team"], soundData["location"])
		end
	end
end
function CDOTABaseAbility:EmitResponseSound(sound, range, random, cooldown)
	if self:IsStolen() then return end
	if random then if not RollPercentage(random) then return end end
	if cooldown then
		id = tostring(self:entindex()..sound..self:GetCaster():entindex())
		if SOUNDS_COOLDOWN[id] ~= nil and (GameRules:GetDOTATime(false, false) - SOUNDS_COOLDOWN[id]) <= cooldown then
			return
		end
		SOUNDS_COOLDOWN[id] = GameRules:GetDOTATime(false, false)
	end
	local nums = {}
	for _, _rn in pairs(range) do
		if string.find(_rn, "-") ~= nil then
			local rn = string.split(_rn, "-")
			for i=tonumber(rn[1]), tonumber(rn[2]) do
				table.insert(nums, i)
			end
		else
			table.insert(nums, tonumber(_rn))
		end
	end
	self:GetCaster():EmitSoundOnClient(sound..string.format("%02d", table.choice(nums)))
end

-- Entities
function CBaseEntity:IsMonkey() return false end
function CDOTA_BaseNPC:IsMonkey()
	return self:HasModifier("modifier_monkey_king_wukongs_command_clone_lua") or self:HasModifier("modifier_monkey_king_fur_army_soldier_hidden") or self:HasModifier("modifier_monkey_king_fur_army_soldier") or self:HasModifier("modifier_monkey_king_fur_army_soldier_in_position") or self:HasModifier("modifier_monkey_king_fur_army_soldier_inactive")
end
if not inited then
	local valve_isclone = CDOTA_BaseNPC.IsClone
	CDOTA_BaseNPC.IsClone = function(self)
		if valve_isclone(self) then return true end
		if IsValidEntity(self) and self.GetPlayerOwnerID then
			local owner = PlayerResource:GetSelectedHeroEntity(self:GetPlayerOwnerID())
			return owner ~= nil and self ~= owner and self:IsRealHero() and self:GetUnitName() == owner:GetUnitName() and not self:IsTempestDouble() and not self:IsMonkey() and not self:HasModifier("modifier_vengefulspirit_command_aura_illusion")
		end
	end
end
function CBaseEntity:IsTrueHero(ignore_clones)
	return not self:IsNull() and self:IsRealHero() and not self:IsIllusion() and not self:IsMonkey() and not self:HasModifier("modifier_vengefulspirit_command_aura_illusion") and (ignore_clones or (not self:IsClone() and not self:IsTempestDouble()))
end
function CDOTA_BaseNPC:GetCastingAbility()
	for i=0, DOTA_MAX_ABILITIES-1 do
		local ability = self:GetAbilityByIndex(i)
		if ability and ability:IsInAbilityPhase() then return ability end
	end
	return nil
end
function CDOTA_BaseNPC:SpawnAttachment(model)
	local attachment = SpawnEntityFromTableSynchronous("prop_dynamic", {model=model})
	attachment:FollowEntity(self, true)
	return attachment
end
function CDOTA_BaseNPC:Dispell(caster, strong)
	local modifiers = table.values(table.map(table.filter(self:FindAllModifiers(), function(_, mod)
		return (self:GetTeamNumber() == caster:GetTeamNumber() and {mod:IsDebuff()} or {not mod:IsDebuff()})[1]
	end), function(_, mod)
		return {mod, mod:GetName()}
	end))
	local dispelled = {}
	self:Purge(self:GetTeamNumber() ~= caster:GetTeamNumber(), self:GetTeamNumber() == caster:GetTeamNumber(), false, self:GetTeamNumber() == caster:GetTeamNumber() and strong, strong)
	local new_modifiers = table.values(table.filter(self:FindAllModifiers(), function(_, mod)
		return (self:GetTeamNumber() == caster:GetTeamNumber() and {mod:IsDebuff()} or {not mod:IsDebuff()})[1]
	end))
	for _, mod in pairs(modifiers) do
		if mod[1]:IsNull() or not table.contains(new_modifiers, mod[1]) then
			table.insert(dispelled, mod[2])
		end
	end
	return dispelled
end
function CDOTA_BaseNPC:LearnSpells()
	for i=0, DOTA_MAX_ABILITIES-1 do
		local ability = self:GetAbilityByIndex(i)
		if ability then
			ability:SetLevel(ability:GetMaxLevel())
		end
	end
end
function CDOTA_BaseNPC:GetSpells()
	local t = {}
	for i=0, DOTA_MAX_ABILITIES-1 do
		local ability = self:GetAbilityByIndex(i)
		if ability then
			t[i] = ability
		end
	end
	return t
end
function CDOTA_BaseNPC:HasModifierState(state, exceptions)
	for _, mod in pairs(self:FindAllModifiers()) do
		if not exceptions or not table.contains(exceptions, mod) then
			local states = {} mod:CheckStateToTable(states)
			if states[tostring(state)] ~= nil then return true end
		end
	end
	return false
end
function CDOTA_BaseNPC:IsDebuffImmune()
	return self:HasModifierState(MODIFIER_STATE_DEBUFF_IMMUNE)
end
function CDOTA_BaseNPC:IsTaunted()
	return self:HasModifierState(MODIFIER_STATE_TAUNTED)
end
function CBaseEntity:MakeDummy(phased, nodraw, hideminimap)
	if nodraw ~= false then
		self:AddNoDraw()
	end
	self:AddNewModifier(nil, nil, "modifier_dummy_unit", {not_on_minimap = hideminimap ~= false or nodraw ~= false})
	if phased or phased == nil then
		self:AddNewModifier(nil, nil, "modifier_phased", {})
	end
end
function CBaseEntity:UnDummy(unphase)
	self:RemoveNoDraw()
	self:RemoveModifierByName("modifier_dummy_unit")
	if unphase then
		self:RemoveModifierByName("modifier_phased")
	end
end
function CreateDummy(position, team, owner, phased, nodraw, hideminimap)
	local unit = CreateUnitByName("npc_dummy_unit", position, false, owner, owner, team)
	unit:UnDummy()
	unit:MakeDummy(phased, nodraw, hideminimap)
	return unit
end
function CBaseEntity:IsDummy()
	return self:HasModifier("modifier_dummy_unit")
end
function CreateTrueSight(position, team, radius)
	local unit = CreateDummy(position, team, nil)
	unit:AddNewModifier(unit, nil, "modifier_truesight_aura_lua", {radius=radius})
	return unit
end
function CDOTA_BaseNPC:Knockback(caster, ability, duration, knockback_info)
	local knockback = {
		should_stun = BoolToNum(knockback_info["stun"]) or 0,
		knockback_duration = knockback_info["duration"] or duration or 1,
		duration = duration or 1,
		knockback_distance = knockback_info["distance"] or 0,
		knockback_height = knockback_info["height"] or 0,
		center_x = knockback_info["center"] ~= nil and knockback_info["center"].x or self:GetAbsOrigin().x,
		center_y = knockback_info["center"] ~= nil and knockback_info["center"].y or self:GetAbsOrigin().y,
		center_z = knockback_info["center"] ~= nil and knockback_info["center"].z or self:GetAbsOrigin().z,
	}
	self:RemoveModifierByName("modifier_knockback")
	return self:AddNewModifier(caster, ability, "modifier_knockback", knockback)
end
function CDOTA_BaseNPC:GetItemsByName(itemnames, in_backpack, in_stash)
	local search = table.copy(INVENTORY_SLOTS)
	if in_backpack then search = table.combine(search, BACKPACK_SLOTS) end
	if in_stash then search = table.combine(search, STASH_SLOTS) end
	local items = {}
	for _, slot in pairs(search) do
		local item = self:GetItemInSlot(slot)
		if item ~= nil and not item:IsNull() and item.GetName and table.contains(itemnames, item:GetName()) then
			items[slot] = item
		end
	end
	return items
end
function CDOTA_BaseNPC:FindFreeSlot()
	for i=DOTA_ITEM_SLOT_1, DOTA_ITEM_TP_SCROLL do
		local item = self:GetItemInSlot(i)
		if item == nil then
			return i
		end
	end
	return nil
end
function CDOTA_BaseNPC:TrueKill(inflictor, attacker)
	local exceptions = {
		"modifier_skeleton_king_reincarnation_scepter_active",
	}
	local additionals = {
		"modifier_item_aeon_disk_buff",
		"modifier_winter_wyvern_winters_curse_aura",
		"modifier_winter_wyvern_winters_curse",
		"winter_wyvern_winters_curse_kill_credit",
		"modifier_abaddon_aphotic_shield",
		"modifier_abaddon_borrowed_time",
		"modifier_monkey_king_transform",
		"modifier_nyx_assassin_spiked_carapace",
		"modifier_oracle_false_promise",
		"modifier_templar_assassin_refraction_absorb",
		"modifier_dazzle_shallow_grave",
		"modifier_troll_warlord_battle_trance",
		"modifier_fountain_aura_buff",
	}
	local survived = false
	for _, mod in pairs(self:FindAllModifiers()) do
		if table.contains(exceptions, mod:GetName()) then
			survived = true
		elseif (mod.GetMinHealth or mod.GetModifierIncomingDamage_Percentage or mod.GetModifierIncomingSpellDamageConstant or mod.GetModifierAvoidDamage or mod.GetModifierAvoidSpell or mod.GetModifierTotal_ConstantBlock or mod.GetAbsoluteNoDamagePure or table.contains(additionals, mod:GetName())) then
			mod:Destroy()
		else
			local states = {} mod:CheckStateToTable(states)
			for _, state in pairs({MODIFIER_STATE_INVULNERABLE}) do
				if table.contains(states, state) then
					mod:Destroy()
				end
			end
		end
	end
	self:Kill(inflictor, attacker)
	return not survived
end
function CDOTA_BaseNPC:CanSeeByEnemy()
	for _,enemy in pairs(FindUnitsInRadius(self:GetTeamNumber(), self:GetAbsOrigin(), nil, FIND_UNITS_EVERYWHERE, DOTA_UNIT_TARGET_TEAM_ENEMY, DOTA_UNIT_TARGET_ALL, DOTA_UNIT_TARGET_FLAG_MAGIC_IMMUNE_ENEMIES + DOTA_UNIT_TARGET_FLAG_INVULNERABLE + DOTA_UNIT_TARGET_FLAG_OUT_OF_WORLD, FIND_ANY_ORDER, false)) do
		if enemy:GetTeamNumber() ~= DOTA_TEAM_NEUTRALS and enemy:CanEntityBeSeenByMyTeam(self) then return true end
	end
	return false
end
function CDOTA_BaseNPC:GetIllusionSource()
	local illusion = self:FindModifierByName("modifier_illusion")
	return illusion ~= nil and illusion:GetCaster() or nil
end
function CDOTA_BaseNPC:GetSource()
	return self:IsClone() and self:GetCloneSource() or (self:GetIllusionSource() or (self:GetPlayerOwnerID() ~= nil and PlayerResource:GetSelectedHeroEntity(self:GetPlayerOwnerID()) or nil))
end
function CDOTA_BaseNPC:FindModifierByNameAndAbility(name, ability, caster)
	for _, mod in pairs(self:FindAllModifiersByName(name)) do
		if mod:GetAbility() == ability and (caster ~= nil and {mod:GetCaster() == caster} or (caster == "nil" and {mod:GetCaster() == nil} or {true}))[1] then return mod end
	end
	return nil
end
function CDOTA_BaseNPC:GetFountain()
	for _, ent in pairs(Entities:FindAllByClassname("ent_dota_fountain")) do
		if ent:GetTeamNumber() == self:GetTeamNumber() then
			return ent
		end
	end
end
function CDOTA_BaseNPC:FindModifiersByNameAbility(name, ability, caster)
	return table.values(table.filter(self:FindAllModifiersByName(name), function(_, mod) return mod:GetAbility() == ability and (caster ~= nil and {mod:GetCaster() == caster} or (caster == "nil" and {mod:GetCaster() == nil} or {true}))[1] end))
end
function CDOTA_BaseNPC:FindModifiersByAbility(ability, caster)
	return table.values(table.filter(self:FindAllModifiers(), function(_, mod) return mod:GetAbility() == ability and (caster ~= nil and {mod:GetCaster() == caster} or (caster == "nil" and {mod:GetCaster() == nil} or {true}))[1] end))
end

-- Abilities
function CDOTABaseAbility:GetCastTime()
	return self:GetCastPoint() * self:GetCastPointModifier()
end
function CDOTABaseAbility:FindAllModifiers(name)
	return table.values(table.filter(name ~= nil and self:GetCaster():FindAllModifiersByName(name) or self:GetCaster():FindAllModifiers(), function(_, mod) return mod:GetAbility() == self end))
end

-- Modifiers
function CDOTA_Buff:LinkModifier(modifier, modifier_data)
	self.link = modifier
	self.linked = {caster = modifier:GetCaster(), ability = modifier:GetAbility(), name = modifier:GetName(), data = table.merge({duration = modifier:GetDuration()}, modifier_data)}
	Timers:CreateTimer({endTime = FrameTime(), callback = function()
		if not self or self:IsNull() then
			if modifier ~= nil and not modifier:IsNull() then
				modifier:Destroy()
			end
			return
		end
		if self.linked ~= nil then
			self.link = self.link ~= nil and not self.link:IsNull() and self.link or self:GetParent():AddNewModifier(self.linked["caster"], self.linked["ability"], self.linked["name"], self.linked["data"])
			if self.link and not self.link:IsNull() then
				if self.link:GetRemainingTime() ~= self:GetRemainingTime() then
					self.link:SetDuration(self:GetRemainingTime(), true)
				end
			end
			return FrameTime()
		end
	end}, nil, self)
end
function CDOTA_Buff:UnlinkModifier(save)
	self.linked = nil
	if self.link and not self.link:IsNull() and not save then
		self.link:Destroy()
	end
	self.link = nil
end
function CDOTA_Buff:OnDestroyLink()
	self:UnlinkModifier()
end
function CDOTA_Buff:is_highest()
	local mods = self:GetParent():FindAllModifiersByName(self:GetName())
	table.sort(mods, function(a, b)
		return a:GetPriority() < b:GetPriority() or a:GetCreationTime() > b:GetCreationTime()
	end)
	return mods[1] == self or mods[1] == nil
end
function CDOTA_Buff:destroy_other_me()
	for _, mod in pairs(self:GetParent():FindAllModifiersByName(self:GetName())) do
		if mod ~= self and mod:GetAbility() == self:GetAbility() then
			mod:Destroy()
		end
	end
end
function CDOTA_Buff:HasModifierState(state)
	return self:GetParent():HasModifierState(state, {self})
end

-- Global
function GetLocalPlayerID()
	return Entities:GetLocalPlayer():GetPlayerID()
end

-- GridNav
function GridNav:IsLocationVisibleForAnyTeam(vLocation)
	for _, team in pairs(PlayerResource:GetTeams()) do
		if IsLocationVisible(team, vLocation) then
			return true
		end
	end
	return false
end