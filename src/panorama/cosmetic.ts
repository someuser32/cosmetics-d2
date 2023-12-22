interface EquippedItems {
	[slot_name : string] : number
}

function GetLocalHeroName(): string {
	return Game.GetLocalPlayerInfo()["player_selected_hero"];
}

function GetItemIcon(itemEntityIndex: ItemEntityIndex): string {
	const texture_sf = Items.GetAbilityTextureSF(itemEntityIndex);
	return texture_sf != "" ? texture_sf : Abilities.GetAbilityTextureName(itemEntityIndex).substring("item_".length);
}

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
		const item_icon = GetItemIcon(item);

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
		this.SlotsLoad();
	}

	public ToggleCosmetics(): void {
		$("#CosmeticsContent").style["height"] = `${($("#CosmeticsPanel").actuallayoutheight - $("#CosmeticsOpen").actuallayoutheight) * Hud.GetResolutionRatio()}px`;
		$.GetContextPanel().ToggleClass("open");
	}

	public GetSelectedSlot(): string | undefined {
		for (let i=0; i<$("#Slots").GetChildCount(); i++) {
			const child = $("#Slots").GetChild(i)!;
			if (child.BHasClass("Active")) {
				return child.GetAttributeString("name", "");
			}
		}
	}

	public SelectSlot(slot_name: string): void {
		for (let i=0; i<$("#Slots").GetChildCount(); i++) {
			const child = $("#Slots").GetChild(i)!;
			child.SetHasClass("Active", child.GetAttributeString("name", "") == slot_name);
		}
		this.ItemsLoad();
	}

	public GetSlotForItem(item_id: number): string | undefined {
		if (this.slots_server == undefined || this.items_server == undefined) {
			return undefined;
		}
		for (const slot_name of Object.keys(this.slots_server)) {
			if (this.items_server[slot_name][item_id] != undefined) {
				return slot_name;
			}
		}
		return undefined;
	}

	public GetEquippedItem(slot_name: string): number | undefined {
		if (this.equipped_items_server == undefined) {
			return undefined;
		}
		if (this.equipped_items_server[slot_name] == undefined) {
			if (this.items_server == undefined || this.items_server[slot_name] == undefined) {
				return undefined;
			}
			const item_ids = Object.keys(this.items_server[slot_name]);
			for (let i=0; i<item_ids.length; i++) {
				const item_id = item_ids[i];
				const item = this.items_server[slot_name][item_id];
				if (item["type"] == "default_item" && item["slot"] == slot_name) {
					return parseInt(item_id);
				} else if (item["type"] == "bundle" && item["slot"] == slot_name && this.slots_server != undefined && item["bundle"] != undefined) {
					const bundle_slots = Object.keys(this.slots_server).filter((slot) => (Object.values(item["bundle"]!).some((item_id) => (this.items_server![slot] != undefined && this.items_server![slot][item_id] != undefined))));
					const is_equipped = Object.keys(this.slots_server).every((slot) => {
						if (slot == slot_name || this.items_server![slot] == undefined) {
							return true;
						}
						const equipped_item = this.GetEquippedItem(slot);
						if (equipped_item == undefined || this.items_server![slot][equipped_item] == undefined) {
							return false;
						}
						if (bundle_slots.includes(slot)) {
							return Object.values(item["bundle"]!).includes(equipped_item);
						}
						return this.items_server![slot][equipped_item]["type"] == "default_item";
					});
					if (is_equipped) {
						return parseInt(item_id);
					}
				}
			}
		} else {
			return this.equipped_items_server[slot_name]["item"];
		}
		return undefined;
	}

	public GetEquippedItemStyle(slot_name: string): number {
		const equipped_item_id = this.GetEquippedItem(slot_name);
		if (equipped_item_id == undefined) {
			return 1;
		}
		const equipped_item = this.items_server![slot_name][equipped_item_id];
		if (equipped_item["type"] == "bundle" && equipped_item["bundle"] != undefined && this.slots_server != undefined) {
			const bundle_styles = Object.values(equipped_item["bundle"]!).map((item_id) => (this.GetSlotForItem(item_id))).filter((slot) => (slot != undefined)).map((slot) => (this.GetEquippedItemStyle(slot!)));
			return ArrayUtils.mostElement(bundle_styles) ?? 1;
		}
		return this.equipped_items_server != undefined && this.equipped_items_server[slot_name] != undefined ? this.equipped_items_server[slot_name]["style"] : 1;
	}

	public GetEquippedItems(): EquippedItems {
		const valid_items : EquippedItems = {};
		const default_slots : string[] = [];
		if (this.slots_server != undefined) {
			for (let i=0; i<Object.keys(this.slots_server).length; i++) {
				const [slot_name, slot_info] = [Object.keys(this.slots_server)[i], Object.values(this.slots_server)[i]];
				if (slot_info["visible"] != 1) {
					continue;
				}
				if (this.equipped_items_server != undefined && this.equipped_items_server[slot_name] != undefined) {
					valid_items[slot_name] = this.equipped_items_server[slot_name]["item"];
				} else {
					default_slots.push(slot_name);
				}
			}
		}
		if (default_slots.length > 0 && this.items_server != undefined) {
			for (let i=0; i<default_slots.length; i++) {
				const equipped_item = this.GetEquippedItem(default_slots[i]);
				if (equipped_item != undefined) {
					valid_items[default_slots[i]] = equipped_item;
				}
			}
		}
		return valid_items;
	}

	public SlotsLoad(data?: NetworkedData<CustomNetTableDeclarations["cosmetic"][keyof CustomNetTableDeclarations["cosmetic"]]> | null): void {
		data = data ?? CustomNetTables.GetTableValue("cosmetic", `slots_${GetLocalHeroName()}`);
		if (data == null) {
			return;
		}
		this.slots_server = ObjectUtils.fromEntries(Object.entries(Object.assign({"bundle": {"index": -1, "text": "#DOTA_HeroLoadout_FullSets", "visible": 1}}, data as Object)).filter(([slot_name, slot_info]) => {
			return !slot_name.startsWith("ability_effects_");
		}).sort(([slot_name_a, slot_info_a], [slot_name_b, slot_info_b]) => {
			return slot_info_a["index"] - slot_info_b["index"];
		})) as CosmeticSlots;
		$("#Slots").RemoveAndDeleteChildren();
		for (let i=0; i<Object.keys(this.slots_server).length; i++) {
			const [slot_name, slot_info] = [Object.keys(this.slots_server)[i], Object.values(this.slots_server)[i]];
			if (slot_info["visible"] != 1) {
				continue;
			}
			const panel = $.CreatePanel("Button", $("#Slots"), `Slot${slot_name}`, {"hittest": "true"});
			panel.BLoadLayoutSnippet("Slot");
			panel.SetAttributeString("name", slot_name);
			(panel.FindChildTraverse("SlotName") as LabelPanel).text = $.Localize(slot_info["text"]);
			panel.SetPanelEvent("onactivate", () => this.SelectSlot(slot_name));
		}
		this.ItemsLoad();
	}

	public ItemsLoad(data?: CosmeticHeroItems): void {
		data = data ?? this.items_server;
		if (data == undefined) {
			return;
		}
		$("#Items").RemoveAndDeleteChildren();
		const slot = this.GetSelectedSlot();
		if (slot == undefined || data[slot] == undefined) {
			return;
		}
		const item_ids = Object.keys(data[slot]);
		for (let i=0; i<item_ids.length; i++) {
			const item_id = parseInt(item_ids[i]);
			const item = data[slot][item_id.toString()];
			const panel = $.CreatePanel("Button", $("#Items"), `Item${item_id}`, {"hittest": "false"});
			panel.BLoadLayoutSnippet("Item");
			panel.SetAttributeInt("item_id", item_id);
			panel.SetHasClass("Owned", item["avaiable"] == 1);
			panel.SetHasClass("Equipped", this.GetEquippedItem(item["slot"]) == item_id);
			panel.SetHasClass("MultiStyles", item["styles"] > 1);
			for (let j=0; j<this.rarities.length; j++) {
				panel.SetHasClass(`Rarity_${this.rarities[j]}`, item["rarity"] == this.rarities[j]);
			}
			const ItemInfoPanel = panel.FindChildTraverse("ItemInfo")!;
			if (panel.BHasClass("Equipped")) {
				(ItemInfoPanel.FindChildTraverse("Status") as LabelPanel).text = "EQUIPPED";
			} else if (panel.BHasClass("Owned")) {
				(ItemInfoPanel.FindChildTraverse("Status") as LabelPanel).text = "OWNED";
			}
			if (item["styles"] > 1) {
				const selected_style = this.GetEquippedItemStyle(slot);
				for (let i=1; i<=item["styles"]; i++) {
					$.CreatePanel("RadioButton", ItemInfoPanel.FindChildTraverse("StylesSelector")!, `${i}`, {"class": "Style", "group": "style", "selected": i==selected_style, "hittest": "true"});
				}
			}
			(panel.FindChildTraverse("Icon") as ImagePanel).SetImage(`s2r://panorama/images/${item["icon"]}_png.vtex`);
			(ItemInfoPanel.FindChildTraverse("Name") as LabelPanel).text = $.Localize(item["name"]);
			ItemInfoPanel.FindChildTraverse("Equip")!.SetPanelEvent("onactivate", () => {
				const styles = ItemInfoPanel.FindChildTraverse("StylesSelector")!;
				const selected = styles.GetChildCount() > 0 ? (styles.GetChild(0) as RadioButton).GetSelectedButton() || 1 : 1;
				GameEvents.SendCustomGameEventToServer("cosmetic_equip_item", {"item": item_id, "style": typeof(selected) != "number" ? parseInt(selected.id): selected});
			});
			ItemInfoPanel.FindChildTraverse("StylesSelector")!.SetPanelEvent("onactivate", () => {
				const selected = (ItemInfoPanel.FindChildTraverse("StylesSelector")!.GetChild(0) as RadioButton).GetSelectedButton();
				GameEvents.SendCustomGameEventToServer("cosmetic_equip_item", {"item": item_id, "style": parseInt(selected.id)});
			});
			panel.FindChildTraverse("TooltipTrigger")!.SetPanelEvent("onmouseover", () => {
				$.DispatchEvent("DOTAShowEconItemTooltip", panel, item_id, 0, -1);
			});
			panel.FindChildTraverse("TooltipTrigger")!.SetPanelEvent("onmouseout", () => {
				$.DispatchEvent("DOTAHideEconItemTooltip", panel);
			});
		}
	}

	public SlotsUpdate(): void {
		if (this.equipped_items_server == undefined || this.items_server == undefined) {
			return;
		}
		const equipped_items = this.GetEquippedItems();
		for (let i=0; i<$("#Slots").GetChildCount(); i++) {
			const child = $("#Slots").GetChild(i)!;
			const slot = child.GetAttributeString("name", "");
			const equipped_item_id = equipped_items[slot];
			if (equipped_item_id != undefined) {
				const equipped_item = this.items_server[slot][equipped_item_id];
				if (equipped_item != undefined) {
					(child.FindChildTraverse("Econ")!.FindChildTraverse("Icon") as ImagePanel).SetImage(`s2r://panorama/images/${equipped_item["icon"]}_png.vtex`);
					child.SetHasClass("NotDefault", equipped_item["type"] != "default_item");
					child.SetHasClass("MultiStyles", equipped_item["styles"] > 1);
					for (let j=0; j<this.rarities.length; j++) {
						child.SetHasClass(`Rarity_${this.rarities[j]}`, equipped_item["rarity"] == this.rarities[j]);
					}
					const selected_style = this.GetEquippedItemStyle(slot);
					(child.FindChildTraverse("Econ")!.FindChildTraverse("MultiStyle")!.FindChildTraverse("Selected") as LabelPanel).text = `${selected_style}/${equipped_item["styles"]}`;
				}
			} else {
				(child.FindChildTraverse("Econ")!.FindChildTraverse("Icon") as ImagePanel).SetImage("s2r://panorama/images/econ/default_no_item_png.vtex");
				child.SetHasClass("NotDefault", false);
				child.SetHasClass("MultiStyles", false);
				for (let j=0; j<this.rarities.length; j++) {
					child.SetHasClass(`Rarity_${this.rarities[j]}`, false);
				}
			}
		}
	}

	public ItemsUpdate(): void {
		const slot = this.GetSelectedSlot();
		if (slot == undefined) {
			return;
		}
		const equipped_items = this.GetEquippedItems();
		const equipped_item_id = equipped_items[slot];
		for (let i=0; i<$("#Items").GetChildCount(); i++) {
			const child = $("#Items").GetChild(i)!;
			const item_id = child.GetAttributeInt("item_id", -1);
			if (item_id == -1) {continue;};
			child.SetHasClass("Equipped", item_id == equipped_item_id);
		}
	}

	private CosmeticNetTableListener(tableName: string, keyName: string | number, data: NetworkedData<CustomNetTableDeclarations["cosmetic"][keyof CustomNetTableDeclarations["cosmetic"]]>): void {
		if (typeof keyName == "string" && keyName.startsWith("slots_")) {
			if (keyName == `slots_${GetLocalHeroName()}`) {
				this.SlotsLoad(data);
			}
		}
	}

	private CosmeticRespondItemsEvent(event: NetworkedData<CustomGameEventDeclarations["cosmetic_respond_items"]>) {
		if (Object.keys(event["items"]).length == 0) {
			$.Schedule(0.1, () => {GameEvents.SendCustomGameEventToServer("cosmetic_request_items", {})});
			return;
		}
		this.items_server = event["items"];
		this.ItemsLoad(event["items"]);
		GameEvents.SendCustomGameEventToServer("cosmetic_request_equipped_items", {});
	}

	private CosmeticRespondEquippedItemsEvent(event: NetworkedData<CustomGameEventDeclarations["cosmetic_respond_equipped_items"]>) {
		this.equipped_items_server = event["items"];
		this.SlotsUpdate();
		this.ItemsUpdate();
	}
}

const cosmetic_replacer = new CosmeticReplacer();

const cosmetic = new Cosmetic();