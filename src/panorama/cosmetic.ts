interface EquippedItems {
	[slot_name : string] : number
}

function GetLocalHeroName(): string {
	return Game.GetLocalPlayerInfo()["player_selected_hero"];
}

const rarities : string[] = ["common", "uncommon", "rare", "mythical", "legendary", "immortal", "ancient", "arcana", "seasonal"];

let slots_server : CosmeticSlots | undefined;
let items_server : CosmeticHeroItems | undefined;
let equipped_items_server : CosmeticEquippedItems | undefined;

function ToggleCosmetics(): void {
	$("#CosmeticsContent").style["height"] = `${($("#CosmeticsPanel").actuallayoutheight - $("#CosmeticsOpen").actuallayoutheight) * Hud.GetResolutionRatio()}px`;
	$.GetContextPanel().ToggleClass("open");
}

function SelectSlot(name: string): void {
	for (let i=0; i<$("#Slots").GetChildCount(); i++) {
		const child = $("#Slots").GetChild(i)!;
		child.SetHasClass("Active", child.GetAttributeString("name", "") == name);
	}
	ItemsLoad();
}

function GetSelectedSlot(): string | undefined {
	for (let i=0; i<$("#Slots").GetChildCount(); i++) {
		const child = $("#Slots").GetChild(i)!;
		if (child.BHasClass("Active")) {
			return child.GetAttributeString("name", "");
		}
	}
}

function GetEquippedItem(slot: string): number | undefined {
	if (equipped_items_server == undefined) {
		return undefined;
	}
	if (equipped_items_server[slot] == undefined) {
		if (items_server == undefined || items_server[slot] == undefined) {
			return undefined;
		}
		const item_ids = Object.keys(items_server[slot]);
		for (let i=0; i<item_ids.length; i++) {
			const item_id = item_ids[i];
			const item = items_server[slot][item_id];
			if (item["type"] == "default_item" && item["slot"] == slot) {
				return parseInt(item_id);
			}
		}
	}
	return equipped_items_server[slot]["item"];
}

function GetEquippedItems(): EquippedItems {
	let valid_items : EquippedItems = {};
	let default_slots : string[] = [];
	if (slots_server != undefined) {
		for (let i=0; i<Object.keys(slots_server).length; i++) {
			const [slot_name, slot_info] = [Object.keys(slots_server)[i], Object.values(slots_server)[i]];
			if (slot_info["visible"] != 1) {
				continue;
			}
			if (equipped_items_server != undefined && equipped_items_server[slot_name] != undefined) {
				valid_items[slot_name] = equipped_items_server[slot_name]["item"];
			} else {
				default_slots.push(slot_name);
			}
		}
	}
	if (default_slots.length > 0 && items_server != undefined) {
		for (let i=0; i<default_slots.length; i++) {
			const equipped_item = GetEquippedItem(default_slots[i]);
			if (equipped_item != undefined) {
				valid_items[default_slots[i]] = equipped_item;
			}
		}
	}
	return valid_items;
}

function SlotsLoad(data?: NetworkedData<CustomNetTableDeclarations["cosmetic"][keyof CustomNetTableDeclarations["cosmetic"]]> | null): void {
	data = data ?? CustomNetTables.GetTableValue("cosmetic", `slots_${GetLocalHeroName()}`);
	if (data == null) {
		return;
	}
	slots_server = ObjectUtils.fromEntries(Object.entries(data as Object).filter(([slot_name, slot_info]) => {
		return !slot_name.startsWith("ability_effects_");
	}).sort(([slot_name_a, slot_info_a], [slot_name_b, slot_info_b]) => {
		return slot_info_a["index"] - slot_info_b["index"];
	})) as CosmeticSlots;
	$("#Slots").RemoveAndDeleteChildren();
	for (let i=0; i<Object.keys(slots_server).length; i++) {
		const [slot_name, slot_info] = [Object.keys(slots_server)[i], Object.values(slots_server)[i]];
		if (slot_info["visible"] != 1) {
			continue;
		}
		const panel = $.CreatePanel("Button", $("#Slots"), `Slot${slot_name}`, {hittest: "true"});
		panel.BLoadLayoutSnippet("Slot");
		panel.SetAttributeString("name", slot_name);
		(panel.FindChildTraverse("SlotName") as LabelPanel).text = $.Localize(slot_info["text"]);
		panel.SetPanelEvent("onactivate", () => {
			SelectSlot(slot_name);
		});
	}
}

