require("kvparser/kvparser")

Cosmetic = Cosmetic or class({})

Cosmetic.slots = Cosmetic.slots or {}
Cosmetic.items_game = Cosmetic.items_game
Cosmetic.items = Cosmetic.items or {}
Cosmetic.hero_items = Cosmetic.hero_items or {}
Cosmetic.model_to_ids = Cosmetic.model_to_ids or {}

Cosmetic.equipped_items = Cosmetic.equipped_items or {}

local ITEMS_GAME_URL = "https://raw.githubusercontent.com/spirit-bear-productions/dota_vpk_updates/main/scripts/items/items_game.txt"
local PARTICLES_JSON_URL = "https://pastebin.com/raw/3URRriEz"

function Cosmetic:InitOnce()
	CustomGameEventManager:RegisterListener("cosmetic_request_items", Dynamic_Wrap(Cosmetic, "RequestItems"))
	CustomGameEventManager:RegisterListener("cosmetic_request_equipped_items", Dynamic_Wrap(Cosmetic, "RequestEquippedItems"))
	CustomGameEventManager:RegisterListener("cosmetic_equip_item", Dynamic_Wrap(Cosmetic, "EquipItem"))
	ListenToGameEvent("npc_spawned", Dynamic_Wrap(Cosmetic, "OnNPCSpawned"), Cosmetic)
end

function Cosmetic:Init()
end

function Cosmetic:PostInit()
	Cosmetic:InitSlots()
	Cosmetic:InitItems()
	Cosmetic:InitParticles()
end

function Cosmetic:InitSlots()
	for heroname, heroinfo in pairs(LoadKeyValues("scripts/npc/npc_heroes.txt")) do
		if type(heroinfo) == "table" and heroinfo["ItemSlots"] ~= nil then
			local slots = {}
			for _, slot_info in pairs(heroinfo["ItemSlots"]) do
				slots[slot_info["SlotName"]] = {
					index = slot_info["SlotIndex"],
					text = slot_info["SlotText"],
					visible = slot_info["DisplayInLoadout"] or 1,
				}
			end
			Cosmetic.slots[heroname] = {
				slots = slots,
				model_scale = math.round(heroinfo["ModelScale"] or 1, 3),
			}
			CustomNetTables:SetTableValue("cosmetic", "slots_"..heroname, Cosmetic.slots[heroname])
		end
	end
end

function Cosmetic:InitItems()
	if Cosmetic.items_game ~= nil then
		-- return Cosmetic:HandleItems(Cosmetic.items_game)
		return
	end

	local r = CreateHTTPRequestScriptVM("GET", ITEMS_GAME_URL)

	Cosmetic.items_game = KVParser:LoadKeyValueFromString(require("items_game"), KVParser.MODE_UNIQUE)
	Cosmetic:HandleItems(Cosmetic.items_game)

	r:Send(function(req)
		if req.StatusCode == 200 then
			Cosmetic.items_game = KVParser:LoadKeyValueFromString(req.Body, KVParser.MODE_UNIQUE)
			Cosmetic:HandleItems(Cosmetic.items_game)
		end
	end)
end

function Cosmetic:InitParticles()
	if Cosmetic.particles_json ~= nil then
		return
	end

	Cosmetic.particles_json = {}

	-- local r = CreateHTTPRequestScriptVM("GET", PARTICLES_JSON_URL)

	-- r:Send(function(req)
	-- 	print("request got")
	-- 	if req.StatusCode == 200 then
	-- 		Cosmetic.particles_json = json.decode(req.Body)
	-- 	end
	-- end)
end

