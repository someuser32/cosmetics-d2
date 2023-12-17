interface RGBColor {
	r: number,
	g: number,
	b: number,
}

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
		TextureWidth?: number,
		TextureHeight?: number,
		MaxPolygonsLOD0?: number,
		MaxPolygonsLOD1?: number,
		no_import?: 0 | 1,
		DisplayInLoadout?: 0 | 1,
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

interface ItemsGameGameInfo {
	first_valid_class: number,
	last_valid_class: number,
	first_valid_item_slot: number,
	last_valid_item_slot: number,
	num_item_presets: number,
}

interface ItemsGameStoreCurrencyPricePoint {
	GBP: number,
	EUR: number,
	RUB: number,
	BRL: number,
	JPY: number,
	NOK: number,
	IDR: number,
	MYR: number,
	PHP: number,
	SGD: number,
	THB: number,
	VND: number,
	KRW: number,
	TRY: number,
	UAH: number,
	MXN: number,
	CAD: number,
	AUD: number,
	NZD: number,
	CNY: number,
	TWD: number,
	HKD: number,
	INR: number,
	AED: number,
	SAR: number,
	ZAR: number,
	COP: number,
	PEN: number,
	CLP: number,
	CHF: number,
	ARS: number,
	CRC: number,
	ILS: number,
	KZT: number,
	KWD: number,
	PLN: number,
	QAR: number,
	UYU: number,
}

interface ItemsGameRarity {
	value: number,
	loc_key: string,
	color: string,
	next_rarity?: string,
}

interface ItemsGameQuality {
	value: number,
	hexColor: string,
	sortPriority: number,
	displayName: string,
}

interface ItemsGameColor {
	color_name: string,
	hex_color: string,
}

interface ItemsGamePrefabCapabilities {
	nameable: number,
	can_have_sockets?: number,
	gems_can_be_extracted?: number,
	can_gift_wrap?: number,
	usable_gc?: number,
	usable_out_of_game?: number,
	decodable?: number,
	usable?: number,
	is_gem?: number,
	no_key_required?: number,
}

interface ItemsGamePrefabTool {
	type: string,
	use_string: string,
	usage_capabilities?: {
		can_consume: number,
	},
	sticker_qualities?: {
		[sticker_id: number]: string,
	},
}

interface ItemsGamePrefabTreasureChest {
	name: string,
	text: string,
	icon: string,
	desc: string,
	desc_color: string,
}

interface ItemsGamePrefab {
	item_class: string,
	item_type_name: string,
	item_name: string,
	item_slot?: string,
	item_quality: string,
	item_rarity: string,
	min_ilevel?: number,
	max_ilevel?: number,
	capabilities: ItemsGamePrefabCapabilities,
	baseitem?: number,
	tool?: ItemsGamePrefabTool,
	player_loadout?: number,
	treasure_chest?: {
		[treasure_name: string]: ItemsGamePrefabTreasureChest,
	},
	perfect_world_explicit_whitelist?: number,
}

interface ItemsGameItemCapabilities {
	is_gem: number,
	can_increment: number,
	can_have_sockets?: number,
	gems_can_be_extracted?: number,
	nameable?: number,
	can_gift_wrap?: number,
	usable_gc?: number,
	usable_out_of_game?: number,
	usable?: number,
	uses_essence?: number,
	decodable?: number,
	no_key_required?: number,
	no_equip_to_use?: number,
	can_have_signatures?: number,
}