function ItemsLoad(data?: CosmeticHeroItems): void {
	data = data ?? items_server;
	if (data == undefined) {
		return;
	}
	$("#Items").RemoveAndDeleteChildren();
	const slot = GetSelectedSlot();
	if (slot == undefined) {
		return;
	}
	const item_ids = Object.keys(data[slot]);
	for (let i=0; i<item_ids.length; i++) {
		const item_id = parseInt(item_ids[i]);
		const item = data[slot][item_id.toString()];
		const panel = $.CreatePanel("Button", $("#Items"), `Item${item_id}`, {hittest: "false"});
		panel.BLoadLayoutSnippet("Item");
		panel.SetAttributeInt("item_id", item_id);
		panel.SetHasClass("Owned", item["avaiable"] == 1);
		panel.SetHasClass("Equipped", GetEquippedItem(item["slot"]) == item_id);
		panel.SetHasClass("MultiStyles", item["styles"] > 1);
		for (let j=0; j<rarities.length; j++) {
			panel.SetHasClass(`Rarity_${rarities[j]}`, item["rarity"] == rarities[j]);
		}
		const ItemInfoPanel = panel.FindChildTraverse("ItemInfo")!;
		if (panel.BHasClass("Equipped")) {
			(ItemInfoPanel.FindChildTraverse("Status") as LabelPanel).text = "EQUIPPED";
		} else if (panel.BHasClass("Owned")) {
			(ItemInfoPanel.FindChildTraverse("Status") as LabelPanel).text = "OWNED";
		}
		if (item["styles"] > 1) {
			const selected_style = equipped_items_server != undefined && equipped_items_server[slot] != undefined ? equipped_items_server[slot]["style"] : 1;
			for (let i=1; i<=item["styles"]; i++) {
				$.CreatePanel("RadioButton", ItemInfoPanel.FindChildTraverse("StylesSelector")!, `${i}`, {class: "Style", group: "style", selected: i==selected_style, hittest: "true"});
			}
		}
		(panel.FindChildTraverse("Icon") as ImagePanel).SetImage(`s2r://panorama/images/${item["icon"]}_png.vtex`);
		(ItemInfoPanel.FindChildTraverse("Name") as LabelPanel).text = $.Localize(item["name"]);
		ItemInfoPanel.FindChildTraverse("Equip")!.SetPanelEvent("onactivate", () => {
			const styles = ItemInfoPanel.FindChildTraverse("StylesSelector")!;
			const selected = styles.GetChildCount() > 0 ? (styles.GetChild(0) as RadioButton).GetSelectedButton() || 1 : 0;
			GameEvents.SendCustomGameEventToServer("cosmetic_equip_item", {item: item_id, style: typeof(selected) != "number" ? parseInt(selected.id): selected});
		});
		ItemInfoPanel.FindChildTraverse("StylesSelector")!.SetPanelEvent("onactivate", () => {
			const selected = (ItemInfoPanel.FindChildTraverse("StylesSelector")!.GetChild(0) as RadioButton).GetSelectedButton();
			GameEvents.SendCustomGameEventToServer("cosmetic_equip_item", {item: item_id, style: parseInt(selected.id)});
		});
		panel.FindChildTraverse("TooltipTrigger")!.SetPanelEvent("onmouseover", () => {
			$.DispatchEvent("DOTAShowEconItemTooltip", panel, item_id, 0, -1);
		});
		panel.FindChildTraverse("TooltipTrigger")!.SetPanelEvent("onmouseout", () => {
			$.DispatchEvent("DOTAHideEconItemTooltip", panel);
		});
	}
}

function SlotsUpdate(): void {
	if (equipped_items_server == undefined || items_server == undefined) {
		return;
	}
	const equipped_items = GetEquippedItems();
	for (let i=0; i<$("#Slots").GetChildCount(); i++) {
		const child = $("#Slots").GetChild(i)!;
		const slot = child.GetAttributeString("name", "");
		const equipped_item_id = equipped_items[slot];
		if (equipped_item_id != undefined) {
			const equipped_item = items_server[slot][equipped_item_id];
			if (equipped_item != undefined) {
				(child.FindChildTraverse("Econ")!.FindChildTraverse("Icon") as ImagePanel).SetImage(`s2r://panorama/images/${equipped_item["icon"]}_png.vtex`);
				child.SetHasClass("NotDefault", equipped_item["type"] != "default_item");
				child.SetHasClass("MultiStyles", equipped_item["styles"] > 1);
				for (let j=0; j<rarities.length; j++) {
					child.SetHasClass(`Rarity_${rarities[j]}`, equipped_item["rarity"] == rarities[j]);
				}
				const selected_style = equipped_items_server[slot] != undefined ? equipped_items_server[slot]["style"] : 1;
				(child.FindChildTraverse("Econ")!.FindChildTraverse("MultiStyle")!.FindChildTraverse("Selected") as LabelPanel).text = `${selected_style}/${equipped_item["styles"]}`;
			}
		}
	}
}

function ItemsUpdate(): void {
	const slot = GetSelectedSlot();
	if (slot == undefined) {
		return;
	}
	const equipped_items = GetEquippedItems();
	const equipped_item_id = equipped_items[slot];
	for (let i=0; i<$("#Items").GetChildCount(); i++) {
		const child = $("#Items").GetChild(i)!;
		const item_id = child.GetAttributeInt("item_id", -1);
		if (item_id == -1) {continue;};
		child.SetHasClass("Equipped", item_id == equipped_item_id);
	}
}

function Init() {
	SlotsLoad();
	GameEvents.SendCustomGameEventToServer("cosmetic_request_items", {});
}

CustomNetTables.SubscribeNetTableListener("cosmetic", (tableName, keyName, data) => {
	if (typeof keyName == "string" && keyName.startsWith("slots_")) {
		if (keyName == `slots_${GetLocalHeroName()}`) {
			SlotsLoad(data);
		}
	}
})

GameEvents.Subscribe("cosmetic_respond_items", (event) => {
	if (Object.keys(event["items"]).length == 0) {
		$.Schedule(0.1, () => {GameEvents.SendCustomGameEventToServer("cosmetic_request_items", {})});
		return;
	}
	items_server = event["items"];
	ItemsLoad(event["items"]);
	GameEvents.SendCustomGameEventToServer("cosmetic_request_equipped_items", {});
})

GameEvents.Subscribe("cosmetic_respond_equipped_items", (event) => {
	equipped_items_server = event["items"];
	SlotsUpdate();
	ItemsUpdate();
})

Init();