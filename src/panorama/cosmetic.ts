type Rarity = "common" | "uncommon" | "rare" | "mythical" | "legendary" | "immortal" | "ancient" | "arcana" | "seasonal";

const Rarities : ReadonlyArray<Rarity> = ["common", "uncommon", "rare", "mythical", "legendary", "immortal", "ancient", "arcana", "seasonal"];

class CosmeticReplacer {
	replacements : CustomNetTableDeclarations["cosmetic"]["replacements"] = {};
	replacements_cache : CustomNetTableDeclarations["cosmetic"]["replacements"] = {};

	constructor() {
		CustomNetTables.SubscribeNetTableListener("cosmetic", (tableName, keyName, data) => this.CosmeticNetTableListener(tableName, keyName, data));
		GameEvents.Subscribe("dota_player_update_selected_unit", () => this.OnUpdateSelectedUnit());
    	GameEvents.Subscribe("dota_player_update_query_unit", () => this.OnUpdateQueryUnit());
    	GameEvents.Subscribe("dota_inventory_changed", () => this.OnUpdateInventory());
		this.replacements = CustomNetTables.GetTableValue("cosmetic", "replacements") ?? {};
		this.Update();
	}

	public UpdateTopbarIcon(playerID: PlayerID): void {
		const heroimage = TopbarModule.GetTopbarPlayerImage(playerID) as HeroImage;
		if (heroimage == null) {
			return;
		}

		const key = playerID.toString();
		if ((this.replacements[key] == undefined || this.replacements[key]["hero_icons"] == undefined) && (this.replacements_cache[key] != undefined && this.replacements_cache[key]["hero_icons"] != undefined)) {
			const heroname = heroimage.heroname;
			heroimage.heroname = "null";
			heroimage.heroname = heroname;
		} else if ((this.replacements[key] != undefined && this.replacements[key]["hero_icons"] != undefined) && (this.replacements_cache[key] == undefined || this.replacements_cache[key]["hero_icons"] == undefined)) {
			heroimage.SetImage(`s2r://panorama/images/heroes/${this.replacements[key]["hero_icons"]![`npc_dota_hero_${heroimage.heroname}`]}_png.vtex`);
		}
	}

	public UpdateAbilityPanel(abilitypanel: Panel) {
		const abilityimage = abilitypanel.FindChildTraverse("AbilityImage") as AbilityImage;
		const ability_customimage = abilityimage.FindChildTraverse("CosmeticIcon") as ImagePanel ?? $.CreatePanel("Image", abilityimage, "CosmeticIcon", {"hittest": "false", "style": "visibility: collapse; width: 100%; height: 100%;", "scaling": "contain"});
		const ability = abilityimage.contextEntityIndex;
		const ability_icon = Abilities.GetAbilityTextureName(ability);

		const key = Entities.GetPlayerOwnerID(Abilities.GetCaster(ability)).toString();
		if (this.replacements[key] == undefined || this.replacements[key]["ability_icons"] == undefined || this.replacements[key]["ability_icons"]![ability_icon] == undefined) {
			ability_customimage.visible = false;
		} else if (this.replacements[key] != undefined && this.replacements[key]["ability_icons"] != undefined && this.replacements[key]["ability_icons"]![ability_icon] != undefined) {
			ability_customimage.visible = true;
			ability_customimage.SetImage(`s2r://panorama/images/spellicons/${this.replacements[key]["ability_icons"]![ability_icon]}_png.vtex`);
		}
	}