interface ItemsGameItemTool {
	type: string,
	usage: {
		filter_autograph_id: number,
		loot_list?: string,
		num_items?: number,
		max_recipients?: number,
		target_rule?: string,
		required_tags?: {
			[team_name: string]: number,
		},
		components?: {
			input: {
				chances: {
					[chance: number]: number,
				},
				[input_id: number]: {
					type: string,
					criteria?: {
						rarity: string,
						quality?: string,
					},
					counts: {
						[count: number]: number,
					},
					lootlist?: string,
					item?: string,
					chance?: number,
					event_id?: string,
				} | undefined,
			},
			output: {
				[output_id: number]: {
					type: string,
					lootlist: string,
					cannot_match_input: number,
					criteria: {
						rarity: string,
						quality?: string,
					},
					item?: string,
					dynamic_attributes?: {
						[dynamic_attribute_id: number]: {
							attrib_name: string,
							value: number,
						},
					},
					event_id?: number,
					actions?: {
						[action_id: number]: number,
					},
					normal_pts?: number,
					dup_protection?: number,
					associated_item_def?: number,
				},
			},
		},
		league_id?: number,
		order?: number,
		tier?: string,
		location?: string,
		style?: number,
		item_def?: number,
		selection_index?: number,
		selection_value?: number,
		selection_additive?: number,
		premium?: number,
		prize_pool?: {
			base_prize_pool: number,
			stop_sales_time: number,
			description: string,
			items: {
				item: {
					itemdef: number,
					additional_pool: number,
					revenue_percent?: number,
				},
				[item_id: number]: {
					itemdef: number,
					additional_pool?: number,
					revenue_percent?: number,
				} | undefined,
			},
		},
		static_recipe?: number,
		context_menu_prompt?: string,
		context_menu_confirm?: string,
		context_menu_confirm_title?: string,
		disable_delete?: number,
		sell_on_charm_dialog?: number,
		track_failure?: number,
		reset_on_failure?: number,
		destroy_after_failures?: number,
		reward_after_wins?: number,
		reward_item_def?: number,
		notify_server?: number,
		failure_loot_list?: string,
		wins_event_type?: number,
		all_pick_only?: number,
		reward_loot_list?: string,
		peek_inside_chest_item_def?: number,
		reward_premium_pts?: number,
		reward_display_item_def?: number,
		event_id?: number | string,
		reward_action_id?: number,
		featured_charm_until?: number,
		emoticon_id_start?: number,
		emoticon_id_end?: number,
		status_effect?: number,
		effigy_itemdef_index?: number,
		unlock_override_quality?: string,
		unlocks?: {
			[unlock_id: number]: {
				style: number,
				item_def: number,
			},
		},
		usage_capabilities?: {
			nameable: number,
		},
		use_string?: string,
		is_reward_repeatable?: number,
		reward_normal_pts?: number,
		reward_normal_pts_escalation_amount?: number,
		reward_normal_pts_escalation_limit?: number,
		reward_action_name?: string,
		duration_seconds?: number,
		backpack_slots?: number,
		redemption?: string,
		drop_rate_bonus?: number,
		duration_hours?: number,
		admin?: number,
		private?: number,
		start_date?: number,
		duration?: number,
		timezone?: number,
		teams?: {
			[team_id: number]: number,
		},
		bonus_itemdefs?: {
			[bonus_itemdef_id: number]: number,
		},
		disabled?: number,
		expiration_date?: string,
		hud_skin_item_def?: number,
		purchase_bundle?: number,
		dont_require_usage_confirmation?: number,
		in_game_duration?: number,
		free_to_spectate?: number,
		points?: number,
		premium_points?: number,
		season_id?: number,
		fantasy?: number,
		require_league_id?: number,
		compendium_league?: number,
		compendium_selection?: number,
		compendium_add_value?: number,
		grant_league_def?: number | string,
		grant_points_def?: number,
		original_purchaser_field?: number,
		type?: number,
		season?: number,
		end_date?: number,
		matches_have_mvp_data?: number,
		can_vote_for_mvp_data?: number,
		tournament_location?: string,
		organization?: string,
		square_logo?: string,
		published_file_id?: number,
		product_id?: number,
		grant_event_ownership?: number,
		grant_event_points?: number,
		already_owned_grant_points?: number,
		confirm_string?: string,
		grant_event_premium_points?: number,
		safe?: number,
		has_rollup?: number,
		card_count?: number,
		gold_rarity?: number,
		grant_action_id?: number,
		grant_steam_package?: number,
		amount?: number,
		action_id?: number,
		linked_subscription_item?: string,
		prepaid_time_duration?: number,
		prepaid_time_units?: string,
		support_grant?: number,
		renewal_frequency?: number,
		renewal_period?: string,
		usage_title?: string,
		usage_description?: string,
		usage_class?: string,
		already_owned_grant_premium_points?: number,
	},
	usage_capabilities: {
		can_increment: number,
		can_consume?: number,
		nameable?: number,
		decodable?: number,
		uses_essence?: number,
		can_have_sockets?: number,
		can_gift_wrap?: number,
		gems_can_be_extracted?: number,
	},
	use_string?: string,
	restriction?: string,
	id?: number,
	name?: string,
	playerimage?: string | number,
	date_of_birth?: string,
	country_code?: string,
	role?: string,
	team_name?: string,
	team_image?: string,
	match_id?: number,
	hero_1?: number,
	hero_2?: number,
	hero_3?: number,
	items_per_treasure?: number,
	confirm_string?: string,
	selection_already_set_string?: string,
	selection_cant_stamp?: string,
	event_id?: number,
	open_action_id?: number,
	no_dupe_loot_list_override?: string,
	standard_item_giftable?: number,
	standard_item_tradable_after?: string,
	first_loot_list_override?: string,
	sockets?: {
		[socket_id: number]: number,
	},
	sticker_type?: string,
	team_id?: number,
	sticker_qualities?: {
		[sticker_id: number]: string,
	},
	place_event_action?: number,
	place_event_quality?: number,
	place_event_id?: number,
}

