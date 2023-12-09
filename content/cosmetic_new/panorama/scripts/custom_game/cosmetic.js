/**
 * @param {Array} iterable
 * @returns {Object}
 */
Object.fromEntries = function(iterable) {
	return [...iterable].reduce((obj, [key, val]) => {
		obj[key] = val;
		return obj;
	}, {});
}

function GetLocalHeroName() {
	return Game.GetLocalPlayerInfo()["player_selected_hero"];
};

const rarities = ["common", "uncommon", "rare", "mythical", "legendary", "immortal", "ancient", "arcana", "seasonal"];

let slots_lua = undefined;
let items_lua = undefined;
let equipped_items_lua = undefined;

function ToggleCosmetics() {
	$('#CosmeticsContent').style['height'] = `${($('#CosmeticsPanel').actuallayoutheight - $('#CosmeticsOpen').actuallayoutheight) * (1080 / Game.GetScreenHeight())}px`;
	$.GetContextPanel().ToggleClass("open");
};

function SelectSlot(name) {
	for (let i=0; i<$("#Slots").GetChildCount(); i++) {
		const child = $("#Slots").GetChild(i);
		child.SetHasClass("Active", child.GetAttributeString("name", "") == name);
	};
	ItemsLoad();
};

function GetSelectedSlot() {
	for (let i=0; i<$("#Slots").GetChildCount(); i++) {
		const child = $("#Slots").GetChild(i);
		if (child.BHasClass("Active")) {
			return child.GetAttributeString("name", "");
		};
	};
};

function GetEquippedItem(slot) {
	if (equipped_items_lua[slot] == undefined) {
		if (items_lua == undefined || items_lua[slot] == undefined) {
			return undefined;
		};
		const item_ids = Object.keys(items_lua[slot]);
		for (let i=0; i<item_ids.length; i++) {
			const item_id = item_ids[i];
			const item = items_lua[slot][item_id];
			if (item["type"] == "default_item" && item["slot"] == slot) {
				return parseInt(item_id);
			};
		};
	};
	return equipped_items_lua[slot]["item"];
};

function GetEquippedItems() {
	let valid_items = {};
	let default_slots = [];
	for (let i=0; i<Object.keys(slots_lua).length; i++) {
		const [slot_name, slot_info] = [Object.keys(slots_lua)[i], Object.values(slots_lua)[i]];
		if (slot_info["visible"] != 1) {
			continue;
		};
		if (equipped_items_lua[slot_name] != undefined) {
			valid_items[slot_name] = equipped_items_lua[slot_name]["item"];
		} else {
			default_slots.push(slot_name);
		};
	};
	if (default_slots.length > 0 && items_lua != undefined) {
		for (let i=0; i<default_slots.length; i++) {
			valid_items[default_slots[i]] = GetEquippedItem(default_slots[i]);
		};
	};
	return valid_items;
};

function SlotsLoad(data) {
	data = data || CustomNetTables.GetTableValue("cosmetic", `slots_${GetLocalHeroName()}`);
	if (data == undefined) {
		return;
	};
	slots_lua = Object.fromEntries(Object.entries(data["slots"]).filter(([slot_name, slot_info]) => {
		return !slot_name.startsWith("ability_effects_");
	}).sort(([slot_name_a, slot_info_a], [slot_name_b, slot_info_b]) => {
		return slot_info_a["index"] - slot_info_b["index"];
	}));
	$("#Slots").RemoveAndDeleteChildren();
	for (let i=0; i<Object.keys(slots_lua).length; i++) {
		const [slot_name, slot_info] = [Object.keys(slots_lua)[i], Object.values(slots_lua)[i]];
		if (slot_info["visible"] != 1) {
			continue;
		};
		const panel = $.CreatePanel("Button", $("#Slots"), `Slot${slot_name}`, {hittest: "true"});
		panel.BLoadLayoutSnippet("Slot");
		panel.SetAttributeString("name", slot_name);
		panel.FindChildTraverse("SlotName").text = $.Localize(slot_info["text"]);
		panel.SetPanelEvent("onactivate", () => {
			SelectSlot(slot_name);
		});
	};
};

