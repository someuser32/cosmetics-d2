interface PrecacheKV {
	[asset_name : string | "particle" | "model" | "soundfile" | "particle_folder"] : string
}

interface NPCHeroAdjectives {
	Wings: number,
	Horns: number,
	Legs: number,
	Steed: 0 | 1,
	Nose: 0 | 1,
	Fuzzy: 0 | 1,
	Bearded : 0 | 1,
	Female : 0 | 1,
	BadTeeth : 0 | 1,
	Cape : 0 | 1,
	NicePecs : 0 | 1,
	Potbelly : 0 | 1,
	Parent : 0 | 1,
	Arachnophobic : 0 | 1,
	Undead : 0 | 1,
	Aquatic : 0 | 1,
	Demon : 0 | 1,
	Spirit : 0 | 1,
	Flying : 0 | 1,
	Cute : 0 | 1,
	Fiery : 0 | 1,
	Icy : 0 | 1,
	Blue : 0 | 1,
	Red : 0 | 1,
	Green : 0 | 1
}

interface NPCHeroPersona {
	[persona_id : number] : {
		name : string,
		token : string,
		token_english : string,
		Model : string,
		ModelScale : number
	}
}

interface NPCHeroItemSlots {
	[slot_id : number] : {
		SlotIndex : number,
		SlotName : string,
		SlotText : string,
		TextureWidth : number | undefined,
		TextureHeight : number | undefined,
		MaxPolygonsLOD0 : number | undefined,
		MaxPolygonsLOD1 : number | undefined,
		no_import : 0 | 1 | undefined,
		DisplayInLoadout : 0 | 1 | undefined,
	}
}