function Cosmetic:HandleItems(items)
	local attach_ids = {}
	for id, attach in pairs(Cosmetic.items_game["items_game"]["attribute_controlled_attached_particles"]) do
		attach_ids[attach["system"]] = id
	end

	local item_ids = {}
	local bundles = {}
	for item_id, item_info in pairs(Cosmetic.items_game["items_game"]["items"]) do
		if tonumber(item_id) ~= nil and item_info["prefab"] ~= nil and table.contains({"default_item", "wearable", "bundle"}, item_info["prefab"]) then
			local item = table.merge(Cosmetic.items_game["items_game"]["prefabs"][item_info["prefab"]], item_info)
			if type(item["used_by_heroes"]) == "table" then
				local item_name = item["item_name"] or item["name"] or "unknown"
				local item_slot = item["item_slot"] or "weapon"
				local item_icon = item["image_inventory"] or ""
				local item_heroes = table.keys(item["used_by_heroes"])
				local item_rarity = item["item_rarity"] or "common"
				if item["prefab"] == "bundle" then
					local item_bundle = item["bundle"] or {}
					Cosmetic.items[item_id] = {
						name = item_name,
						slot = item_slot,
						icon = item_icon,
						heroes = item_heroes,
						rarity = item_rarity,
						bundle = item_bundle,
						styles = 1,
						type = item["prefab"],
					}
					table.insert(bundles, item_id)
				else
					local item_model = item["model_player"] or ""
					local item_visuals = item["visuals"] or {}
					for _, asset in pairs(item_visuals) do
						if type(asset) == "table" then
							if table.contains({"particle", "particle_create"}, asset["type"]) then
								local attach_id = attach_ids[asset.modifier]
								if attach_id ~= nil then
									asset.attachments = Cosmetic.items_game["items_game"]["attribute_controlled_attached_particles"][attach_id]
								end
							end
						end
					end
					local item_styles = item_visuals["styles"] ~= nil and table.length(item_visuals["styles"]) or 1
					Cosmetic.items[item_id] = {
						name = item_name,
						slot = item_slot,
						icon = item_icon,
						heroes = item_heroes,
						rarity = item_rarity,
						model = item_model,
						visuals = item_visuals,
						styles = item_styles,
						type = item["prefab"] or "no_prefab",
					}
					item_ids[item["name"]] = item_id
					Cosmetic.model_to_ids[item_model] = item_id
				end
			end
		end
	end

	for _, bundle_id in pairs(bundles) do
		local bundle_info = Cosmetic.items[bundle_id]
		local styles = bundle_info["styles"]
		local bundle = {}
		for item_name, _ in pairs(bundle_info["bundle"]) do
			local item_id = item_ids[item_name]
			if item_id ~= nil then
				styles = math.max(styles, Cosmetic.items[item_id]["styles"])
				table.insert(bundle, item_id)
			end
		end
		Cosmetic.items[bundle_id]["styles"] = styles
		Cosmetic.items[bundle_id]["bundle"] = bundle
	end

	for item_id, item in pairs(Cosmetic.items) do
		for _, hero in pairs(item["heroes"]) do
			if Cosmetic.hero_items[hero] == nil then
				Cosmetic.hero_items[hero] = {}
			end
			if Cosmetic.hero_items[hero][item["slot"]] == nil then
				Cosmetic.hero_items[hero][item["slot"]] = {}
			end
			Cosmetic.hero_items[hero][item["slot"]][item_id] = item
		end
	end
end

function Cosmetic:GetEquippedItems(playerID)
	if Cosmetic.equipped_items[playerID] == nil then
		return {}
	end
	local hero = PlayerResource:GetSelectedHeroEntity(playerID)
	local heroname = IsValidEntity(hero) and hero:GetUnitName() or nil
	return Cosmetic.equipped_items[playerID][heroname] or {}
end

function Cosmetic:GetAvaiableItems(playerID)
	local hero = PlayerResource:GetSelectedHeroEntity(playerID)
	if not IsValidEntity(hero) then return {} end
	local heroname = hero:GetUnitName()
	local items = {}
	for slot, hero_items in pairs(Cosmetic.hero_items[heroname] or {}) do
		items[slot] = {}
		for item_id, item in pairs(hero_items) do
			items[slot][item_id] = table.merge({avaiable=1}, table.filter(item, function(key, value) return table.contains({"name", "slot", "icon", "rarity", "styles", "type"}, key) end))
		end
	end
	return items
end

function Cosmetic:RequestItems(data)
	local player = PlayerResource:GetPlayer(data.PlayerID)
	local items = Cosmetic:GetAvaiableItems(data.PlayerID)
	CustomGameEventManager:Send_ServerToPlayer(player, "cosmetic_request_items", {items=items})
end

function Cosmetic:RequestEquippedItems(data)
	local player = PlayerResource:GetPlayer(data.PlayerID)
	local items = Cosmetic:GetEquippedItems(data.PlayerID)
	CustomGameEventManager:Send_ServerToPlayer(player, "cosmetic_request_equipped_items", {items=items})
end

function Cosmetic:EquipItem(data)
	if data.item == nil then return end
	local item = Cosmetic.items[data.item]
	if item == nil then return end

	local hero = PlayerResource:GetSelectedHeroEntity(data.PlayerID)
	if not IsValidEntity(hero) then return end
	local heroname = hero:GetUnitName()

	if Cosmetic.equipped_items[data.PlayerID] == nil then
		Cosmetic.equipped_items[data.PlayerID] = {}
	end
	if Cosmetic.equipped_items[data.PlayerID][heroname] == nil then
		Cosmetic.equipped_items[data.PlayerID][heroname] = {}
	end

	if not Cosmetic:_EquipItem(data.PlayerID, data.item, data.style or 1, false) then return end
	Cosmetic.equipped_items[data.PlayerID][heroname][item["slot"]] = {item=data.item, style=data.style or -1}

	return Cosmetic:RequestEquippedItems({PlayerID=data.PlayerID})
