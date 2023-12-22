/**
 * This file contains types for the events you want to send between the UI (Panorama)
 * and the server (VScripts).
 *
 * IMPORTANT:
 *
 * The dota engine will change the type of event data slightly when it is sent, so on the
 * Panorama side your event handlers will have to handle NetworkedData<EventType>, changes are:
 *   - Booleans are turned to 0 | 1
 *   - Arrays are automatically translated to objects when sending them as event. You have
 *     to change them back into arrays yourself! See 'toArray()' in src/panorama/hud.ts
 */

interface CustomNetTableDeclarations {
    cosmetic: {
        replacements: {
            [player_id: string]: CosmeticReplacements
        },
        [hero_name: string]: CosmeticSlots | CosmeticReplacements
    }
}

interface CosmeticReplacements {
    hero_icons?: CosmeticHeroIconReplacements,
    ability_icons?: CosmeticAbilityIconReplacements,
    item_icons?: CosmeticItemIconReplacements,
}

interface CosmeticHeroIconReplacements {
	[hero_icon: string]: string
}

interface CosmeticAbilityIconReplacements {
	[ability_icon: string]: string
}

interface CosmeticItemIconReplacements {
	[item_icon: string]: string
}

interface CosmeticSlotInfo {
    index: number,
    text: string,
    visible: 0 | 1
}

interface CosmeticSlots {
    [slot_name: string]: CosmeticSlotInfo
}

interface CustomGameEventDeclarations {
    cosmetic_request_items: {},
    cosmetic_respond_items: {
        items: CosmeticHeroItems
    },
    cosmetic_request_equipped_items: {},
    cosmetic_respond_equipped_items: {
        items: CosmeticEquippedItems
    },
    cosmetic_equip_item: {
        item: number
        style: number
    }
}

interface CosmeticHeroItem {
    name: string,
    slot: string,
    icon: string,
    rarity: string,
    styles: number,
    type: string,
    avaiable: 0 | 1,
    bundle?: {[index: number]: number}
}

interface CosmeticHeroItems {
    [slot_name: string]: {
        [item_id: string]: CosmeticHeroItem
    }
}

interface CosmeticEquippedItem {
    item: number,
    style: number
}

interface CosmeticEquippedItems {
    [slot_name: string]: CosmeticEquippedItem
}