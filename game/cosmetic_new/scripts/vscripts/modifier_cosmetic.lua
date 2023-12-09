modifier_cosmetic_lua = modifier_cosmetic_lua or class(modifier_cosmetic_base_lua)
function modifier_cosmetic_lua:OnCreated(kv)
	if not IsServer() then return end
	self.hEntity = CreateUnitByName("npc_dota_base_additive", self:GetParent():GetAbsOrigin(), false, nil, nil, self:GetParent():GetTeamNumber())
	self.hEntity:FollowEntity(self:GetParent(), true)
	self.hEntityModifier = self.hEntity:AddNewModifier(self:GetParent(), nil, "modifier_cosmetic_wearable_lua", kv)
	self.style = kv.style
	self.kv = kv
	self.unit_models = {}
end
function modifier_cosmetic_lua:OnRefresh(kv)
	if not IsServer() then return end
	self.hEntityModifier:OnRefresh(kv)
	self.hEntityModifier:ForceRefresh()
	self.style = kv.style or self.style
	self.kv = kv
	self:ResetVisuals()
end
function modifier_cosmetic_lua:CopyTo(hero)
	hero:AddNewModifier(hero, nil, self:GetName(), self.kv)
end
function modifier_cosmetic_lua:ReadVisuals(visuals)
	if visuals["styles"] ~= nil and visuals["styles"][self.style] then
		visuals = table.merge(visuals, visuals["styles"][self.style])
	end
	for _, asset in pairs(visuals) do
		if type(asset) == "table" then
			if asset["style"] == nil or asset["style"] == self.style then
				if asset["type"] == "entity_model" then
					if asset["asset"] == nil or self:GetParent():GetUnitName() == asset["asset"] then
						self.model = asset["modifier"]
					elseif asset["asset"] ~= nil then
						self.unit_models["asset"] = asset["modifier"]
					end
				elseif asset["type"] == "model_skin" then
					self.model_skin = asset["skin"]
				elseif asset["type"] == "healthbar_offset" then
					self.healthbar_offset = asset["offset"]
				end
			end
		end
	end
	self.hEntityModifier:ReadVisuals(visuals)
	self.hEntityModifier:ApplyVisuals()
end
function modifier_cosmetic_lua:OnDestroy()
	if not IsServer() then return end
	self.hEntityModifier:Destroy()
	self:ResetVisuals()
	self:ApplyVisuals()
end