end

function Cosmetic:_EquipItem(playerID, item_id, style, ignore_default_check)
	style = style - 1
	local item = Cosmetic.items[item_id]
	if item == nil then return false end
	local hero = PlayerResource:GetSelectedHeroEntity(playerID)
	if not IsValidEntity(hero) then return false end
	if hero.__cosmetic_slots == nil then
		hero.__cosmetic_slots = {}
	end
	local modifier_data = {item_id=item_id, model=item["model"], style=style, name=item["name"]}
	if hero.__cosmetic_slots[item["slot"]] ~= nil and not hero.__cosmetic_slots[item["slot"]]:IsNull() then
		local modifier = hero.__cosmetic_slots[item["slot"]]
		modifier:Destroy()
		-- modifier:OnRefresh(modifier_data)
		-- modifier:ForceRefresh()
		hero.__cosmetic_slots[item["slot"]] = hero:AddNewModifier(hero, nil, "modifier_cosmetic_lua", modifier_data)
	else
		hero.__cosmetic_slots[item["slot"]] = hero:AddNewModifier(hero, nil, "modifier_cosmetic_lua", modifier_data)
	end
	hero.__cosmetic_slots[item["slot"]]:ReadVisuals(item["visuals"])
	hero.__cosmetic_slots[item["slot"]]:ApplyVisuals()
	-- if not ignore_default_check then
	-- 	local default_equipped = item["type"] == "default_item"
	-- 	if default_equipped then
	-- 		for slot, data in pairs(Cosmetic.equipped_items[playerID][hero:GetUnitName()]) do
	-- 			local equipped_item = slot ~= item["slot"] and Cosmetic.items[data.item] or item
	-- 			if equipped_item then
	-- 				if equipped_item["type"] ~= "default_item" then
	-- 					default_equipped = false
	-- 				end
	-- 			end
	-- 		end
	-- 	end
	-- 	if default_equipped then
	-- 		Cosmetic:EquipDOTAItems(playerID)
	-- 	else
	-- 		Cosmetic:UnequipDOTAItems(playerID)
	-- 	end
	-- end
	return true
end

function Cosmetic:RemoveSlot(playerID, slot)
	local hero = PlayerResource:GetSelectedHeroEntity(playerID)
	if not IsValidEntity(hero) then return end
	if hero.__cosmetic_slots == nil or hero.__cosmetic_slots[slot] == nil then return end
	local modifier = hero.__cosmetic_slots[slot]
	if not modifier:IsNull() then
		modifier:Destroy()
	end
	hero.__cosmetic_slots[slot] = nil
end

function Cosmetic:DefaultSlot(playerID, slot, ignore_default_check)
	local hero = PlayerResource:GetSelectedHeroEntity(playerID)
	if not IsValidEntity(hero) then return end
	local hero_items = Cosmetic.hero_items[hero:GetUnitName()][slot]
	if hero_items ~= nil then
		for item_id, item in pairs(hero_items) do
			if item.type == "default_item" then
				return Cosmetic:_EquipItem(playerID, item_id, 1, ignore_default_check)
			end
		end
	end
	return Cosmetic:RemoveSlot(playerID, slot)
end

function Cosmetic:GetItemIDFromModel(model)
	return Cosmetic.model_to_ids[model]
end

function Cosmetic:GetDOTAWearableForSlot(hero, slot)
	for _, child in pairs(hero:GetChildren()) do
		if IsValidEntity(child) and child:GetClassname() == "dota_item_wearable" then
			local modelname = child:GetModelName()
			if modelname ~= "" then
				local item_id = Cosmetic:GetItemIDFromModel(modelname)
				local item = Cosmetic.items[item_id]
				if item then
					if item["slot"] == slot then
						return child
					end
				end
			end
		end
	end
end