	public UpdateItemPanel(itempanel: Panel) {
		const itemimage = itempanel.FindChildTraverse("ItemImage") as ItemImage;
		const item_customimage = itemimage.FindChildTraverse("CosmeticIcon") as ImagePanel ?? $.CreatePanel("Image", itemimage, "CosmeticIcon", {"hittest": "false", "style": "visibility: collapse; width: 100%; height: 100%;", "scaling": "contain"});
		const item = itemimage.contextEntityIndex;
		const item_icon = Items.GetAbilityTextureSF(item) || Abilities.GetAbilityTextureName(item).substring("item_".length);

		const owner = item !== -1 ? Items.GetPurchaser(item) ?? Abilities.GetCaster(item) : -1;
		const key = owner !== -1 ? Entities.GetPlayerOwnerID(owner).toString() : "-1";
		if (this.replacements[key] == undefined || this.replacements[key]["item_icons"] == undefined || this.replacements[key]["item_icons"]![item_icon] == undefined) {
			item_customimage.visible = false;
		} else if (this.replacements[key] != undefined && this.replacements[key]["item_icons"] != undefined && this.replacements[key]["item_icons"]![item_icon] != undefined) {
			item_customimage.visible = true;
			item_customimage.SetImage(`s2r://panorama/images/items/${this.replacements[key]["item_icons"]![item_icon]}_png.vtex`);
		}
	}

	public UpdateTopbarIcons(): void {
		for (const playerID of Game.GetAllPlayerIDs()) {
			this.UpdateTopbarIcon(playerID);
		}
	}

	public UpdateAbilityIcons(): void {
		const selected_unit = Players.GetLocalPlayerPortraitUnit();
		if (selected_unit !== -1) {
			const dotahud = Hud.GetDOTAHud();
			const abilities = dotahud.FindChildTraverse("lower_hud")!.FindChildTraverse("AbilitiesAndStatBranch")!.FindChildTraverse("abilities")!;
			const key = Entities.GetPlayerOwnerID(selected_unit).toString();
			for (let i=0; i<abilities.GetChildCount(); i++) {
				this.UpdateAbilityPanel(abilities.GetChild(i)!);
			}
		}
	}

	public UpdateItemIcons(): void {
		const selected_unit = Players.GetLocalPlayerPortraitUnit();
		if (selected_unit !== -1) {
			const dotahud = Hud.GetDOTAHud();
			const items = [];
			const lower_hud = dotahud.FindChildTraverse("lower_hud")!;

			const inventory = lower_hud.FindChildTraverse("center_with_stats")!.FindChildTraverse("inventory")!;

			const inventory_list_container = inventory.FindChildTraverse("inventory_list_container")!;
			for (let i=0; i<inventory_list_container.GetChildCount(); i++) {
				const row = inventory_list_container.GetChild(i)!;
				for (let j=0; j<row.GetChildCount(); j++) {
					const item = row.GetChild(j)!;
					items.push(item);
				}
			}

			const inventory_backpack_list = inventory.FindChildTraverse("inventory_backpack_list")!;
			for (let i=0; i<inventory_backpack_list.GetChildCount(); i++) {
				const item = inventory_backpack_list.GetChild(i)!;
				items.push(item);
			}

			const tp_slot = lower_hud.FindChildTraverse("center_with_stats")!.FindChildTraverse("inventory_tpscroll_container")!.FindChildTraverse("inventory_tpscroll_slot")!;
			items.push(tp_slot);

			const neutral_item = lower_hud.FindChildTraverse("center_with_stats")!.FindChildTraverse("inventory_neutral_slot_container")!.FindChildTraverse("inventory_neutral_slot")!;
			items.push(neutral_item);

			const stash = lower_hud.FindChildTraverse("shop_launcher_block")!.FindChildTraverse("stash")!.FindChildTraverse("stash_row")!;
			for (let i=0; i<stash.GetChildCount(); i++) {
				const item = stash.GetChild(i)!;
				items.push(item);
			}

			for (const itempanel of items) {
				this.UpdateItemPanel(itempanel);
			}
		}
	}