interface ItemsGameItemPortrait {
	PortraitLightPosition: string,
	PortraitLightAngles: string,
	PortraitLightFOV: number,
	PortraitLightDistance: number,
	PortraitLightColor: string,
	PortraitShadowColor: string,
	PortraitShadowScale: number,
	PortraitGroundShadowScale: number,
	PortraitAmbientColor: string,
	PortraitAmbientScale: number,
	PortraitSpecularColor: string,
	PortraitSpecularDirection?: string,
	PortraitSpecularPower?: number,
	PortraitBackgroundColor1?: string,
	PortraitBackgroundColor2?: string,
	PortraitBackgroundColor3?: string,
	PortraitBackgroundColor4?: string,
	PortraitBackgroundTexture?: string,
	PortraitAnimationActivity?: string,
	PortraitAnimationCycle?: number,
	PortraitAnimationRate?: number,
	PortraitHideHero?: number,
	PortraitLightScale: number,
	PortraitAmbientDirection: string,
	cameras: {
		[camera_name: string]: {
			PortraitPosition: string,
			PortraitAngles: string,
			PortraitFOV: number,
			PortraitFar?: number,
		} | undefined
	},
	PortraitParticle?: string,
	PortraitHideParticles?: number,
	PortraitHideDropShadow?: number,
	PortraitDesaturateParticles?: number,
	PortraitDesaturateHero?: number,
	PortraitPlayIdleExpression?: number,
	PortraitVignetteItem?: number,
	hero_presets?: {
		[hero_preset_name: string]: {
			PortraitHeroRotation: string,
		}
	},
	EffectDissolveColor?: string,
	PortraitBackgroundModel?: string,
	PortraitAllowAnimatedPortrait?: number,
	PortraitPosition?: string,
	PortraitLookAt?: string,
	PortraitFOV?: number,
	PortraitFar?: number,
	PortraitLightLookAt?: string,
	PortraitAmbientOrigin?: string,
	summons?: {
		[summon_name: string]: {
			Position: string,
			Angles: string,
			Scale: number,
		}
	},
	GodraysFXColor?: string,
	GroundfogFXColor?: string,
	SummonPosition?: string,
	SummonAngles?: string,
	SummonCount?: number,
	SummonScale?: number,
	PortraitheadgroundColor1?: string,
	PortraitheadgroundColor2?: string,
	PortraitheadgroundColor3?: string,
	PortraitheadgroundColor4?: string,
	PortraitheadgroundTexture?: string,
	PortraitshouldergroundColor1?: string,
	PortraitshouldergroundColor2?: string,
	PortraitshouldergroundColor3?: string,
	PortraitshouldergroundColor4?: string,
	PortraitshouldergroundTexture?: string,
	PortraitweapongroundColor1?: string,
	PortraitweapongroundColor2?: string,
	PortraitweapongroundColor3?: string,
	PortraitweapongroundColor4?: string,
	PortraitweapongroundTexture?: string,
}

interface ItemsGameItemPriceInfo {
	bucket: string,
	class: string,
	category_tags: string,
	date: string,
	price: number,
	is_pack_item?: number,
	bundle?: number,
	new?: number,
	quantity?: number,
	regional_prices?: {
		gbp: number,
		eur: number,
		chf: number,
		rub: number,
		pln: number,
		brl: number,
		jpy: number,
		nok: number,
		idr: number,
		myr: number,
		php: number,
		sgd: number,
		thb: number,
		vnd: number,
		krw: number,
		try: number,
		uah: number,
		mxn: number,
		cad: number,
		aud: number,
		nzd: number,
		cny: number,
		rmb: number,
		inr: number,
		clp: number,
		pen: number,
		cop: number,
		zar: number,
		hkd: number,
		twd: number,
		sar: number,
		aed: number,
		ars: number,
		ils: number,
		kzt: number,
		kwd: number,
		qar: number,
		crc: number,
		uyu: number,
	},
}

