modifier_cosmetic_model_lua = modifier_cosmetic_model_lua or class({})
function modifier_cosmetic_model_lua:IsHidden() return true end
function modifier_cosmetic_model_lua:IsPurgable() return false end
function modifier_cosmetic_model_lua:RemoveOnDeath() return false end
function modifier_cosmetic_model_lua:GetAttributes() return MODIFIER_ATTRIBUTE_PERMANENT end
function modifier_cosmetic_model_lua:GetPriority() return MODIFIER_PRIORITY_LOW end
function modifier_cosmetic_model_lua:DeclareFunctions() return {MODIFIER_PROPERTY_MODEL_CHANGE} end
function modifier_cosmetic_model_lua:OnCreated(kv)
	if not IsServer() then return end
	self.model = kv.model
end
function modifier_cosmetic_model_lua:OnRefresh(kv)
	self:OnCreated(kv)
end
function modifier_cosmetic_model_lua:GetModifierModelChange() return self.model end