	public UpdateQueryAbilityIcons(): void {
		const query_unit = Players.GetQueryUnit(Players.GetLocalPlayer());
		if (query_unit !== -1) {
			const dotahud = Hud.GetDOTAHud();
			const querypanel = dotahud.FindChildTraverse("QueryUnit")!.FindChildTraverse("QueryContainer")!;
			const abilities = querypanel.FindChildTraverse("abilities");
			if (abilities != null) {
				for (let i=0; i<abilities.GetChildCount(); i++) {
					this.UpdateAbilityPanel(abilities.GetChild(i)!);
				}
			}
		}
	}

	public UpdateQueryItemIcons(): void {
		const query_unit = Players.GetQueryUnit(Players.GetLocalPlayer());
		if (query_unit !== -1) {
			const dotahud = Hud.GetDOTAHud();
			const querypanel = dotahud.FindChildTraverse("QueryUnit")!.FindChildTraverse("QueryContainer")!;
			const inventory = querypanel.FindChildTraverse("inventory_items")!;

			if (inventory != null) {
				const items = [];
				const inventory_list_container = inventory.FindChildTraverse("inventory_list_container")!;
				for (let i=0; i<inventory_list_container.GetChildCount(); i++) {
					const row = inventory_list_container.GetChild(i)!;
					for (let j=0; j<row.GetChildCount(); j++) {
						const item = row.GetChild(j)!;
						items.push(item);
					}
				}

				const inventory_backpack_list = inventory.FindChildTraverse("inventory_backpack_list")!;
				for (let i=0; i<inventory_backpack_list.GetChildCount(); i++) {
					const item = inventory_backpack_list.GetChild(i)!;
					items.push(item);
				}

				for (const itempanel of items) {
					this.UpdateItemPanel(itempanel)
				}
			}
		}
	}

	public UpdateHotbar(): void {
		this.UpdateAbilityIcons();
		this.UpdateItemIcons();
	}

	public UpdateQueryHotbar(): void {
		this.UpdateQueryAbilityIcons();
		this.UpdateQueryItemIcons();
	}

	public Update(): void {
		this.UpdateTopbarIcons();
		this.UpdateHotbar();
		this.UpdateQueryHotbar();
	}

	private CosmeticNetTableListener(tableName: string, keyName: string | number, data: NetworkedData<CustomNetTableDeclarations["cosmetic"][keyof CustomNetTableDeclarations["cosmetic"]]>): void {
		if (keyName == "replacements") {
			this.replacements_cache = Object.assign({}, this.replacements);
			this.replacements = data as CustomNetTableDeclarations["cosmetic"]["replacements"];
			this.Update();
		}
	}

	private OnUpdateSelectedUnit(): void {
		$.Schedule(0.0, () => this.UpdateHotbar());
	}

	private OnUpdateQueryUnit(): void {
		$.Schedule(0.0, () => {
			this.UpdateHotbar();
			return this.UpdateQueryHotbar();
		});
	}

	private OnUpdateInventory(): void {
		$.Schedule(0.0, () => this.UpdateItemIcons());
	}
}


class Slot<SlotName extends keyof CosmeticSlots & string=string> {
	static slots_server? : CosmeticSlots;

	name: SlotName;
	index: CosmeticSlotInfo["index"];
	text: CosmeticSlotInfo["text"];
	visible: boolean;

	constructor(name: SlotName, index: CosmeticSlotInfo["index"], text: CosmeticSlotInfo["text"], visible: boolean=true) {
		this.name = name;
		this.index = index;
		this.text = text;
		this.visible = visible;
	}

	get isCurrent(): boolean {
		const current_slot = Slot.getCurrentSlot();
		return current_slot != undefined ? current_slot.name == this.name : false;
	}

