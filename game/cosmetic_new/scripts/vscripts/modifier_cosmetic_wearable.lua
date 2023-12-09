ATTACH_TYPES = {
	["absorigin"] = PATTACH_ABSORIGIN,
	["absorigin_follow"] = PATTACH_ABSORIGIN_FOLLOW,
	["customorigin"] = PATTACH_CUSTOMORIGIN,
	["customorigin_follow"] = PATTACH_CUSTOMORIGIN_FOLLOW,
	["EYES_FOLLOW"] = PATTACH_EYES_FOLLOW,
	["point_follow"] = PATTACH_POINT_FOLLOW,
	["renderorigin_follow"] = PATTACH_RENDERORIGIN_FOLLOW,
	["worldorigin"] = PATTACH_WORLDORIGIN,
	["CENTER_FOLLOW"] = PATTACH_CENTER_FOLLOW,
	["CUSTOM_GAME_STATE_1"] = PATTACH_CUSTOM_GAME_STATE_1,
	["MAIN_VIEW"] = PATTACH_MAIN_VIEW,
	["OVERHEAD_FOLLOW"] = PATTACH_OVERHEAD_FOLLOW,
	["POINT"] = PATTACH_POINT,
	["ROOTBONE_FOLLOW"] = PATTACH_ROOTBONE_FOLLOW,
	["WATERWAKE"] = PATTACH_WATERWAKE,
}

modifier_cosmetic_wearable_lua = modifier_cosmetic_wearable_lua or class(modifier_cosmetic_base_lua)
function modifier_cosmetic_wearable_lua:GetAttributes() return MODIFIER_ATTRIBUTE_PERMANENT end
function modifier_cosmetic_wearable_lua:CheckState()
	local states = {[MODIFIER_STATE_INVULNERABLE] = true, [MODIFIER_STATE_NO_HEALTH_BAR] = true, [MODIFIER_STATE_OUT_OF_GAME] = true, [MODIFIER_STATE_MAGIC_IMMUNE] = true, [MODIFIER_STATE_NO_UNIT_COLLISION] = true, [MODIFIER_STATE_NOT_ON_MINIMAP] = true, [MODIFIER_STATE_UNSELECTABLE] = true}
	if self:GetCaster():IsInvisible() then
		states[MODIFIER_STATE_INVISIBLE] = true
	end
	if IsServer() then
		if self:HasModifierState(MODIFIER_STATE_TRUESIGHT_IMMUNE) then
			states[MODIFIER_STATE_TRUESIGHT_IMMUNE] = true
		end
	end
	return states
end
function modifier_cosmetic_wearable_lua:DeclareFunctions() return {MODIFIER_EVENT_ON_DEATH, MODIFIER_EVENT_ON_RESPAWN, MODIFIER_PROPERTY_INVISIBILITY_LEVEL} end
function modifier_cosmetic_wearable_lua:OnCreated(kv)
	self:OnRefresh(kv)
	if not IsServer() then return end
	self:StartIntervalThink(0.1)
end
function modifier_cosmetic_wearable_lua:OnRefresh(kv)
	if not IsServer() then return end
	self:GetParent():SetModel(kv["model"])
	self:GetParent():SetOriginalModel(kv["model"])
	self.particles = self.particles or {}
	self.style = kv.style or self.style
	self:ClearVisuals()
	if self:GetCaster():IsIllusion() then
		self:GetParent():AddNewModifier(self:GetParent(), nil, "modifier_illusion", {})
	else
		self:GetParent():RemoveModifierByName("modifier_illusion")
	end
end
function modifier_cosmetic_wearable_lua:ReadVisuals(visuals)
	for k, asset in pairs(visuals) do
		if type(asset) == "table" then
			if (asset["style"] == nil or self.style == -1) or asset["style"] == self.style then
				if asset["type"] == "particle_create" then
					local fx = ParticleManager:CreateParticle(asset["modifier"], asset["attachments"] ~= nil and ATTACH_TYPES[asset["attachments"]["attach_type"]] or PATTACH_ABSORIGIN_FOLLOW, self:GetParent())
					if asset["attachments"] ~= nil and asset["attachments"]["control_points"] ~= nil then
						for _, cp_info in pairs(asset["attachments"]["control_points"]) do
							ParticleManager:SetParticleControlEnt(fx, cp_info["control_point_index"], self:GetParent(), ATTACH_TYPES[cp_info["attach_type"]], cp_info["attachment"] or "attach_hitloc", self:GetParent():GetAbsOrigin(), true)
						end
					end
					if Cosmetic.particles_json[asset["modifier"]] ~= nil then
						for cp, cp_info in pairs(Cosmetic.particles_json[asset["modifier"]]) do
							ParticleManager:SetParticleControlEnt(fx, tonumber(cp), self:GetParent(), _G[cp_info["attach"]], cp_info["name"] or "attach_hitloc", self:GetParent():GetAbsOrigin(), true)
						end
					end
					self.particles[asset["modifier"]] = fx
				end
			end
		else
			if k == "skin" then
				self:GetParent():SetSkin(asset)
			elseif k == "model_player" then
				self:GetParent():SetModel(asset)
				self:GetParent():SetOriginalModel(asset)
			end
		end
	end
end
function modifier_cosmetic_wearable_lua:OnIntervalThink()
	for _, mod in pairs(self:GetCaster():FindAllModifiersByName("modifier_truesight")) do
		if mod.link == nil then
			mod:LinkModifier(self:GetParent():AddNewModifier(mod:GetCaster(), mod:GetAbility(), "modifier_truesight", {}), {})
		end
	end
end
function modifier_cosmetic_wearable_lua:ClearVisuals()
	if self.style == -1 then
		self:GetParent():SetSkin(0)
	end
	for _, fx in pairs(self.particles) do
		ParticleManager:DestroyParticle(fx, true)
		ParticleManager:ReleaseParticleIndex(fx)
	end
end
function modifier_cosmetic_wearable_lua:OnDestroy()
	if not IsServer() then return end
	self:ClearVisuals()
	UTIL_Remove(self:GetParent())
	UTIL_Remove(self)
end
function modifier_cosmetic_wearable_lua:OnDeath(kv)
	if not IsServer() then return end
	if kv.unit ~= self:GetCaster() then return end
	self:GetParent():AddNoDraw()
end
function modifier_cosmetic_wearable_lua:OnRespawn(kv)
	if not IsServer() then return end
	if kv.unit ~= self:GetCaster() then return end
	self:GetParent():RemoveNoDraw()
end
function modifier_cosmetic_wearable_lua:GetModifierInvisibilityLevel() return BoolToNum(self:GetParent():IsInvisible()) end