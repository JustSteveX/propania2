export type Item = {
	id: number;
	name: string;
	description: string;
	type: string; // 'weapon' | 'armor' | 'potion' | 'misc';
	rarity: string; //'common' | 'rare' | 'epic' | 'legendary';
	x: number;
	y: number;
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
	equippedSlot?: string; //'head' | 'chest' | 'legs' | 'weapon' | 'inventory';
	currentDurability?: number;
	maxDurability?: number;
	isDroppable?: boolean;
	isUsable?: boolean;
	Owner?: number;
	Ownername?: string;
};