function ItemsLoad(data) {
	data = data || items_lua;
	if (data == undefined) {
		return;
	};
	$("#Items").RemoveAndDeleteChildren();
	const slot = GetSelectedSlot();
	if (slot == undefined) {
		return;
	};
	const item_ids = Object.keys(items_lua[slot]);
	for (let i=0; i<item_ids.length; i++) {
		const item_id = parseInt(item_ids[i]);
		const item = items_lua[slot][item_id.toString()];
		const panel = $.CreatePanel("Button", $("#Items"), `Item${item_id}`, {hittest: "false"});
		panel.BLoadLayoutSnippet("Item");
		panel.SetAttributeInt("item_id", item_id);
		panel.SetHasClass("Owned", item["avaiable"] == 1);
		panel.SetHasClass("Equipped", GetEquippedItem(item["slot"]) == item_id);
		panel.SetHasClass("MultiStyles", item["styles"] > 1);
		for (let j=0; j<rarities.length; j++) {
			panel.SetHasClass(`Rarity_${rarities[j]}`, item["rarity"] == rarities[j]);
		};
		if (panel.BHasClass("Equipped")) {
			panel.FindChildTraverse("ItemInfo").FindChildTraverse("Status").text = "EQUIPPED";
		} else if (panel.BHasClass("Owned")) {
			panel.FindChildTraverse("ItemInfo").FindChildTraverse("Status").text = "OWNED";
		};
		if (item["styles"] > 1) {
			const selected_style = equipped_items_lua[slot] != undefined ? equipped_items_lua[slot]["style"] : 1;
			for (let i=1; i<=item["styles"]; i++) {
				$.CreatePanel("RadioButton", panel.FindChildTraverse("ItemInfo").FindChildTraverse("StylesSelector"), `${i}`, {class: "Style", group: "style", selected: i==selected_style, hittest: "true"});
			};
		};
		panel.FindChildTraverse("Icon").SetImage(`s2r://panorama/images/${item["icon"]}_png.vtex`);
		panel.FindChildTraverse("ItemInfo").FindChildTraverse("Name").text = $.Localize(item["name"]);
		panel.FindChildTraverse("ItemInfo").FindChildTraverse("Equip").SetPanelEvent("onactivate", () => {
			const styles = panel.FindChildTraverse("ItemInfo").FindChildTraverse("StylesSelector");
			const selected = styles.GetChildCount() > 0 ? styles.GetChild(0).GetSelectedButton() || 1 : 0;
			GameEvents.SendCustomGameEventToServer("cosmetic_equip_item", {item: item_id, style: typeof(selected) != "number" ? parseInt(selected.id) : selected});
		});
		panel.FindChildTraverse("ItemInfo").FindChildTraverse("StylesSelector").SetPanelEvent("onactivate", () => {
			const selected = panel.FindChildTraverse("ItemInfo").FindChildTraverse("StylesSelector").GetChild(0).GetSelectedButton();
			GameEvents.SendCustomGameEventToServer("cosmetic_equip_item", {item: item_id, style: parseInt(selected.id)});
		});
		panel.FindChildTraverse("TooltipTrigger").SetPanelEvent("onmouseover", () => {
			$.DispatchEvent("DOTAShowEconItemTooltip", panel, item_id, 0, -1);
		});
		panel.FindChildTraverse("TooltipTrigger").SetPanelEvent("onmouseout", () => {
			$.DispatchEvent("DOTAHideEconItemTooltip", panel);
		});
	};
};

function SlotsUpdate() {
	if (equipped_items_lua == undefined) {
		return;
	};
	const slots_lua = CustomNetTables.GetTableValue("cosmetic", `slots_${GetLocalHeroName()}`);
	if (slots_lua == undefined) {
		return;
	};
	const equipped_items = GetEquippedItems();
	for (let i=0; i<$("#Slots").GetChildCount(); i++) {
		const child = $("#Slots").GetChild(i);
		const slot = child.GetAttributeString("name", "");
		const equipped_item_id = equipped_items[slot];
		if (equipped_item_id != undefined) {
			const equipped_item = items_lua[slot][equipped_item_id];
			if (equipped_item != undefined) {
				child.FindChildTraverse("Econ").FindChildTraverse("Icon").SetImage(`s2r://panorama/images/${equipped_item["icon"]}_png.vtex`);
				child.SetHasClass("NotDefault", equipped_item["type"] != "default_item");
				child.SetHasClass("MultiStyles", equipped_item["styles"] > 1);
				for (let j=0; j<rarities.length; j++) {
					child.SetHasClass(`Rarity_${rarities[j]}`, equipped_item["rarity"] == rarities[j]);
				};
				const selected_style = equipped_items_lua[slot] != undefined ? equipped_items_lua[slot]["style"] : 1;
				child.FindChildTraverse("Econ").FindChildTraverse("MultiStyle").FindChildTraverse("Selected").text = `${selected_style}/${equipped_item["styles"]}`;
			};
		};
	};
};

function ItemsUpdate() {
	const slot = GetSelectedSlot();
	const equipped_items = GetEquippedItems();
	const equipped_item_id = equipped_items[slot];
	for (let i=0; i<$("#Items").GetChildCount(); i++) {
		const child = $("#Items").GetChild(i);
		const item_id = child.GetAttributeInt("item_id", -1);
		if (item_id == -1) {continue;};
		child.SetHasClass("Equipped", item_id == equipped_item_id);
	};
};

function Init() {
	SlotsLoad();
	GameEvents.SendCustomGameEventToServer("cosmetic_request_items", {});
};

CustomNetTables.SubscribeNetTableListener("cosmetic", (tableName, keyName, data) => {
	if (keyName.startsWith("slots_")) {
		if (keyName == `slots_${GetLocalHeroName()}`) {
			SlotsLoad(data);
		};
	};
});

GameEvents.Subscribe("cosmetic_request_items", (event) => {
	if (Object.keys(event["items"]).length == 0) {
		return $.Schedule(0.1, () => {GameEvents.SendCustomGameEventToServer("cosmetic_request_items", {})});
	};
	items_lua = event["items"];
	ItemsLoad(event["items"]);
	GameEvents.SendCustomGameEventToServer("cosmetic_request_equipped_items", {});
});

GameEvents.Subscribe("cosmetic_request_equipped_items", (event) => {
	equipped_items_lua = event["items"];
	SlotsUpdate(event["items"]);
	ItemsUpdate(event["items"]);
});

Init();