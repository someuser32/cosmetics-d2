interface Slots {
	[heroname : string] : {
		slots : CosmeticSlots,
		model_scale : number
	}
}

interface PlayersEquippedItems {
	[playerID : number] : {
		[heroname : string] : CosmeticEquippedItems
	}
}

interface DOTAEquippedItems {
	[slot : string] : number
}

interface BaseItem {
	name : string,
	slot : string,
	icon : string,
	heroes : string[],
	rarity : string,
	styles : number,
	type : string,
}

interface Item extends BaseItem {
	model : string,
	visuals : {
		[asset_modifier : string] : any
	}
}

interface Bundle extends BaseItem {
	bundle : string[] | number[]
}

interface Items {
	[item_id : number] : Item | Bundle
}

interface HeroItems {
	[heroname : string] : {
		[slotname : string] : Items
	}
}

interface SpecialBehaviorParticleControlPoint {
	pattach? : string,
	attach? : string,
	vector? : string | [number, number, number],
	owner? : string
}

interface SpecialBehaviorParticleInfo {
	pattach? : string,
	control_points? : {
		[control_point : string] : SpecialBehaviorParticleControlPoint
	},
	create_on_equip?: boolean,
	owner? : string
}

interface SpecialBehaviorModelInfo {
	bodygroups? : {
		[group : string] : number
	},
	skin? : number,
	materialgroup?: string
}

interface SpecialBehaviorInfo {
	particles? : {
		[particle_name : string] : SpecialBehaviorParticleInfo | "destroy"
	},
	player? : SpecialBehaviorModelInfo,
	wearable? : SpecialBehaviorModelInfo
}

interface SpecialBehavior extends SpecialBehaviorInfo {
	styles? : {
		[style : string] : SpecialBehaviorInfo
	},
	parent_style? : number
}

interface BehaviorsJSON {
	[name : string] : SpecialBehavior
}

interface ParticleReplacements {
	[particle_name : string] : {
		name? : string,
		pattach? : ParticleAttachment,
		control_points? : {
			[control_point : string] : SpecialBehaviorParticleControlPoint
		},
	}
}