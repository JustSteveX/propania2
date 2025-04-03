export type Item = {
	id: number;
	name: string;
	description: string;
	type: 'weapon' | 'armor' | 'potion' | 'misc';
	rarity: 'common' | 'rare' | 'epic' | 'legendary';
	stats: {
		attack?: number;
		defense?: number;
		healing?: number;
		speed?: number;
	};
	levelRequirement: number;
	equipped: boolean;
	quantity: number;
	icon: string;
	equippedSlot?: 'head' | 'chest' | 'legs' | 'weapon' | 'inventory';
	currentDurability?: number;
	maxDurability?: number;
	isDroppable?: boolean;
	isUsable?: boolean;
	Owner?: number | undefined;
	Ownername?: string;
};
