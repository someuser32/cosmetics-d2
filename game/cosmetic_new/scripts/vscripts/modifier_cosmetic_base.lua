modifier_cosmetic_base_lua = modifier_cosmetic_base_lua or class({})
function modifier_cosmetic_base_lua:IsHidden() return true end
function modifier_cosmetic_base_lua:IsPurgable() return false end
function modifier_cosmetic_base_lua:RemoveOnDeath() return false end
function modifier_cosmetic_base_lua:GetAttributes() return MODIFIER_ATTRIBUTE_MULTIPLE + MODIFIER_ATTRIBUTE_PERMANENT end
function modifier_cosmetic_base_lua:OnCreated(kv)
	if not IsServer() then return end
	self.style = kv.style
end
function modifier_cosmetic_base_lua:OnRefresh(kv)
	if not IsServer() then return end
	self.style = kv.style or self.style
	self:ResetVisuals()
end
function modifier_cosmetic_base_lua:ReadVisuals(visuals)
end
function modifier_cosmetic_base_lua:ApplyVisuals()
	local model_skin, model_skin_source = unpack(self:GetSharedValue("model_skin"))
	local healthbar_offset, healthbar_offset_source = unpack(self:GetSharedValue("model_skin"))
	local model, model_source = unpack(self:GetSharedValue("model"))
	self:GetParent():SetSkin(model_skin or 0)
	self:GetParent():SetHealthBarOffsetOverride(healthbar_offset or self:GetParent():GetBaseHealthBarOffset())
	if model then
		self:GetParent():AddNewModifier(self:GetParent(), nil, "modifier_cosmetic_model_lua", {model=model})
		if model_source.style then
			self:GetParent():SetMaterialGroup(tostring(model_source.style))
		end
	else
		self:GetParent():RemoveModifierByName("modifier_cosmetic_model_lua")
		self:SetMaterialGroup("default")
	end
end
function modifier_cosmetic_base_lua:ResetVisuals()
	self.model = nil
	self.skin = nil
	self.healthbar_offset = nil
	self.unit_models = {}
end
function modifier_cosmetic_base_lua:OnDestroy()
	if not IsServer() then return end
	self:ResetVisuals()
	self:ApplyVisuals()
end
function modifier_cosmetic_base_lua:GetSharedValue(value, ignore_self)
	local mods = self:GetParent():FindAllModifiersByName(self:GetName())
	table.sort(mods, function(a, b)
		return a:GetPriority() < b:GetPriority() or a:GetCreationTime() > b:GetCreationTime()
	end)
	for _, mod in pairs(mods) do
		if not mod:IsNull() and mod[value] ~= nil and (not ignore_self or mod ~= self) then
			return {mod[value], mod}
		end
	end
	return {}
end