interface NPCHeroKV {
	Model : string,
	SoundSet : string | number,
	HeroID : number | undefined,
	Enabled : 0 | 1,
	Level : number,
	BotImplemented : 0 | 1,
	NewHero : 0 | 1,
	HeroPool1 : number,
	HeroUnlockOrder : number,
	Role : string | undefined,
	Rolelevels : string | undefined,
	Complexity : number | undefined,
	Team : "Good" | "Bad" | undefined,
	ModelScale : number | undefined,
	VersusScale : number | undefined,
	HeroGlowColor : string | undefined,
	PickSound : string | undefined,
	BanSound : string | undefined,
	CMEnabled : 0 | 1,
	NameAliases : string | undefined,
	workshop_guide_name : string | undefined,
	LastHitChallengeRival : string | undefined,
	HeroSelectSoundEffect : string | undefined,
	GibType : string | undefined,
	new_player_enable : 0 | 1,
	SimilarHeroes : string | undefined,
	Adjectives : NPCHeroAdjectives,
	Persona : NPCHeroPersona | undefined,
	Ability1 : string,
	Ability2 : string,
	Ability3 : string,
	Ability4 : string,
	Ability5 : string,
	Ability6 : string,
	Ability7 : string,
	Ability8 : string,
	Ability9 : string,
	Ability10 : string,
	Ability11 : string,
	Ability12 : string,
	Ability13 : string,
	Ability14 : string,
	Ability15 : string,
	Ability16 : string,
	Ability17 : string,
	Ability18 : string,
	Ability19 : string,
	Ability20 : string,
	Ability21 : string,
	Ability22 : string,
	Ability23 : string,
	Ability24 : string,
	Ability25 : string,
	Ability26 : string,
	Ability27 : string,
	Ability28 : string,
	Ability29 : string,
	Ability30 : string,
	Ability31 : string,
	Ability32 : string,
	Ability33 : string,
	Ability34 : string,
	Ability35 : string,
	AbilityTalentStart : number,
	ArmorPhysical : number,
	MagicalResistance : number,
	AttackCapabilities : "DOTA_UNIT_CAP_NO_ATTACK" | "DOTA_UNIT_CAP_MELEE_ATTACK" | "DOTA_UNIT_CAP_RANGED_ATTACK" | "DOTA_UNIT_CAP_RANGED_ATTACK_DIRECTIONAL",
	BaseAttackSpeed : number,
	AttackDamageMin : number,
	AttackDamageMax : number,
	AttackDamageType : "DAMAGE_TYPE_ArmorPhysical",
	AttackRate : number,
	AttackAnimationPoint : number,
	AttackAcquisitionRange : number,
	AttackRange : number,
	ProjectileModel : string,
	ProjectileSpeed : number
	AttackSpeedActivityModifiers : {[name : string] : number} | undefined,
	AttributePrimary : "DOTA_ATTRIBUTE_STRENGTH" | "DOTA_ATTRIBUTE_AGILITY" | "DOTA_ATTRIBUTE_INTELLECT" | "DOTA_ATTRIBUTE_ALL",
	AttributeBaseStrength : number,
	AttributeStrengthGain : number,
	AttributeBaseIntelligence : number,
	AttributeIntelligenceGain : number,
	AttributeBaseAgility : number,
	AttributeAgilityGain : number,
	BountyXP : number,
	BountyGoldMin : number,
	BountyGoldMax : number,
	BoundsHullName : "DOTA_HULL_SIZE_HERO" | "DOTA_HULL_SIZE_SMALL",
	particle_folder : string | undefined,
	GameSoundsFile : string | undefined,
	VoiceFile : string | undefined,
	RenderablePortrait : {
		"Particles": {
			[particle_name : string] : string
		}
	} | undefined,
	ItemSlots : NPCHeroItemSlots | undefined,
	Bot : {
		HeroType : string,
		LaningInfo : {
			SoloDesire : number,
			RequiresBabysit : number,
			ProvidesBabysit : number,
			SurvivalRating : number,
			RequiresFarm : number,
			ProvidesSetup : number,
			RequiresSetup : number
		},
		SupportsEasyMode : 0 | 1 | undefined,
		Loadout : {
			[item_name : string] : string
		} | undefined,
		Build : {
			[level : number] : string
		} | undefined
	}
	precache : PrecacheKV | undefined,
	party_hat_effect : string | undefined,
	party_hat_effect_persona : string | undefined
	RingRadius : number,
	MovementCapabilities : "DOTA_UNIT_CAP_MOVE_NONE" | "DOTA_UNIT_CAP_MOVE_GROUND" | "DOTA_UNIT_CAP_MOVE_FLY",
	MovementSpeed : number,
	MovementTurnRate : number,
	HasAggressiveStance : 0 | 1,
	StatusHealth : number,
	StatusMana : number,
	StatusManaRegen : number,
	StatusHealthRegen : number,
	TeamName : "DOTA_TEAM_GOODGUYS" | "DOTA_TEAM_BADGUYS" | "DOTA_TEAM_NEUTRALS" | "DOTA_TEAM_NOTEAM" | "DOTA_TEAM_CUSTOM_1" | "DOTA_TEAM_CUSTOM_2" | "DOTA_TEAM_CUSTOM_3" | "DOTA_TEAM_CUSTOM_4" | "DOTA_TEAM_CUSTOM_5" | "DOTA_TEAM_CUSTOM_6" | "DOTA_TEAM_CUSTOM_7" | "DOTA_TEAM_CUSTOM_8",
	CombatClassAttack : "DOTA_COMBAT_CLASS_ATTACK_HERO",
	CombatClassDefend : "DOTA_COMBAT_CLASS_DEFEND_HERO",
	UnitRelationshipClass : "DOTA_NPC_UNIT_RELATIONSHIP_TYPE_HERO",
	VisionDaytimeRange : string,
	VisionNighttimeRange : string,
	HasInventory : 0 | 1
	VoiceBackgroundSound : string,
	HealthBarOffset : number,
	IdleExpression : string,
	IdleSoundLoop : string,
	AbilityDraftDisabled : 0 | 1,
	ARDMDisabled : 0 | 1,
	HUD : {
		StatusHUD : {
			StatusStrength : {
				LocalizeToken : "#DOTA_StrengthStatus",
				Parameters : "Traits:Strength",
				HUDName : "unitstrength"
			},
			StatusAgility : {
				LocalizeToken : "#DOTA_AgilityStatus",
				Parameters : "Traits:Agility",
				HUDName : "unitAgility"
			},
			StatusIntellect : {
				LocalizeToken : "#DOTA_IntellectStatus",
				Parameters : "Traits:Intellect",
				HUDName : "unitintellect"
			}
		}
	}
}

interface NPCHeroesKV {
	[heroname: string | "Version"] : NPCHeroKV | number
}

interface ItemsGameStoreCurrencyPricePoint {
	GBP : number,
	EUR : number,
	RUB : number,
	BRL : number,
	JPY : number,
	NOK : number,
	IDR : number,
	MYR : number,
	PHP : number,
	SGD : number,
	THB : number,
	VND : number,
	KRW : number,
	TRY : number,
	UAH : number,
	MXN : number,
	CAD : number,
	AUD : number,
	NZD : number,
	CNY : number,
	TWD : number,
	HKD : number,
	INR : number,
	AED : number,
	SAR : number,
	ZAR : number,
	COP : number,
	PEN : number,
	CLP : number,
	CHF : number,
	ARS : number,
	CRC : number,
	ILS : number,
	KZT : number,
	KWD : number,
	PLN : number,
	QAR : number,
	UYU : number
}