	get equippedItemID(): number | undefined {
		if (Item.equipped_items_server == undefined) {
			return undefined;
		}
		if (Item.equipped_items_server[this.name] == undefined) {
			const slots = Slot.getAll();
			for (const item_id of this.itemsID) {
				const item_info = Item.getInfoFromID(item_id);
				if (item_info == undefined) {
					continue;
				}
				if (item_info["type"] == "default_item") {
					return item_id;
				} else if (item_info["type"] == "bundle" && item_info["bundle"] != undefined) {
					const bundle = Object.values(item_info["bundle"]);
					const bundle_slots = bundle.map((item_id) => {
						const info = Item.getInfoFromID(item_id);
						return info != undefined ? info["slot"] : undefined;
					}).filter((slot_name) => slot_name != undefined);
					if (slots.every((slot) => {
						if (this.name == slot.name || !slot.hasItems) {
							return true;
						}
						const equipped_item_id = slot.equippedItemID;
						if (equipped_item_id == undefined) {
							return false;
						}
						if (!bundle_slots.includes(slot.name)) {
							const info = Item.getInfoFromID(equipped_item_id);
							return info != undefined && info["type"] == "default_item";
						}
						return bundle.includes(equipped_item_id);
					})) {
						return item_id;
					}
				}
			}
		} else {
			return Item.equipped_items_server[this.name]["item"];
		}
		return undefined;
	}

	get equippedItem(): Item | undefined {
		const equipped_item_id = this.equippedItemID;
		return equipped_item_id != undefined ? Item.fromID(equipped_item_id, this) : undefined;
	}

	get itemsID(): number[] {
		if (Item.items_server == undefined || Item.items_server[this.name] == undefined) {
			return [];
		}
		return Object.keys(Item.items_server[this.name]).map((item_id) => (parseInt(item_id)));
	}

	get items(): Item[] {
		return this.itemsID.map((item_id) => (Item.fromID(item_id, this))).filter((item) => (item != undefined)) as Item[];
	}

	get hasItems(): boolean {
		return Item.items_server != undefined && Item.items_server[this.name] != undefined && Object.keys(Item.items_server[this.name]).length > 0;
	}

	public setCurrent(): void {
		return Slot.setCurrentSlot(this.name);
	}

	static fromName<SlotName extends keyof CosmeticSlots & string>(name: SlotName): Slot;
	static fromName(name: string): Slot | undefined {
		if (Slot.slots_server == undefined)  {
			return undefined;
		}
		const slot_info = Slot.slots_server[name];
		if (slot_info == undefined) {
			return undefined;
		}
		return new Slot(name, slot_info["index"], slot_info["text"], slot_info["visible"] == 1);
	}

	static getAll(): Slot[] {
		if (Slot.slots_server == undefined)  {
			return [];
		}
		return Object.keys(Slot.slots_server).map((slot_name) => Slot.fromName(slot_name)).sort((slot_a, slot_b) => slot_a.index - slot_b.index);
	}

	static getCurrentSlot(): Slot | undefined {
		for (let i=0; i<$("#Slots").GetChildCount(); i++) {
			const child = $("#Slots").GetChild(i)!;
			if (child.BHasClass("Active")) {
				return Slot.fromName(child.GetAttributeString("name", ""));
			}
		}
		return undefined;
	}

	static setCurrentSlot<SlotName extends keyof CosmeticSlots & string>(name: SlotName): void {
		for (let i=0; i<$("#Slots").GetChildCount(); i++) {
			const child = $("#Slots").GetChild(i)!;
			child.SetHasClass("Active", child.GetAttributeString("name", "") == name);
		}
		Item.Load();
	}

