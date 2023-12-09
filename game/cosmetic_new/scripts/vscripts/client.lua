if IsClient() then
-- overriding valve-broken functions
C_DOTA_Ability_Lua.GetCastRangeBonus = function(self, hTarget)
	if not self or self:IsNull() then return 0 end
	if not self:GetCaster() or self:GetCaster():IsNull() then return 0 end
	return self:GetCaster():GetCastRangeBonus()
end
C_DOTABaseAbility.GetCastRangeBonus = function(self, hTarget)
	if not self or self:IsNull() then return 0 end
	if not self:GetCaster() or self:GetCaster():IsNull() then return 0 end
	return self:GetCaster():GetCastRangeBonus()
end
end

-- math
function BoolToNum(v)
	if type(v) == "number" then return v == 1
	elseif type(v) == "boolean" then if v then return 1 else return 0 end end
end
function CalculateDistance(ent1, ent2)
	local pos1 = ent1
	local pos2 = ent2
	if ent1.GetAbsOrigin then pos1 = ent1:GetAbsOrigin() end
	if ent2.GetAbsOrigin then pos2 = ent2:GetAbsOrigin() end
	local distance = (pos1 - pos2):Length2D()
	return distance
end
function DirectionRange(direction, max, min)
	if max and direction:Length2D() > max then
		return direction:Normalized() * max
	elseif min and direction:Length2D() < min then
		return direction:Normalized() * min
	end
	return direction
end
function VectorIncludes(vect1, vect2, rad)
	local radius = rad or 16
	return math.abs(vect1.x-vect2.x) <= radius and math.abs(vect1.z-vect2.z) <= radius and math.abs(vect1.y-vect2.y) <= radius
end
function math.round(val, decimal)
	local exp = decimal and 10^decimal or 1
	return math.ceil(val * exp - 0.5) / exp
end
function math.symbolsCount(num)
	return #(string.gsub(tostring(num),"%p+",""))
end

-- string
function string.split(str, sep)
	if sep == nil then sep = "%s" end
	local t = {}
	for s in string.gmatch(str, "([^"..sep.."]+)") do
		table.insert(t, s)
	end
	return t
end
function string.startswith(str, find)
	return string.sub(str, 1, string.len(find)) == find
end
function string.endswith(str, find)
	return string.sub(str, string.len(str)-string.len(find)+1, string.len(str)) == find
end

-- table
function table.find(t, e)
	for k,v in pairs(t) do
		if (type(v) ~= "table" or type(e) ~= "table") and v == e then
			return k
		elseif type(v) == "table" and type(e) == "table" and table.equals(v, e) then
			return k
		end
	end
end
function table.contains(t, e)
	for k,v in pairs(t) do
		if (type(v) ~= "table" or type(e) ~= "table") and v == e then
			return true
		elseif type(v) == "table" and type(e) == "table" and table.equals(v, e) then
			return true
		end
	end
	return false
end
function table.length(t)
	return #table.values(t)
end
function table.firstkey(t, filt)
	for k,v in pairs(t) do
		if filt == nil or (pcall(filt, k, v) == true and filt(k, v)) then
			return k
		end
	end
end
function table.first(t, filt)
	for k,v in pairs(t) do
		if filt == nil or (pcall(filt, k, v) == true and filt(k, v)) then
			return v
		end
	end
end
function table.copy(t)
	if t == nil then return {} end
	local result = {}
	for k,v in pairs(t) do
		result[k] = v
	end
	return result
