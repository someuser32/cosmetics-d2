import { GetAttribute } from "../../lib/client";
import { registerModifier } from "../../lib/dota_ts_adapter";
import { ATTACH_TYPES } from "../vars";
import { ModifierCosmeticBase, params } from "./modifier_cosmetic_base";


interface ParticleInfo {
	pattach : ParticleAttachment,
	control_points : {
		[control_point : number] : {
			pattach : ParticleAttachment,
			attach : string,
			vector? : string | [number, number, number]
		}
	}
}

@registerModifier()
export class modifier_cosmetic_wearable_ts extends ModifierCosmeticBase {
	caster : CDOTA_BaseNPC = this.GetCaster()!;
	particles : {[particle_name : string] : ParticleID} = {};
	particle_infos : {[particle_name : string] : ParticleInfo} = {};
	model : string = "";

	CheckState(): Partial<Record<ModifierState, boolean>> {
		const states : Partial<Record<ModifierState, boolean>> = {[ModifierState.INVULNERABLE]: true, [ModifierState.NO_HEALTH_BAR]: true, [ModifierState.OUT_OF_GAME]: true, [ModifierState.MAGIC_IMMUNE]: true, [ModifierState.NO_UNIT_COLLISION]: true, [ModifierState.NOT_ON_MINIMAP]: true, [ModifierState.UNSELECTABLE]: true};

		if (this.caster.IsInvisible()) {
			states[ModifierState.INVISIBLE] = true;
		}

		if (IsServer()) {
			if (this.caster.HasModifierState(ModifierState.TRUESIGHT_IMMUNE, [this])) {
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

		this.kv = kv;

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
					const particle_name = asset["modifier"] ?? asset["asset"];
					if (particle_name == undefined) {
						return;
					}

					const attachments : ItemsGameAttributeControlledAttachedParticle | undefined = asset["attachments"];
					const control_points : ParticleInfo["control_points"] = {};
					if (attachments != undefined && attachments["control_points"] != undefined) {
						for (const [_, cp_info] of Object.entries(attachments["control_points"])) {
							const index : number = cp_info["control_point_index"] as number;
							control_points[index] = {
								"pattach": ATTACH_TYPES[cp_info["attach_type"]],
								"attach": cp_info["attachment"] ?? "attach_hitloc"
							};
						}
					}

					this.particle_infos[particle_name] = {
						"pattach": attachments != undefined ? ATTACH_TYPES[attachments!["attach_type"]] : ParticleAttachment.ABSORIGIN_FOLLOW,
						"control_points": control_points
					};
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

	ReadSpecialBehavior(behavior_name: keyof SpecialBehavior, behavior: SpecialBehavior[keyof SpecialBehavior], array?: SpecialBehavior[]): void {
		if (behavior_name == "particles") {
			const info = (behavior as SpecialBehaviorInfo["particles"])!;
			for (const [particle_name, particle_info] of Object.entries(info)) {
				if (particle_info == "destroy") {
					if (this.particle_infos[particle_name] != undefined) {
						delete this.particle_infos[particle_name];
					}
				} else {
					const create_particle = particle_info["create_on_equip"] ?? true;

					if (create_particle || this.particles[particle_name] != undefined) {
						const pattach = ATTACH_TYPES[particle_info["pattach"] ?? ""];
						const control_points : ParticleInfo["control_points"] = {};

						if (particle_info["control_points"] != undefined) {
							for (const [control_point, control_point_info] of Object.entries(particle_info["control_points"])) {
								control_points[parseInt(control_point)] = {
									"pattach": ATTACH_TYPES[control_point_info["pattach"] ?? ""] ?? ParticleAttachment.ABSORIGIN_FOLLOW,
									"attach": control_point_info["attach"] ?? "attach_hitloc",
									"vector": control_point_info["vector"] ?? "parent"
								};
							}
						}

						if (this.particles[particle_name] == undefined) {
							this.particle_infos[particle_name] = {
								"pattach": pattach ?? ParticleAttachment.ABSORIGIN_FOLLOW,
								"control_points": control_points
							}
						} else {
							if (pattach != undefined) {
								this.particle_infos[particle_name]["pattach"] = pattach;
							}
							this.particle_infos[particle_name]["control_points"] = Object.assign(this.particle_infos[particle_name]["control_points"], control_points);
						}
					}
				}
			}
		} else if (behavior_name == "wearable") {
			const info = (behavior as SpecialBehaviorInfo["wearable"])!;
			if (info["bodygroups"] != undefined) {
				for (const [bodygroup, value] of Object.entries(info["bodygroups"])) {
					this.model_bodygroups![bodygroup] = value;
				}
			}
		} else if (behavior_name == "styles") {
			const info = (behavior as SpecialBehavior["styles"])!;
			if (info[this.special_style!.toString()] != undefined) {
				if (array != undefined) {
					for (const [name, value] of Object.entries(info[this.special_style!.toString()])) {
						array.push({[name]: value});
					}
				}
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

		const model_bodygroups = this.GetUnionValue("model_bodygroups") as SpecialBehaviorModelInfo["bodygroups"];
		if (model_bodygroups != undefined) {
			for (const [bodygroup, value] of Object.entries(model_bodygroups)) {
				this.parent.SetBodygroupByName(bodygroup, value);
			}
		}
		for (const [particle_name, particle_info] of Object.entries(this.particle_infos)) {
			const fx = ParticleManager.CreateParticle(particle_name, particle_info["pattach"], this.parent);
			for (const [control_point, control_point_info] of Object.entries(particle_info["control_points"])) {
				let vector = this.parent.GetAbsOrigin();
				if (control_point_info["vector"] != undefined) {
					if (typeof control_point_info["vector"] == "object") {
						vector = Vector(...control_point_info["vector"])
					} else if (control_point_info["vector"] == "parent") {
						vector = this.parent.GetAbsOrigin();
					}
				}
				ParticleManager.SetParticleControlEnt(fx, parseInt(control_point), this.parent, control_point_info["pattach"], control_point_info["attach"], vector, true);
				print(control_point, control_point_info["pattach"], control_point_info["attach"], vector)
			}
			this.particles[particle_name] = fx;
		}
	}

	OnIntervalThink(): void {
		for (const mod of this.caster.FindAllModifiersByName("modifier_truesight")) {
			if (GetAttribute(mod, "link") == undefined) {
				mod.LinkModifier(this.parent.AddNewModifier(mod.GetCaster(), mod.GetAbility(), mod.GetName(), {}));
			}
		}
	}

	ResetVisuals(): void {
		if (this.style == -1) {
			this.parent.SetSkin(0);
		}

		if (this.model_bodygroups != undefined) {
			for (const [bodygroup, value] of Object.entries(this.model_bodygroups)) {
				this.parent.SetBodygroupByName(bodygroup, 0);
			}

			const model_bodygroups = this.GetUnionValue("model_bodygroups", true) as SpecialBehaviorModelInfo["bodygroups"];
			if (model_bodygroups != undefined) {
				for (const [bodygroup, value] of Object.entries(model_bodygroups)) {
					this.parent.SetBodygroupByName(bodygroup, value);
				}
			}

			this.model_bodygroups = {};
		}

		for (const fx of Object.values(this.particles)) {
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