	static Load(data?: NetworkedData<CustomNetTableDeclarations["cosmetic"][keyof CustomNetTableDeclarations["cosmetic"]]> | null): boolean {
		data = data ?? CustomNetTables.GetTableValue("cosmetic", `slots_${Game.GetLocalPlayerInfo()["player_selected_hero"]}`);
		if (data == null) {
			return false;
		}
		const default_slots = {"bundle": {"index": -1, "text": "#DOTA_HeroLoadout_FullSets", "visible": 1}} as CosmeticSlots;
		Slot.slots_server = ObjectUtils.fromEntries(Object.entries(Object.assign(default_slots, data as Object)).filter(([slot_name, slot_info]) => {
			return !slot_name.startsWith("ability_effects_");
		})) as CosmeticSlots;
		$("#Slots").RemoveAndDeleteChildren();
		for (const slot of Slot.getAll()) {
			if (!slot.visible) {
				continue;
			}
			const slot_panel = $.CreatePanel("Button", $("#Slots"), `Slot${slot.name}`, {"hittest": "true"});
			slot_panel.BLoadLayoutSnippet("Slot");
			slot_panel.SetAttributeString("name", slot.name);
			(slot_panel.FindChildTraverse("SlotName") as LabelPanel).text = $.Localize(slot.text);
			slot_panel.SetPanelEvent("onactivate", () => slot.setCurrent());
		}
		Item.Load();
		return true;
	}

	static Update() {
		for (let i=0; i<$("#Slots").GetChildCount(); i++) {
			const child = $("#Slots").GetChild(i)!;
			const slot = Slot.fromName(child.GetAttributeString("name", ""));
			const item = slot != undefined ? slot.equippedItem : undefined;
			if (slot != undefined && item != undefined) {
				(child.FindChildTraverse("Econ")!.FindChildTraverse("Icon") as ImagePanel).SetImage(`s2r://panorama/images/${item.icon}_png.vtex`);
				child.SetHasClass("NotDefault", item.type != "default_item");
				child.SetHasClass("MultiStyles", item.styles > 1);
				for (const rarity of Rarities) {
					child.SetHasClass(`Rarity_${rarity}`, item.rarity == rarity);
				}
				(child.FindChildTraverse("Econ")!.FindChildTraverse("MultiStyle")!.FindChildTraverse("Selected") as LabelPanel).text = `${item.style}/${item.styles}`;
			} else {
				(child.FindChildTraverse("Econ")!.FindChildTraverse("Icon") as ImagePanel).SetImage("s2r://panorama/images/econ/default_no_item_png.vtex");
				child.SetHasClass("NotDefault", false);
				child.SetHasClass("MultiStyles", false);
				for (const rarity of Rarities) {
					child.SetHasClass(`Rarity_${rarity}`, false);
				}
			}
		}
	}
}


class Item<SlotName extends keyof CosmeticSlots & string=string> {
	static items_server? : CosmeticHeroItems;
	static items_server_cache? : CosmeticHeroItems[keyof CosmeticHeroItems];
	static equipped_items_server? : CosmeticEquippedItems;

	id: number;
	slot: Slot;

	constructor(id: number, slot: Slot | SlotName) {
		this.id = id;
		this.slot = slot instanceof Slot ? slot : Slot.fromName(slot);
	}

	get name(): CosmeticHeroItem["name"] {
		return Item.items_server![this.slot.name][this.id]["name"];
	}

	get icon(): CosmeticHeroItem["icon"] {
		return Item.items_server![this.slot.name][this.id]["icon"];
	}

	get rarity(): Rarity {
		return Item.items_server![this.slot.name][this.id]["rarity"] as Rarity;
	}

	get styles(): CosmeticHeroItem["styles"] {
		return Item.items_server![this.slot.name][this.id]["styles"];
	}

	get type(): CosmeticHeroItem["type"] {
		return Item.items_server![this.slot.name][this.id]["type"];
	}

	get avaiable(): boolean {
		return Item.items_server![this.slot.name][this.id]["avaiable"] == 1;
	}

	get bundle(): number[] | undefined {
		const bundle = Item.items_server![this.slot.name][this.id]["bundle"];
		return bundle != undefined ? Object.values(bundle) : undefined;
	}

	get bundle_items(): Item[] | undefined {
		const bundle = this.bundle;
		return bundle != undefined ? bundle.map((item_id) => (Item.fromID(item_id))).filter((item) => item != undefined) as Item[] : undefined;
	}

	get equipped(): boolean {
		return this.slot.equippedItemID == this.id;
	}

