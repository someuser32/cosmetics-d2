import { GetAttribute, SetAttribute } from "./client";

export function IsMonkey(npc: CBaseEntity): boolean {
	return IsValidEntity(npc) && !npc.IsNull() && npc.IsBaseNPC() && (npc.HasModifier("modifier_monkey_king_wukongs_command_clone_ts") || npc.HasModifier("modifier_monkey_king_fur_army_soldier_hidden") || npc.HasModifier("modifier_monkey_king_fur_army_soldier") || npc.HasModifier("modifier_monkey_king_fur_army_soldier_in_position") || npc.HasModifier("modifier_monkey_king_fur_army_soldier_inactive"));
}

export function IsVengefulIllusion(npc: CBaseEntity): boolean {
	return IsValidEntity(npc) && !npc.IsNull() && npc.IsBaseNPC() && npc.HasModifier("modifier_vengefulspirit_command_aura_illusion");
}

export function IsClone(npc: CBaseEntity): boolean {
	if (!IsValidEntity(npc) || npc.IsNull() || !npc.IsBaseNPC()) {
		return false;
	}
	if (npc.IsClone()) {
		return true;
	}
	const owner = PlayerResource.GetSelectedHeroEntity(npc.GetPlayerOwnerID());
	return IsValidEntity(owner) && npc != owner && npc.IsRealHero() && npc.GetUnitName() == owner.GetUnitName() && !npc.IsTempestDouble() && !IsMonkey(npc) && !IsVengefulIllusion(npc);
}

export function IsTempestDouble(npc: CBaseEntity): boolean {
	return IsValidEntity(npc) && !npc.IsNull() && npc.IsBaseNPC() && npc.HasModifier("modifier_vengefulspirit_command_aura_illusion");
}

export function IsTrueHero(npc: CBaseEntity, consider_clones?: boolean): boolean {
	return IsValidEntity(npc) && !npc.IsNull() && npc.IsBaseNPC() && npc.IsRealHero() && !npc.IsIllusion() && !IsMonkey(npc) && !IsVengefulIllusion(npc) && (consider_clones != true ? !npc.IsClone() || npc.IsTempestDouble(): true);
}

export function GetModifierStates(modifier: CDOTA_Buff) : {[state : string] : boolean} {
	const states = {};
	modifier.CheckStateToTable(states);
	return states;
}

export function HasModifierState(npc: CBaseEntity, state: ModifierState, exceptions?: CDOTA_Buff[]) : boolean {
	if (!npc.IsBaseNPC()) {
		return false;
	}
	for (const mod of npc.FindAllModifiers()) {
		if (exceptions && exceptions.includes(mod)) {
			continue;
		}
		const states = GetModifierStates(mod);
		if (states[state.toString()]) {
			return true;
		}
	}
	return false;
}

export function LinkModifier(modifier: CDOTA_Buff, linked_modifier: CDOTA_Buff, modifier_data?: object): void {
	SetAttribute(modifier, "link", linked_modifier);
	SetAttribute(modifier, "linked", {"caster": linked_modifier.GetCaster(), "ability": linked_modifier.GetAbility(), "name": linked_modifier.GetName(), "data": Object.assign({"duration": linked_modifier.GetDuration()}, modifier_data ?? {})});
	Timers.CreateTimer({"endTime": FrameTime(), "callback": () => {
		if (!modifier) {
			if (linked_modifier) {
				linked_modifier.Destroy();
			}
		} else {
			const linked : {"caster": CDOTA_BaseNPC | undefined, "ability": CDOTABaseAbility | undefined, name: string, "data": Object} = GetAttribute(modifier, "linked");
			if (linked) {
				let link = GetAttribute(modifier, "link") as CDOTA_Buff;
				if (!link) {
					link = modifier.GetParent().AddNewModifier(linked["caster"], linked["ability"], linked["name"], linked["data"]);
				}
				if (link.GetRemainingTime() != modifier.GetRemainingTime()) {
					linked_modifier.SetDuration(modifier.GetRemainingTime(), true);
				}
			}
			return FrameTime();
		}
	}}, undefined);
}

export function UnlinkModifier(modifier: CDOTA_Buff, save?: boolean): void {
	SetAttribute(modifier, "linked", undefined);
	if (!save) {
		const link = GetAttribute(modifier, "link");
		if (link) {
			link.Destroy();
		}
	}
	SetAttribute(modifier, "link", undefined);
}

export function OnDestroyLink(modifier: CDOTA_Buff): void {
	UnlinkModifier(modifier)
}