interface ItemsGameItemTags {
	is_weapon: number,
	event_egg?: number,
	[team_name: string]: number | undefined
}

interface ItemsGameItemStyle {
	model_player: string,
	name: string,
	alternate_icon: number,
}

interface ItemsGameItemTreasureChest {
	name: string,
	text?: string,
	icon: string,
	desc: string,
	desc_color: string,
}

interface ItemsGameItemCourierSlot {
	horns: number,
	teeth: number,
	tail: number,
	hair: number,
	nose: number,
	ears: number,
	wings: number,
	eyes: number,
	effect: number,
	feathers: number,
}

interface ItemsGameItemCourierWearable {
	courier: string,
	slot: string,
	index: number,
	flying?: number,
}

interface ItemsGameItemAutograph2 {
	name: string | number,
	workshoplink: number,
	language: number,
	icon_path: string,
	filename_override?: number,
}

interface ItemsGameItemAdditionalInfo {
	display_msg: string,
}

interface ItemsGameItemAssetModifier {
	type?: string,
	modifier: {
		PortraitLightPosition: string,
		PortraitLightAngles: string,
		PortraitLightFOV: number,
		PortraitLightDistance: number,
		PortraitLightColor: string,
		PortraitShadowColor: string,
		PortraitShadowScale: number,
		PortraitAmbientColor: string,
		PortraitAmbientScale: number,
		PortraitSpecularColor: string,
		PortraitBackgroundTexture: string,
		PortraitBackgroundColor1: string,
		PortraitBackgroundColor2: string,
		PortraitBackgroundColor3: string,
		PortraitBackgroundColor4: string,
		PortraitLightScale: number,
		PortraitGroundShadowScale: number,
		PortraitAmbientDirection: string,
		PortraitAnimationActivity: string,
		cameras: {
			default?: {
				PortraitPosition: string,
				PortraitAngles: string,
				PortraitFOV: number,
				PortraitFar: number,
			},
			Default?: {
				PortraitPosition: string,
				PortraitAngles: string,
				PortraitFOV: number,
				PortraitFar: number,
			},
		},
		PortraitSpecularDirection?: string,
		PortraitSpecularPower?: number,
		PortraitAnimationCycle?: number,
		PortraitAnimationRate?: number,
		PortraitHideHero?: number,
		PortraitHideParticles?: number,
		PortraitHideDropShadow?: number,
		PortraitDesaturateParticles?: number,
		PortraitDesaturateHero?: number,
		PortraitPlayIdleExpression?: number,
		PortraitVignetteItem?: number,
		SummonPosition?: string,
	} | string | number | undefined,
	asset?: string | number,
	required_model_variant?: number,
	affected_by_color_gems?: number,
	spawn_in_loadout_only?: number,
	spawn_in_alternate_loadout_only?: number,
	style?: number,
	frequency?: number,
	destroy_immediately?: string | number,
	fake_particle_system?: number,
	scale_size?: number,
	skin?: number,
	[asset: string | number]: {
		name: string,
		model_player?: string,
		alternate_icon?: number,
		unlock?: {
			gem: {
				def_index: number,
				type_field: string,
				type_value: number,
				unlock_field: string,
				unlock_value: number,
			},
			item_def?: number,
			price?: number,
			style?: number | string,
		},
		icon_path?: string,
		skin?: number,
		auto_style_rule?: string,
		auto_style_reason?: string,
		body_groups?: {
			wings: number,
			bracer?: number,
		},
		asset?: string,
		entity_scale_flying?: number,
	} | undefined | number | string | object,
	gesture?: number,
	control_point_number?: number,
	cp_position?: string,
	force_display?: number,
	level?: number,
	apply_when_equipped_in_ability_effects_slot?: number,
	offset?: number,
	required_arcana_level?: number,
	minimum_priority?: number,
	pickup_item?: string,
	levelup_rule?: string,
	strange_type?: number,
	supports_coop_teleport?: number,
	loadout_default_offset?: string,
	message?: string,
	label?: string,
	ingame_scale?: number,
	loadout_scale?: number,
	loadout_hero_offsets?: {
		[loadout_hero_offset_name: string]: string
	},
	compendium_event_id?: number,
	replacement_type?: string,
	flying_courier_only?: number,
	naked?: number,
	level_1?: number,
	level_2?: number,
	level_3?: number,
	white?: number,
	black?: number,
	ground_courier_only?: number,
	name?: string,
	playerimage?: string,
	age?: number,
	country_code?: string,
	role?: string,
	team_image?: string,
	team_name?: string,
	hero_1?: string,
	hero_2?: string,
	hero_3?: string,
	international_appearances?: number,
	tagline?: string,
	weather_type?: number,
	radiant_only?: number,
	dire_only?: number,
	custom_type?: string,
	min_level?: number,
	criteria?: string,
	replace_animations?: number,
	dynamic_weather?: number,
	portrait_activity?: string,
	ModelScale?: number,
	VersusScale?: number,
	LoadoutScale?: number,
	SpectatorLoadoutScale?: number,
	is_loadout_intro_effect?: number,
	persona?: number,
	display_time?: number,
	value?: number,
	is_target?: number,
	StickerQuality?: number,

