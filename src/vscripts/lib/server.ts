import { GetAttribute, SetAttribute } from "./client";

declare global {
	interface CDOTA_BaseNPC {
		IsMonkey(): boolean,
		IsVengefulIllusion(): boolean,
		IsTrueHero(coonsider_clones?: boolean): boolean,
		HasModifierState(state: ModifierState, exceptions?: CDOTA_Buff[]): boolean
	}

	interface CDOTA_Buff {
		HasModifierState(state: ModifierState): boolean,
		LinkModifier(linked_modifier: CDOTA_Buff, modifier_data?: object): void,
		UnlinkModifier(save?: boolean): void,
		OnDestroyLink(): void
	}
}

CDOTA_BaseNPC.IsMonkey = function(): boolean {
	return IsValidEntity(this) && (this.HasModifier("modifier_monkey_king_wukongs_command_clone_ts") || this.HasModifier("modifier_monkey_king_fur_army_soldier_hidden") || this.HasModifier("modifier_monkey_king_fur_army_soldier") || this.HasModifier("modifier_monkey_king_fur_army_soldier_in_position") || this.HasModifier("modifier_monkey_king_fur_army_soldier_inactive"));
}

CDOTA_BaseNPC.IsVengefulIllusion = function(): boolean {
	return IsValidEntity(this) && this.HasModifier("modifier_vengefulspirit_command_aura_illusion");
}

if (GameRules == undefined || GameRules.Addon == undefined) {
	const valve_is_clone = CDOTA_BaseNPC.IsClone;

	CDOTA_BaseNPC.IsClone = function(): boolean {
		if (!IsValidEntity(this)) {
			return false;
		}
		if (valve_is_clone.bind(this)()) {
			return true;
		}
		const owner = PlayerResource.GetSelectedHeroEntity(this.GetPlayerOwnerID());
		return IsValidEntity(owner) && this.entindex() != owner.entindex() && this.IsRealHero() && this.GetUnitName() == owner.GetUnitName() && !this.IsMonkey() && !this.IsVengefulIllusion() && !this.IsTempestDouble();
	}
}

CDOTA_BaseNPC.IsTrueHero = function(consider_clones?: boolean): boolean {
	return IsValidEntity(this) && this.IsRealHero() && !this.IsIllusion() && !this.IsMonkey() && !this.IsVengefulIllusion() && (consider_clones != true ? !this.IsClone() || this.IsTempestDouble(): true);
}

CDOTA_BaseNPC.HasModifierState = function(state: ModifierState, exceptions?: CDOTA_Buff[]): boolean {
	if (!IsValidEntity(this)) {
		return false;
	}
	for (const mod of this.FindAllModifiers()) {
		if (exceptions && exceptions.includes(mod)) {
			continue;
		}
		const states = mod.GetModifierStates();
		if (states[state.toString()]) {
			return true;
		}
	}
	return false;
}

CDOTA_Buff.HasModifierState = function(state: ModifierState): boolean {
	return this.GetParent().HasModifierState(state, [this]);
}

CDOTA_Buff.LinkModifier = function(linked_modifier: CDOTA_Buff, modifier_data?: object): void {
	const linked = {"caster": linked_modifier.GetCaster(), "ability": linked_modifier.GetAbility(), "name": linked_modifier.GetName(), "data": Object.assign({"duration": linked_modifier.GetDuration()}, modifier_data ?? {})};
	SetAttribute(this, "link", linked_modifier);
	Timers.CreateTimer({"endTime": FrameTime(), "callback": () => {
		if (this == undefined || this.IsNull()) {
			if (linked_modifier != undefined && !linked_modifier.IsNull()) {
				linked_modifier.Destroy();
			}
		} else {
			if (linked != undefined && linked != null) {
				let link = GetAttribute(this, "link") as CDOTA_Buff;
				if (link == undefined || link.IsNull()) {
					link = this.GetParent().AddNewModifier(linked["caster"], linked["ability"], linked["name"], linked["data"]);
					SetAttribute(this, "link", link)
				}
				if (link.GetRemainingTime() != this.GetRemainingTime()) {
					linked_modifier.SetDuration(this.GetRemainingTime(), true);
				}
			}
			return FrameTime();
		}
	}}, this);
}

CDOTA_Buff.UnlinkModifier = function(save?: boolean): void {
	if (!save) {
		const link = GetAttribute(this, "link") as CDOTA_Buff;
		if (link != undefined && !link.IsNull()) {
			link.Destroy();
		}
	}
	SetAttribute(this, "link", undefined);
}

CDOTA_Buff.OnDestroyLink = function(): void {
	this.UnlinkModifier();
}