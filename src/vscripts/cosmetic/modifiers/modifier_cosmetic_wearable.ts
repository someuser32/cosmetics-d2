import { GetAttribute } from "../../lib/client";
import { registerModifier } from "../../lib/dota_ts_adapter";
import { HasModifierState, LinkModifier } from "../../lib/server";
import { ModifierCosmeticBase } from "./modifier_cosmetic_base";

declare type params = {
	style : number | undefined,
	model : string,
	item_id : number
}

const ATTACH_TYPES : {[attach_name : string] : ParticleAttachment} = {
	["absorigin"]: ParticleAttachment.ABSORIGIN,
	["absorigin_follow"]: ParticleAttachment.ABSORIGIN_FOLLOW,
	["customorigin"]: ParticleAttachment.CUSTOMORIGIN,
	["customorigin_follow"]: ParticleAttachment.CUSTOMORIGIN_FOLLOW,
	["EYES_FOLLOW"]: ParticleAttachment.EYES_FOLLOW,
	["point_follow"]: ParticleAttachment.POINT_FOLLOW,
	["renderorigin_follow"]: ParticleAttachment.RENDERORIGIN_FOLLOW,
	["worldorigin"]: ParticleAttachment.WORLDORIGIN,
	["CENTER_FOLLOW"]: ParticleAttachment.CENTER_FOLLOW,
	["CUSTOM_GAME_STATE_1"]: ParticleAttachment.CUSTOM_GAME_STATE_1,
	["MAIN_VIEW"]: ParticleAttachment.MAIN_VIEW,
	["OVERHEAD_FOLLOW"]: ParticleAttachment.OVERHEAD_FOLLOW,
	["POINT"]: ParticleAttachment.POINT,
	["ROOTBONE_FOLLOW"]: ParticleAttachment.ROOTBONE_FOLLOW,
	["WATERWAKE"]: ParticleAttachment.WATERWAKE,
}

@registerModifier()
export class modifier_cosmetic_wearable_ts extends ModifierCosmeticBase {
	caster : CDOTA_BaseNPC = this.GetCaster()!;
	particles : {[particle_name : string] : ParticleID} = {};
	model : string = "";

	CheckState(): Partial<Record<ModifierState, boolean>> {
		const states : Partial<Record<ModifierState, boolean>> = {[ModifierState.INVULNERABLE]: true, [ModifierState.NO_HEALTH_BAR]: true, [ModifierState.OUT_OF_GAME]: true, [ModifierState.MAGIC_IMMUNE]: true, [ModifierState.NO_UNIT_COLLISION]: true, [ModifierState.NOT_ON_MINIMAP]: true, [ModifierState.UNSELECTABLE]: true};
		if (this.caster.IsInvisible()) {
			states[ModifierState.INVISIBLE] = true;
		}
		if (IsServer()) {
			if (HasModifierState(this.caster, ModifierState.TRUESIGHT_IMMUNE, [this])) {
				states[ModifierState.TRUESIGHT_IMMUNE] = true;
			}
		}
		return states;
	}

	DeclareFunctions(): ModifierFunction[] {
		return [ModifierFunction.ON_DEATH, ModifierFunction.ON_RESPAWN, ModifierFunction.INVISIBILITY_LEVEL, ModifierFunction.FIXED_DAY_VISION, ModifierFunction.FIXED_NIGHT_VISION];
	}

	OnCreated(kv: params): void {
		this.OnRefresh(kv);

		if (!IsServer()) {
			return;
		}

		this.StartIntervalThink(0.1);
	}

	OnRefresh(kv: params): void {
		this.caster = this.GetCaster()!;
		this.parent = this.GetParent();

		if (!IsServer()) {
			return;
		}

		this.model = kv.model;
		this.style = kv.style ?? this.style ?? -1;
		this.ResetVisuals();

		if (this.caster.IsIllusion()) {
			this.parent.AddNewModifier(this.parent, undefined, "modifier_illusion", {});
		} else {
			this.parent.RemoveModifierByName("modifier_illusion");
		}
	}