	// custom
	attachments?: ItemsGameAttributeControlledAttachedParticle
}

interface ItemsGameItem {
	name: string,
	prefab: string,
	creation_date?: string,
	image_inventory?: string,
	item_description?: string,
	item_name?: string,
	item_rarity?: string,
	item_type_name?: string,
	static_attributes: {
		[attribute_name: string]: string | number,
	} | number | string,
	used_by_heroes: {
		[hero_name: string]: number,
	} | number | undefined,
	event_id?: string,
	hide_in_store?: number,
	item_slot?: string,
	hidden?: number,
	item_quality?: string,
	capabilities?: ItemsGameItemCapabilities,
	tool?: ItemsGameItemTool,
	image_inventory_overlay?: string,
	model_player?: string,
	portraits?: {
		[portrait: string]: ItemsGameItemPortrait,
	},
	visuals?: {
		[asset_modifier: string]: ItemsGameItemAssetModifier,
	},
	particle_folder?: string,
	baseitem?: number,
	model_player1?: string,
	model_player2?: string,
	model_player3?: string,
	player_loadout?: number,
	match_cycle_to_parent?: number,
	expiration_date?: string,
	disable_hero_portrait_override?: number,
	developer?: number,
	price_info?: ItemsGameItemPriceInfo,
	tags?: ItemsGameItemTags,
	forced_item_quality?: string,
	bundle?: {
		[item_name: string]: number | string,
	},
	branding?: {
		corporation_id: number,
		team_id?: number,
	},
	has_store_custom_item_details_panel?: number,
	override_attack_attachments?: number,
	particle_snapshot?: string,
	styles?: {
		[style: number]: ItemsGameItemStyle,
	},
	hide_tradecraftdelete?: number,
	reward_can_be_shown_in_toast?: number,
	workshop_accepted?: number,
	treasure_display_override?: string,
	item_class?: string,
	hide_in_inventory?: number,
	associated_item?: number,
	treasure_chest?: {
		[treasure_chest_name: string]: ItemsGameItemTreasureChest,
	},
	courier_slots?: {
		[courier_name: string]: ItemsGameItemCourierSlot,
	},
	courier_wearable?: ItemsGameItemCourierWearable,
	frostivus_premium_price?: number,
	frostivus_price?: number,
	tournament_url?: string,
	autograph?: ItemsGameItemAutograph2,
	additional_info?: ItemsGameItemAdditionalInfo,
	plus_auto_grant_yearly_pattern_start?: string,
	plus_auto_grant_yearly_pattern_end?: string,
	hide_in_purchase_popup?: number,
	premium_point_cost?: number,
	treasure_extra_layout_file?: string,
	purchase_requirement_prompt_ok_event?: string,
	purchase_requirement_prompt_ok_text?: string,
	purchase_requirement_prompt_text?: string,
	perfect_world_explicit_whitelist?: number,
	recycle_recipes?: {
		[recipe_tier: string]: number,
	},
	equip_all_items_in_set?: number,
	shards_purchase_price?: number,
	default_drop_quantity?: number,
	hide_quantity?: number,
	purchase_limited_quantity?: number,
	shards_purchase_requires_subscription?: number,
	set_parent_skin?: number,
	preview_override_def_index?: number,
	can_consume_all?: number,
	use_treasure_detail_highlight?: number,
}