	get style(): number {
		if (this.type == "bundle" && this.bundle != undefined) {
			return ArrayUtils.mostElement(this.bundle_items!.map((item) => item.style)) ?? 1;
		}
		return Item.equipped_items_server != undefined && Item.equipped_items_server[this.slot.name] != undefined ? Item.equipped_items_server[this.slot.name]["style"] : 1;
	}

	public equip(style: number=1): void {
		return GameEvents.SendCustomGameEventToServer("cosmetic_equip_item", {"item": this.id, "style": style});
	}

	static fromID(id: number, slot: Slot | undefined = undefined): Item | undefined {
		if (id === -1) {
			return undefined;
		}
		if (Item.items_server_cache == undefined) {
			return undefined;
		}
		if (slot != undefined) {
			return new Item(id, slot);
		}
		const item_info = Item.items_server_cache[id];
		if (item_info != undefined) {
			return new Item(id, item_info["slot"]);
		}
	}

	static getInfoFromID(id: number): CosmeticHeroItem | undefined {
		if (Item.items_server_cache == undefined) {
			return undefined;
		}
		return Item.items_server_cache[id];
	}

	static getAll(): Item[] {
		if (Item.items_server == undefined) {
			return [];
		}
		return ArrayUtils.unzip(Object.entries(Item.items_server).map(([slot_name, items]) => {
			const slot = Slot.fromName(slot_name);
			return Object.keys(items).map((item_id) => (Item.fromID(parseInt(item_id), slot))).filter((item) => (item != undefined));
		})) as Item[];
	}

	static getEquippedItems(): Item[] {
		return Slot.getAll().filter((slot) => (slot.visible)).map((slot) => (slot.equippedItem)).filter((item) => (item != undefined)) as Item[];
	}

	static Load(): boolean {
		$("#Items").RemoveAndDeleteChildren();
		const slot = Slot.getCurrentSlot();
		if (slot == undefined) {
			return false;
		}
		const items = Item.getAll();
		const equipped_item_id = slot.equippedItemID;
		for (const item of items) {
			if (item.slot.name != slot.name) {
				continue;
			}
			const item_panel = $.CreatePanel("Button", $("#Items"), `Item${item.id}`, {"hittest": "false"});
			item_panel.BLoadLayoutSnippet("Item");
			item_panel.SetAttributeInt("item_id", item.id);
			item_panel.SetHasClass("Owned", item.avaiable);
			item_panel.SetHasClass("Equipped", item.id == equipped_item_id);
			item_panel.SetHasClass("MultiStyles", item.styles > 1);
			for (const rarity of Rarities) {
				item_panel.SetHasClass(`Rarity_${rarity}`, item.rarity == rarity);
			}
			(item_panel.FindChildTraverse("Icon") as ImagePanel).SetImage(`s2r://panorama/images/${item.icon}_png.vtex`);
			const item_info_panel = item_panel.FindChildTraverse("ItemInfo")!;
			(item_info_panel.FindChildTraverse("Name") as LabelPanel).text = $.Localize(item.name);
			(item_info_panel.FindChildTraverse("Status") as LabelPanel).text = item_panel.BHasClass("Equipped") ? "EQUIPPED" : "OWNED";
			if (item.styles > 1) {
				const selected_style = item.style;
				for (let i=1; i<=item.styles; i++) {
					$.CreatePanel("RadioButton", item_info_panel.FindChildTraverse("StylesSelector")!, `${i}`, {"class": "Style", "group": "style", "selected": i==selected_style, "hittest": "true"});
				}
			}
			item_info_panel.FindChildTraverse("Equip")!.SetPanelEvent("onactivate", () => {
				const styles = item_info_panel.FindChildTraverse("StylesSelector")!;
				const selected_style = styles.GetChildCount() > 0 ? (styles.GetChild(0) as RadioButton).GetSelectedButton() ?? 1 : 1;
				item.equip(typeof(selected_style) != "number" ? parseInt(selected_style.id): selected_style);
			});
			item_info_panel.FindChildTraverse("StylesSelector")!.SetPanelEvent("onactivate", () => {
				const selected_style = parseInt((item_info_panel.FindChildTraverse("StylesSelector")!.GetChild(0) as RadioButton).GetSelectedButton().id);
				item.equip(selected_style);
			});
			item_panel.FindChildTraverse("TooltipTrigger")!.SetPanelEvent("onmouseover", () => ($.DispatchEvent("DOTAShowEconItemTooltip", item_panel, item.id, 0, -1)));
			item_panel.FindChildTraverse("TooltipTrigger")!.SetPanelEvent("onmouseout", () => ($.DispatchEvent("DOTAHideEconItemTooltip", item_panel)));
		}
		return true;
	}

