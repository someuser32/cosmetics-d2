interface Slots {
	[heroname: string]: {
		slots: CosmeticSlots,
		model_scale: number
	}
}

interface PlayersEquippedItems {
	[playerID: number]: {
		[heroname: string]: CosmeticEquippedItems
	}
}

interface DOTAEquippedItems {
	[slot: string]: number
}

interface BaseItem {
	name: string,
	slot: string,
	icon: string,
	heroes: string[],
	rarity: string,
	styles: number,
	type: string,
}

interface Item extends BaseItem {
	model: string,
	visuals: {
		[asset_modifier: string]: any
	}
}

interface Bundle extends BaseItem {
	bundle: string[] | number[]
}

interface Items {
	[item_id: number]: Item | Bundle
}

interface HeroItems {
	[heroname: string]: {
		[slotname: string]: Items
	}
}

interface SpecialBehaviorParticleControlPoint {
	pattach?: string,
	attach?: string,
	vector?: string | [number, number, number],
	owner?: string
}

interface SpecialBehaviorParticleInfo {
	pattach?: string,
	control_points?: {
		[control_point: string]: SpecialBehaviorParticleControlPoint
	},
	create_on_equip?: boolean,
	owner?: string
}

interface SpecialBehaviorModelInfo {
	bodygroups?: {
		[group: string]: number
	},
	skin?: number,
	materialgroup?: string
}

interface SpecialBehaviorInfo {
	particles?: {
		[particle_name: string]: SpecialBehaviorParticleInfo | "destroy"
	},
	player?: SpecialBehaviorModelInfo,
	wearable?: SpecialBehaviorModelInfo
}

interface SpecialBehavior extends SpecialBehaviorInfo {
	styles?: {
		[style: string]: SpecialBehaviorInfo
	},
	parent_style?: number
}

interface BehaviorsJSON {
	[name: string]: SpecialBehavior
}

interface ParticleReplacements {
	[particle_name: string]: {
		name?: string,
		pattach?: ParticleAttachment,
		control_points?: {
			[control_point: string]: SpecialBehaviorParticleControlPoint
		},
		priority?: number
	}
}

interface UnitModelReplacement {
	model: string,
	priority?: number
}

interface UnitModelsReplacements {
	[unit_name: string]: UnitModelReplacement
}

interface WearableModelReplacement {
	model: string,
	skin?: number,
	priority?: number
}

interface WearableModelsReplacements {
	[model_name: string]: WearableModelReplacement
}

interface SoundReplacement {
	name: string,
	priority?: number
}

interface SoundReplacements {
	[sound_name: string]: SoundReplacement
}

interface ActualSoundReplacements {
	[sound_name: string]: string
}

interface HeroIconReplacement {
	name: string,
	priority?: number
}

interface HeroIconReplacements {
	[hero_icon: string]: HeroIconReplacement
}

interface AbilityIconReplacement {
	name: string,
	priority?: number
}

interface AbilityIconReplacements {
	[ability_icon: string]: AbilityIconReplacement
}

interface ItemIconReplacement {
	name: string,
	priority?: number
}

interface ItemIconReplacements {
	[item_icon: string]: ItemIconReplacement
}