interface ItemsGameItemSet {
	[items: string]: string,
}

interface ItemsGameAttribute {
	name: string,
	attribute_class: string,
	attribute_type?: string,
	storage_type: string,
	hidden?: number,
	description_string?: string,
	description_format?: string,
	effect_type?: string,
	stored_as_integer?: number,
}

interface ItemsGameAttributeControlledAttachedParticleControlPoint {
	control_point_index: number,
	attach_type: string,
	attachment?: string,
	position?: string,
	attach_entity?: string,
}

interface ItemsGameAttributeControlledAttachedParticle {
	system: string,
	attach_type?: string,
	attach_entity?: string,
	control_points: {
		[control_point: number]: ItemsGameAttributeControlledAttachedParticleControlPoint,
	},
	resource?: string,
	default_color?: RGBColor,
	flying_courier_effect?: number,
	ground_courier_effect?: number,
	radiant_only_effect?: number,
	dire_only_effect?: number,
}

interface ItemsGameLoot {
	[loot_name: string]: number,
}

interface ItemsGameKillEaterScoreType {
	type_name: string,
	image?: string,
	in_game_display_interval?: number,
	in_game_display_all_teams?: number,
	required_hero?: string,
	works_in_turbo_mode?: number,
	gives_normal_credit_in_turbo_mode?: number,
	obsolete?: number,
	allow_count_reset?: number,
	use_bitmap_instead_of_increment?: number,
	requires_win?: number,
	hidden?: number,
	use_max_instead_of_increment?: number,
	challenge_instance?: string,
}

interface ItemsGameAssetModifierAsset {
	type: string,
	asset: string,
	modifier: string,
	apply_when_equipped_in_ability_effects_slot?: number,
}

interface ItemsGameAssetModifier {
	[asset_modifier: number | string | "name" | "loc_key" | "file"]: ItemsGameAssetModifierAsset | string | undefined,
}

interface ItemsGamePartnerTeam {
	name: string,
	icon_path?: string,
	in_game_item_def?: number,
	image_banner?: string,
	small_icon?: string,
}

interface ItemsGamePartnerCorporation {
	name: string,
	icon_path: string,
	image_banner?: string,
}

interface ItemsGameItemAutographLevel {
	icon_path: string,
	name_modifier: string,
}

interface ItemsGameItemAutograph {
	name: string | number,
	autograph: string | number,
	workshoplink?: number,
	language: number,
	icon_path?: string,
	filename_override?: number,
	name_modifier?: string,
	levels?: {
		[level: number]: ItemsGameItemAutographLevel,
	},
	event_id?: number,
}

interface ItemsGameKV {
	items_game: {
		game_info: ItemsGameGameInfo,
		store_currency_pricepoints: {
			[currency_id: number]: ItemsGameStoreCurrencyPricePoint,
		},
		rarities: {
			[rarity_name: string]: ItemsGameRarity,
		},
		qualities: {
			[quality_name: string]: ItemsGameQuality,
		},
		colors: {
			[color_name: string]: ItemsGameColor,
		},
		player_loadout_slots: {
			[loadout_id: number]: string,
		},
		code_referenced_icons: {
			[icon_path: string | "icon_path"]: string,
		},
		prefabs: {
			[prefab_name: string]: ItemsGamePrefab,
		},
		items: {
			[item_id: number]: ItemsGameItem,
		},
		item_sets: {
			[item_name: string]: ItemsGameItemSet,
		},
		attributes: {
			[attribute_id: number]: ItemsGameAttribute,
		},
		attribute_controlled_attached_particles: {
			[item_id: number]: ItemsGameAttributeControlledAttachedParticle
		},
		loot_lists: {
			[loot_id: number]: ItemsGameLoot,
		},
		kill_eater_score_types: {
			[kill_eater_score_type_id: number]: ItemsGameKillEaterScoreType,
		},
		asset_modifiers: {
			[asset_modifier_id: number]: ItemsGameAssetModifier,
		},
		partners: {
			teams: {
				[team_id: number]: ItemsGamePartnerTeam,
			},
			corporations: {
				[corporation_id: number]: ItemsGamePartnerCorporation,
			},
		},
		items_autographs: {
			[item_autograph_id: number]: ItemsGameItemAutograph,
		},
	},
}