	ReadAsset(asset_name: string, asset: any, array?: ItemsGameItemAssetModifier[]): void {
		if (typeof(asset) == "object") {
			if (array != undefined && asset["style"] == this.style) {
				array.push({[asset_name]: asset});
			} else if (array != undefined && (asset_name == "styles" || string.match(asset_name, "^styles_%d+$")[0] != undefined)) {
				if (asset[this.style] != undefined) {
					for (const [styled_asset_name, styled_asset] of Object.entries(asset[this.style])) {
						array.push({[styled_asset_name as string]: styled_asset as any});
					};
				}
			} else if (asset["style"] == undefined || (array == undefined && asset["style"] == this.style)) {
				if (asset["type"] == "particle_create") {
					const attachments : ItemsGameAttributeControlledAttachedParticle | undefined = asset["attachments"];
					const fx = ParticleManager.CreateParticle(asset["modifier"], attachments != undefined ? ATTACH_TYPES[attachments!["attach_type"]] : ParticleAttachment.ABSORIGIN_FOLLOW, this.parent);
					if (attachments != undefined && attachments["control_points"] != undefined) {
						for (const [_, cp_info] of Object.entries(attachments["control_points"])) {
							ParticleManager.SetParticleControlEnt(fx, cp_info["control_point_index"], this.parent, ATTACH_TYPES[cp_info["attach_type"]], cp_info["attachment"] ?? "attach_hitloc", this.parent.GetAbsOrigin(), true);
						}
					}
					if (GameRules.Cosmetic.particles_json[asset["modifier"]] != undefined) {
						for (const [cp, cp_info] of Object.entries(GameRules.Cosmetic.particles_json[asset["modifier"]])) {
							ParticleManager.SetParticleControlEnt(fx, parseInt(cp), this.parent, ATTACH_TYPES[cp_info["attach"]], cp_info["name"] ?? "attach_hitloc", this.parent.GetAbsOrigin(), true);
						}
					}
					this.particles[asset["modifier"]] = fx;
				}
			}
		} else {
			if (asset_name.startsWith("skin")) {
				this.model_skin = asset as number;
			} else if (asset_name.startsWith("model_player")) {
				this.model = asset as string;
			}
		}
	}

	ApplyVisuals(): void {
		const model = this.model;
		this.parent.SetModel(model);
		this.parent.SetOriginalModel(model);

		const model_skin = this.model_skin;
		this.parent.SetSkin(model_skin ?? 0);
		this.parent.SetMaterialGroup(model_skin != undefined ? model_skin.toString() : "default");
	}

	OnIntervalThink(): void {
		for (const mod of this.caster.FindAllModifiersByName("modifier_truesight")) {
			if (GetAttribute(mod, "link") == undefined) {
				LinkModifier(mod, this.parent.AddNewModifier(mod.GetCaster(), mod.GetAbility(), mod.GetName(), {}));
			};
		}
	}

	ResetVisuals(): void {
		if (this.style == -1) {
			this.parent.SetSkin(0);
		}
		for (const [particle_name, fx] of Object.entries(this.particles)) {
			ParticleManager.DestroyParticle(fx, true);
			ParticleManager.ReleaseParticleIndex(fx);
		}
	}

	OnDestroy(): void {
		if (!IsServer()) {
			return;
		}

		this.ResetVisuals();
		UTIL_Remove(this.parent);
	}

	OnDeath(event: ModifierInstanceEvent): void {
		if (!IsServer()) {
			return;
		}

		if (event.unit != this.caster) {
			return;
		}

		this.parent.AddNoDraw();
	}

	OnRespawn(event: ModifierUnitEvent): void {
		if (!IsServer()) {
			return;
		}

		if (event.unit != this.caster) {
			return;
		}

		this.parent.RemoveNoDraw();
	}

	GetModifierInvisibilityLevel(): number {
		return this.parent.IsInvisible() ? 1 : 0;
	}

	GetFixedDayVision(): number {
		return 0;
	}

	GetFixedNightVision(): number {
		return 0;
	}
}