interface ItemsGameRarity {
	value : number,
	loc_key : string,
	color : string,
	next_rarity : string
}

interface ItemsGameQuality {
	value : number,
	hexColor : string,
	sortPriority : number,
	displayName : string
}

interface ItemsGameColor {
	color_name : string,
	hex_color : string
}

interface ItemsGameItemCapabilities {
	nameable : 0 | 1 | undefined,
	can_have_sockets : 0 | 1 | undefined,
	gems_can_be_extracted : 0 | 1 | undefined,
	can_gift_wrap : 0 | 1 | undefined,
	usable_gc : 0 | 1 | undefined,
	usable_out_of_game : 0 | 1 | undefined,
	decodable: 0 | 1 | undefined,
	can_consume : 0 | 1 | undefined,
	is_gem : 0 | 1 | undefined
}

interface ItemsGameItemTreasureChest {
	name : string,
	text : string,
	icon : string,
	desc : string,
	desc_color : string
}

interface ItemsGamePrefab {
	item_class : string,
	item_type_name : string,
	item_name : string,
	item_slot : string | undefined,
	item_quality : string,
	item_rarity : string,
	min_ilevel : number,
	max_ilevel : number,
	capabilities : ItemsGameItemCapabilities,
	baseitem : 0 | 1 | undefined,
	player_loadout : 0 | 1 | undefined,
	tool : {
		type : string,
		use_string : string | undefined,
		usage_capabilities : ItemsGameItemCapabilities | undefined,
		sticker_qualities : {
			[id : number] : string
		} | undefined
	} | undefined,
	treasure_chest : {
		[name : string] : ItemsGameItemTreasureChest
	}
}

interface ItemsGameAttribute {
	name : string,
	attribute_class : string,
	attribute_type : string,
	storage_type : string,
	hidden : 0 | 1 | undefined,
	description_string : string | undefined,
	description_format : string | undefined,
	effect_type : string | undefined,
	stored_as_integer : 0 | 1 | undefined
}

interface ItemsGameItemAssetModifier {
	[asset_modifier : string] : any
}

interface ItemsGameItem extends ItemsGamePrefab {
	name : string,
	prefab : string,
	creation_date : string,
	image_inventory : string,
	item_description : string,
	item_slot : string | undefined,
	static_attributes : {
		[name : string] : {
			attribute_class : string
			value : number
		}
	} | undefined,
	used_by_heroes : {
		[heroname : string] : number
	} | number,
	portraits : {
		icon : {
			[portrait_key : string] : any
		}
	} | undefined,
	model_player : string | undefined,
	visuals : ItemsGameItemAssetModifier | undefined,
	bundle : {
		[item_name : string] : 0 | 1
	} | undefined
}

interface ItemsGameItemSet {
	name : string,
	items : {
		[item_name : string] : 0 | 1
	},
	store_bundle : string,
	portrait_image : string
}

interface ItemsGameAttributeControlledAttachedParticle {
	system : string,
	attach_type : string,
	attach_entity : string | undefined,
	control_points : {
		[control_point : number] : {
			control_point_index : number,
			attach_type : string,
			attachment : string | undefined
		}
	}
}

interface ItemsGameKV {
	items_game: {
		game_info : {
			first_valid_class : number,
			last_valid_class : number,
			first_valid_item_slot : number,
			last_valid_item_slot : number,
			num_item_presets : number
		},
		store_currency_pricepoints : {
			[price : number] : ItemsGameStoreCurrencyPricePoint,
		},
		rarities : {
			[rarity : string] : ItemsGameRarity
		},
		qualities : {
			[quality : string] : ItemsGameQuality
		},
		colors : {
			[color : string] : ItemsGameColor
		},
		player_loadout_slots : {
			[loadout_id : number] : string
		},
		code_referenced_icons : {
			[icon_path : string | "icon_path"] : string
		},
		prefabs : {
			[prefab_name : string] : ItemsGamePrefab
		},
		items : {
			[item_id : number] : ItemsGameItem
		},
		item_sets : {
			[item_name : string] : ItemsGameItemSet
		},
		attributes : {
			[attribute_id : number] : ItemsGameAttribute
		},
		attribute_controlled_attached_particles : {
			[item_id : number] : ItemsGameAttributeControlledAttachedParticle
		}
	}
}