	static Update(): void {
		for (let i=0; i<$("#Items").GetChildCount(); i++) {
			const child = $("#Items").GetChild(i)!;
			const item = Item.fromID(child.GetAttributeInt("item_id", -1));
			if (item == undefined) {
				continue;
			}
			child.SetHasClass("Equipped", item.equipped);
		}
	}
}

class Cosmetic {
	slots_server? : CosmeticSlots
	items_server? : CosmeticHeroItems
	equipped_items_server? : CosmeticEquippedItems
	rarities = ["common", "uncommon", "rare", "mythical", "legendary", "immortal", "ancient", "arcana", "seasonal"];

	constructor() {
		CustomNetTables.SubscribeNetTableListener("cosmetic", (tableName, keyName, data) => this.CosmeticNetTableListener(tableName, keyName, data));
		GameEvents.Subscribe("cosmetic_respond_items", (event) => this.CosmeticRespondItemsEvent(event));
		GameEvents.Subscribe("cosmetic_respond_equipped_items", (event) => this.CosmeticRespondEquippedItemsEvent(event));
		GameEvents.SendCustomGameEventToServer("cosmetic_request_items", {});
		Slot.Load();
	}

	public ToggleCosmetics(): void {
		$("#CosmeticsContent").style["height"] = `${($("#CosmeticsPanel").actuallayoutheight - $("#CosmeticsOpen").actuallayoutheight) * Hud.GetResolutionRatio()}px`;
		$.GetContextPanel().ToggleClass("open");
	}

	private CosmeticNetTableListener(tableName: string, keyName: string | number, data: NetworkedData<CustomNetTableDeclarations["cosmetic"][keyof CustomNetTableDeclarations["cosmetic"]]>): void {
		if (typeof keyName == "string" && keyName.startsWith("slots_")) {
			if (keyName == `slots_${Game.GetLocalPlayerInfo()["player_selected_hero"]}`) {
				Slot.Load(data);
			}
		}
	}

	private CosmeticRespondItemsEvent(event: NetworkedData<CustomGameEventDeclarations["cosmetic_respond_items"]>) {
		if (Object.keys(event["items"]).length == 0) {
			$.Schedule(0.1, () => {GameEvents.SendCustomGameEventToServer("cosmetic_request_items", {})});
			return;
		}
		Item.items_server = event["items"];
		Item.items_server_cache = {};
		for (const [slot_name, items] of Object.entries(Item.items_server)) {
			for (const [item_id, item_info] of Object.entries(items)) {
				Item.items_server_cache[parseInt(item_id)] = item_info;
			}
		}
		Item.Load();
		GameEvents.SendCustomGameEventToServer("cosmetic_request_equipped_items", {});
	}

	private CosmeticRespondEquippedItemsEvent(event: NetworkedData<CustomGameEventDeclarations["cosmetic_respond_equipped_items"]>) {
		Item.equipped_items_server = event["items"];
		Slot.Update();
		Item.Update();
	}
}

const cosmetic_replacer = new CosmeticReplacer();

const cosmetic = new Cosmetic();