end
function table.max(t, table_type)
	local values = {}
	for k,v in pairs(t) do
		if type(v) == "number" or type(v) == "table" then
			table.insert(values, v)
		end
	end
	local function compare(a, b)
		local a_weight = type(a) == "table" and table.length(a) or a
		local b_weight = type(b) == "table" and table.length(b) or b
		return a_weight < b_weight
	end
	table.sort(values, compare)
	if table_type then
		local max_elements = {}
		local max_weight = type(values[#values]) == "table" and table.length(values[#values]) or values[#values]
		for _, el in pairs(values) do
			local el_weight = type(el) == "table" and table.length(el) or el
			if max_weight == el_weight then
				table.insert(max_elements, el)
			end
		end
		return max_elements
	else
		return values[#values]
	end
end
function table.min(t, table_type)
	local values = {}
	for k, v in pairs(t) do
		if type(v) == "number" or type(v) == "table" then
			table.insert(values, v)
		end
	end
	local function compare(a, b)
		local a_weight = type(a) == "table" and table.length(a) or a
		local b_weight = type(b) == "table" and table.length(b) or b
		return a_weight < b_weight
	end
	table.sort(values, compare)
	if table_type then
		local min_elements = {}
		local max_weight = type(values[1]) == "table" and table.length(values[1]) or values[1]
		for _, el in pairs(values) do
			local el_weight = type(el) == "table" and table.length(el) or el
			if max_weight == el_weight then
				table.insert(min_elements, el)
			end
		end
		return min_elements
	else
		return values[1]
	end
end
function table.maxkv(t, byKey)
	return table.sortkv(t, function(a, b)
		local a_weight = type(byKey and a[1] or a[2]) == "table" and table.length(byKey and a[1] or a[2]) or (byKey and a[1] or a[2])
		local b_weight = type(byKey and b[1] or b[2]) == "table" and table.length(byKey and b[1] or b[2]) or (byKey and b[1] or b[2])
		return a_weight > b_weight
	end)[1]
end
function table.minkv(t, byKey)
	return table.sortkv(t, function(a, b)
		local a_weight = type(byKey and a[1] or a[2]) == "table" and table.length(byKey and a[1] or a[2]) or (byKey and a[1] or a[2])
		local b_weight = type(byKey and b[1] or b[2]) == "table" and table.length(byKey and b[1] or b[2]) or (byKey and b[1] or b[2])
		return a_weight < b_weight
	end)[1]
end
function table.sortkv(t, compareOrDesc)
	local values = {}
	for k, v in pairs(t) do
		if type(v) == "number" or type(v) == "table" then
			table.insert(values, {k, v})
		end
	end
	table.sort(values, type(compareOrDesc) == "function" and compareOrDesc or function(a, b)
		local a_weight = type(a[2]) == "table" and table.length(a[2]) or a[2]
		local b_weight = type(b[2]) == "table" and table.length(b[2]) or b[2]
		return not compareOrDesc and (a_weight < b_weight) or (a_weight > b_weight)
	end)
	return values
end
function table.keys(t)
	local keys = {}
	for k,v in pairs(t) do
		table.insert(keys, k)
	end
	return keys
end
function table.values(t)
	local values = {}
	for k,v in pairs(t) do
		table.insert(values, v)
	end
	return values
end
function table.reverse(t)
	local reversed = {}
	for k,v in pairs(t) do
		reversed[v] = k
	end
	return reversed
end
function table.join(t, sep)
	return table.concat(t, sep)
end
function table.sum(t)
	local sum = 0
	for _, i in pairs(t) do
		if type(i) == "number" then
			sum = sum + i
		end
	end
	return sum
end
function table.mean(t)
	return table.length(t) > 0 and table.sum(t)/table.length(t) or 0
end
function table.nearest(t, num)
	local values = table.filter(table.values(t), function(_, v) return type(v) == "number" end)
	table.sort(values, function(a, b)
		return math.abs(num-a) < math.abs(num-b)
	end)
	return values[1]
end
function table.duplicates(t, el)
	local tt = table.copy(t)
	local newtable = table.copy(t)
	local copies = {}
	for k, v in pairs(tt) do
		if table.contains(newtable, v) and not table.contains(copies, v) then
			table.insert(copies, v)
		end
		if el and v == el then
			table.insert(newtable, v)
		end
	end
	return copies
end
function table.merge(t1, t2)
	local t = table.copy(t1)
	if type(t2) == "table" then
		for k, v in pairs(t2) do
			t[k] = v
		end
	end
	return t
end
function table.combine(t1, t2)
	local t = table.copy(t1)
	for k, v in pairs(t2) do
		table.insert(t, v)
	end
	return t
end
function table.filter(t, fc)
	local tt = {}
	for k,v in pairs(t) do
		if pcall(fc, k, v) == true and fc(k, v) == true then
			tt[k] = v
		end
	end
	return tt
end
function table.map(t, fc)
	local tt = {}
	for k,v in pairs(t) do
		if pcall(fc, k, v) == true then
			tt[k] = fc(k, v)
		end
	end
	return tt
end
function table.choice(t)
	return table.length(t) > 0 and table.values(t)[RandomInt(1, table.length(t))] or nil
end
function table.removekey(t, key)
	local element = t[key]
	t[key] = nil
	return element
end
function table.removeElement(t, el)
	local pos = table.find(t, el)
	table.remove(t, pos)
	return pos
end
function table.open(t)
	local tt = {}
	for k, v in pairs(t) do
		for n, d in pairs(v) do
			table.insert(tt, d)
		end
	end
	return tt
end
function table.shuffle(t)
	local tt = table.values(t)
	table.sort(tt, function(a, b) return RandomFloat(0, 1) > RandomFloat(0, 1) end)
	return tt
end
function table.compare(t1, t2, notArray)
	local t3 = {added={}, removed={}, edited={}}
	local function search(t, tt, el)
		if (not notArray or notArray == nil) then return table.find(tt, el) end
		return tt[table.find(t, el)]
	end
	for k, v in pairs(t1) do
		local t2el = search(t1, t2, v)
		if t2el == nil and t2[k] == nil and v ~= nil or ((not notArray or notArray == nil) and t2[t2el] ~= v) then
			table.insert(t3["removed"], {index=k, value=v})
		elseif notArray and v ~= t2el and not table.contains(t3["edited"], {index=k, old_value=v, new_value=t2el}) then
			table.insert(t3["edited"], {index=k, old_value=v, new_value=t2el})
		end
	end
	for k, v in pairs(t2) do
		local t1el = search(t2, t1, v)
		if t1el == nil and t1[k] == nil and v ~= nil or ((not notArray or notArray == nil) and t1[t1el] ~= v) then
			table.insert(t3["added"], {index=k, value=v})
		elseif notArray and v ~= t1el and not table.contains(t3["edited"], {index=k, old_value=t1el, new_value=v}) then
			table.insert(t3["edited"], {index=k, old_value=t1el, new_value=v})
		end
	end
	return t3
end
function table.equals(t1, t2, ignore_mt)
	local ty1 = type(t1)
	local ty2 = type(t2)
	if ty1 ~= ty2 then return false end
	if ty1 ~= 'table' and ty2 ~= 'table' then return t1 == t2 end
	local mt = getmetatable(t1)
	if not ignore_mt and mt and mt.__eq then return t1 == t2 end
	for k1,v1 in pairs(t1) do
		local v2 = t2[k1]
		if v2 == nil or not table.equals(v1,v2) then return false end
	end
	for k2,v2 in pairs(t2) do
		local v1 = t1[k2]
		if v1 == nil or not table.equals(v1,v2) then return false end
	end
	return true
end
function table.count(t, el)
	local n = 0
	for k, v in pairs(t) do
		if v == el then
			n = n + 1
		end
	end
	return n
end
function table.select(t, count, unique)
	local tt = table.copy(t)
	local els = {}
	while (#tt > 0) and (#els < count) do
		local el = table.remove(tt, table.choice(table.keys(tt)))
		if not unique or not table.contains(els, el) then
			table.insert(els, el)
		end
	end
	return els
end
function table.unique(t)
	local tt = {}
	for k, v in pairs(t) do
		if not table.contains(tt, v) then
			table.insert(tt, v)
		end
	end
	return tt
end

-- abilities
local DOTABaseAbility = IsServer() and CDOTABaseAbility or C_DOTABaseAbility
function HasSpecialValue(abilityname, key)
	local kv = GetAbilityKeyValuesByName(abilityname)
	if kv["AbilityValues"] ~= nil then
		return kv["AbilityValues"][key] ~= nil
	elseif kv["AbilitySpecial"] ~= nil then
		for num, info in pairs(kv["AbilitySpecial"]) do
			if info[key] ~= nil then
				return true
			end
		end
	end
	return false
end
function DOTABaseAbility:HasSpecialValue(key)
	return HasSpecialValue(self:GetAbilityName(), key)
end
function GetSpecialValueFor(abilityname, key, lvl)
	local kv = GetAbilityKeyValuesByName(abilityname)
	if kv["AbilityValues"] ~= nil then
		if kv["AbilityValues"][key] ~= nil then
			values = string.split(kv["AbilityValues"][key], " ")
			return tonumber(values[lvl ~= nil and math.min(lvl, #values) or (kv["ItemBaseLevel"] ~= nil and math.min(kv["ItemBaseLevel"], #values) or #values)])
		end
	elseif kv["AbilitySpecial"] ~= nil then
		for num, info in pairs(kv["AbilitySpecial"]) do
			if info[key] ~= nil then
				values = string.split(info[key], " ")
				return tonumber(values[lvl ~= nil and math.min(lvl, #values) or (kv["ItemBaseLevel"] ~= nil and math.min(kv["ItemBaseLevel"], #values) or #values)])
			end
		end
	end
	return 0
end
function DOTABaseAbility:IsBehavior(behavior)
	return bit.band(self:GetBehaviorNum(), behavior) == behavior
end
function DOTABaseAbility:GetBehaviorNum(behavior)
	return tonumber(tostring(self:GetBehavior()))
end
function DOTABaseAbility:GetMainBehavior(priority)
	for _, behavior in pairs(priority or {DOTA_ABILITY_BEHAVIOR_UNIT_TARGET, DOTA_ABILITY_BEHAVIOR_POINT, DOTA_ABILITY_BEHAVIOR_TOGGLE, DOTA_ABILITY_BEHAVIOR_NO_TARGET, DOTA_ABILITY_BEHAVIOR_PASSIVE}) do
		if self:IsBehavior(behavior) then return behavior end
	end
end
function DOTABaseAbility:IsCastableWhileTaunted()
	return self:GetAbilityName() == "legion_commander_overwhelming_odds" and self:GetCaster():HasModifier("modifier_legion_commander_duel")
end
function DOTABaseAbility:FindTalentValue(talent_name, key)
	key = key or "value"
	local kv = self:GetAbilityKeyValues()
	local val = 0
	if kv["AbilityValues"] ~= nil then
		for name, value in pairs(kv["AbilityValues"]) do
			if type(value) == "table" then
				if value["LinkedSpecialBonus"] ~= nil and value["LinkedSpecialBonus"] == talent_name then
					local operations = {
						SPECIAL_BONUS_SUBTRACT = "minus",
						SPECIAL_BONUS_MULTIPLY = "multiply",
						SPECIAL_BONUS_PERCENTAGE_ADD = "percent",
					}
					local operation = "plus"
					if value["LinkedSpecialBonusOperation"] ~= nil then
						operation = operations[value["LinkedSpecialBonusOperation"]]
					end
					local talent_value = self:GetCaster():FindTalentValue(value["LinkedSpecialBonus"], value["LinkedSpecialBonusField"])
					if operation == "plus" then
						val = val + talent_value
					elseif operation == "minus" then
						val = val - talent_value
					elseif operation == "multiply" then
						val = val * talent_value
					elseif operation == "percent" then
						val = val + val * talent_value / 100
					end
					return val
				end
			end
		end
	end
	return self:GetCaster():FindTalentValue(talent_name, key)
end
function DOTABaseAbility:GetTalentValueFor(value)
	local kv = self:GetAbilityKeyValues()
	local val = self:GetSpecialValueFor(value)
	if kv["AbilityValues"] ~= nil then
		if kv["AbilityValues"][value] ~= nil and type(kv["AbilityValues"][value]) == "table" then
			if kv["AbilityValues"][value]["LinkedSpecialBonus"] ~= nil then
				local operations = {
					SPECIAL_BONUS_SUBTRACT = "minus",
					SPECIAL_BONUS_MULTIPLY = "multiply",
					SPECIAL_BONUS_PERCENTAGE_ADD = "percent",
				}
				local operation = "plus"
				if kv["AbilityValues"][value]["LinkedSpecialBonusOperation"] ~= nil then
					operation = operations[kv["AbilityValues"][value]["LinkedSpecialBonusOperation"]]
				end
				local talent_value = self:GetCaster():FindTalentValue(kv["AbilityValues"][value]["LinkedSpecialBonus"], kv["AbilityValues"][value]["LinkedSpecialBonusField"])
				if operation == "plus" then
					val = val + talent_value
				elseif operation == "minus" then
					val = val - talent_value
				elseif operation == "multiply" then
					val = val * talent_value
				elseif operation == "percent" then
					val = val + val * talent_value / 100
				end
				return val
			end
		end
	elseif kv["AbilitySpecial"] ~= nil then
		for num, info in pairs(kv["AbilitySpecial"]) do
			if info[value] ~= nil then
				local operations = {
					SPECIAL_BONUS_SUBTRACT = "minus",
					SPECIAL_BONUS_MULTIPLY = "multiply",
					SPECIAL_BONUS_PERCENTAGE_ADD = "percent",
				}
				local operation = "plus"
				if info["LinkedSpecialBonusOperation"] ~= nil then
					operation = operations[info["LinkedSpecialBonusOperation"]]
				end
				local talent_value = self:GetCaster():FindTalentValue(info["LinkedSpecialBonus"], info["LinkedSpecialBonusField"])
				if operation == "plus" then
					val = val + talent_value
				elseif operation == "minus" then
					val = val - talent_value
				elseif operation == "multiply" then
					val = val * talent_value
				elseif operation == "percent" then
					val = val + val * talent_value / 100
				end
				return val
			end
		end
	end
	return val
end
function OrderToBehavior(order)
	if order == DOTA_UNIT_ORDER_CAST_NO_TARGET then return DOTA_ABILITY_BEHAVIOR_NO_TARGET
	elseif order == DOTA_UNIT_ORDER_CAST_TARGET then return DOTA_ABILITY_BEHAVIOR_UNIT_TARGET
	elseif order == DOTA_UNIT_ORDER_CAST_POSITION then return DOTA_ABILITY_BEHAVIOR_POINT end
end
function BehaviorToOrder(behavior)
	if behavior == DOTA_ABILITY_BEHAVIOR_NO_TARGET then return DOTA_UNIT_ORDER_CAST_NO_TARGET
	elseif behavior == DOTA_ABILITY_BEHAVIOR_UNIT_TARGET then return DOTA_UNIT_ORDER_CAST_TARGET
	elseif behavior == DOTA_ABILITY_BEHAVIOR_POINT then return DOTA_UNIT_ORDER_CAST_POSITION end
end
function IsCastOrder(order)
	return order >= DOTA_UNIT_ORDER_CAST_POSITION and order <= DOTA_UNIT_ORDER_CAST_TOGGLE
end
if IsClient() then
	function C_DOTABaseAbility:GetAbilityKeyValues()
		return GetAbilityKeyValuesByName(self:GetAbilityName())
	end
	function C_DOTABaseAbility:GetAbilityTargetFlags()
		local kv = self:GetAbilityKeyValues()["AbilityUnitTargetFlags"]
		if kv == nil then return DOTA_UNIT_TARGET_FLAG_NONE end
		return table.sum(table.map(string.split(kv, " | "), function(_, flag) return _G[flag] end))
	end
	function C_DOTABaseAbility:GetAbilityTargetTeam()
		local kv = self:GetAbilityKeyValues()["AbilityUnitTargetTeam"]
		if kv == nil then return DOTA_UNIT_TARGET_TEAM_NONE end
		return table.sum(table.map(string.split(kv, " | "), function(_, team) return _G[team] end))
	end
	function C_DOTABaseAbility:GetAbilityTargetType()
		local kv = self:GetAbilityKeyValues()["AbilityUnitTargetType"]
		if kv == nil then return DOTA_UNIT_TARGET_NONE end
		return table.sum(table.map(string.split(kv, " | "), function(_, unit_type) return _G[unit_type] end))
	end
	function C_DOTABaseAbility:GetAbilityType()
		local kv = self:GetAbilityKeyValues()["AbilityType"]
		return kv ~= nil and _G[kv] or ABILITY_TYPE_BASIC
	end
	function C_DOTABaseAbility:GetMaxLevel()
		local kv = self:GetAbilityKeyValues()["MaxLevel"]
		local maxlevels = {
			[ABILITY_TYPE_BASIC] = 4,
			[ABILITY_TYPE_ULTIMATE] = 3,
			[ABILITY_TYPE_ATTRIBUTES] = 1,
			[ABILITY_TYPE_HIDDEN] = 4,
		}
		return kv or maxlevels[self:GetAbilityType()]
	end
	function C_DOTABaseAbility:GetCooldown(level)
		return self:GetLevelSpecialValueFor("AbilityCooldown", level-1)
	end
end

-- units
local BaseEntity = IsServer() and CBaseEntity or C_BaseEntity
function BaseEntity:IsOutpost()
	return self:GetClassname() == "npc_dota_watch_tower"
end
function BaseEntity:IsPool()
	return self:GetClassname() == "npc_dota_mango_tree"
end
function BaseEntity:HasShard()
	return self:HasModifier("modifier_item_aghanims_shard")
end

local DOTABaseNPC = IsServer() and CDOTA_BaseNPC or C_DOTA_BaseNPC
function DOTABaseNPC:HasTalent(talentName)
	if self:FindAbilityByName(talentName) ~= nil then
		if self:FindAbilityByName(talentName):GetLevel() > 0 then return true end
	end
	return false
end
function DOTABaseNPC:FindTalentValue(talentName, key)
	if self:FindAbilityByName(talentName) ~= nil then
		return self:FindAbilityByName(talentName):GetSpecialValueFor(key or "value")
	end
	return 0
end
function DOTABaseNPC:IsWraith()
	return self:HasModifier("modifier_skeleton_king_reincarnation_scepter_active")
end
function DOTABaseNPC:GetIllusionBounty()
	return self:GetLevel() * 2
end
function DOTABaseNPC:IsRoshan()
	return table.contains({"npc_dota_roshan", "npc_dota_roshan_halloween", "npc_dota_roshan_halloween_minion", "npc_dota_mutation_pocket_roshan"}, self:GetUnitName())
end
function DOTABaseNPC:IsFountain()
	return self:GetClassname() == "ent_dota_fountain"
end
function DOTABaseNPC:IsSiegeCreep()
	return self:GetClassname() == "npc_dota_creep_siege"
end
function DOTABaseNPC:IsTechiesMine()
	return table.contains({"npc_dota_techies_remote_mine_lua", "npc_dota_techies_stasis_trap_lua", "npc_dota_techies_land_mine_lua", "npc_dota_techies_land_mine"}, self:GetUnitName())
end
if not inited then
	DOTABaseNPC.IsBoss = function(self)
		return self:GetUnitLabel() == "boss"
	end
	local valve_isinvulnerable = DOTABaseNPC.IsInvulnerable
	DOTABaseNPC.IsInvulnerable = function(self, unit)
		return valve_isinvulnerable(self) or (IsValidEntity(unit) and (unit:GetTeamNumber() == self:GetTeamNumber() and self:HasModifier("modifier_fake_invulnerable")) or self:HasModifier("modifier_fake_invulnerable"))
	end
	local valve_isshrine = DOTABaseNPC.IsShrine
	DOTABaseNPC.IsShrine = function(self)
		return valve_isshrine(self) or self:GetUnitName() == "npc_dota_shrine"
	end
end
if IsClient() then
	function C_DOTA_BaseNPC:GetBaseAttackRange()
		return GetUnitKeyValuesByName(self:GetUnitName())["AttackRange"] or 0
	end
end

-- global
function GetStringTeam(team)
	local teams = {[DOTA_TEAM_GOODGUYS] = "radiant", [DOTA_TEAM_BADGUYS] = "bad"}
	return teams[team]
end
function GetPlayerID(userID)
	return UserIDToControllerHScript(userID):GetPlayerID()
end
function GetUserID(playerID)
	local t = CustomNetTables:GetTableValue("player_info", "UserIDs") or {}
	return t[tostring(playerID)]
end