function Cosmetic:UnequipDOTAItems(playerID)
	-- NOTE:
	-- for unknown reason, valve does not give us any way to remove their wearables
	-- neither of SetParent(nil, nil), SetModel("models/development/invisiblebox.vmdl"), AddEffects(EF_NODRAW), Destroy(), UTIL_Remove() works
	-- idk how to fix it without using kv DisableWearables 1
	-- if you know, PM me at steam

	-- local hero = PlayerResource:GetSelectedHeroEntity(playerID)
	-- if not IsValidEntity(hero) then return end
	-- hero.__cosmetic_dota_items = hero.__cosmetic_dota_items or {}
	-- for slot, hero_items in pairs(Cosmetic.hero_items[hero:GetUnitName()] or {}) do
	-- 	local wearable = Cosmetic:GetDOTAWearableForSlot(hero, slot)
	-- 	if wearable then
	-- 		hero.__cosmetic_dota_items[slot] = Cosmetic:GetItemIDFromModel(wearable:GetModelName())
	-- 		wearable:SetParent(nil, nil)
	-- 		wearable:SetModel("models/development/invisiblebox.vmdl")
	-- 		wearable:AddEffects(EF_NODRAW)
	-- 		wearable:Destroy()
	-- 		UTIL_Remove(wearable)
	-- 	end
	-- 	if hero.__cosmetic_slots[slot] == nil then
	-- 		Cosmetic:DefaultSlot(playerID, slot, true)
	-- 	end
	-- end
	-- for _, child in pairs(hero:GetChildren()) do
	-- 	print(child:GetClassname())
	-- 	if IsValidEntity(child) and child:GetClassname() == "dota_item_wearable" then
	-- 		local modelname = child:GetModelName()
	-- 		if modelname == "" then
	-- 			wearable:SetParent(nil, nil)
	-- 			child:SetModel("models/development/invisiblebox.vmdl")
	-- 			child:AddEffects(EF_NODRAW)
	-- 			child:Destroy()
	-- 			UTIL_Remove(child)
	-- 		end
	-- 	end
	-- end
end

function Cosmetic:EquipDOTAItems(playerID)
	local hero = PlayerResource:GetSelectedHeroEntity(playerID)
	if not IsValidEntity(hero) then return end
	if Cosmetic.equipped_items[playerID] ~= nil then
		Cosmetic.equipped_items[playerID][hero:GetUnitName()] = nil
	end
	-- for slot, mod in pairs(hero.__cosmetic_slots) do
	-- 	local equipped = false
	-- 	if hero.__cosmetic_dota_items ~= nil then
	-- 		local item_id = hero.__cosmetic_dota_items[slot]
	-- 		if item_id then
	-- 			Cosmetic:_EquipItem(playerID, item_id, 1, true)
	-- 			equipped = true
	-- 		end
	-- 	end
	-- 	if not equipped then
	-- 		Cosmetic:RemoveSlot(playerID, slot)
	-- 	end
	-- end
	print(hero:GetUnitName(), Cosmetic.slots[hero:GetUnitName()])
	for slot, slot_info in pairs(Cosmetic.slots[hero:GetUnitName()]["slots"]) do
		Cosmetic:DefaultSlot(playerID, slot)
	end
end

function Cosmetic:CopyWearables(hero)
	if not IsValidEntity(hero) then return end
	local original_hero = PlayerResource:GetSelectedHeroEntity(hero:GetPlayerOwnerID())
	if not IsValidEntity(original_hero) then return end
	for _, mod in pairs(original_hero:FindAllModifiersByName("modifier_cosmetic_lua")) do
		mod:CopyTo(hero)
	end
end

function Cosmetic:OnNPCSpawned(event)
	local npc = event["entindex"] ~= nil and EntIndexToHScript(event["entindex"]) or nil
	if not IsValidEntity(npc) then return end
	-- if npc.bFirstSpawn == nil then
		if npc:GetPlayerOwnerID() ~= nil then
			print("has player id")
			local original_hero = PlayerResource:GetSelectedHeroEntity(npc:GetPlayerOwnerID())
			if npc:IsHero() then
				print("is hero")
				Timers:CreateTimer({endTime=0.2, callback=function()
					print("delay")
					if not IsValidEntity(npc) or not IsValidEntity(original_hero) then return end
					print("valid npc")
					if npc:IsTrueHero() then
						print("true hero")
						Cosmetic:EquipDOTAItems(npc:GetPlayerOwnerID())
					elseif npc:GetUnitName() == original_hero:GetUnitName() then
						print("not true hero")
						Cosmetic:CopyWearables(npc)
					end
				end}, nil, self)
			end
		end
		npc.bFirstSpawn = false
	-- end
end

if GameRules.GetGameModeEntity ~= nil then
	Cosmetic:Init()
end

if CustomNetTables ~= nil then
	Cosmetic:PostInit()
end