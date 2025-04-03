import type { Response } from 'express';
import { Router } from 'express';
import type { Item } from '../types/item.type';
import type { AuthenticatedRequest } from '../middlewares/authenticateToken';
import { authenticateToken } from '../middlewares/authenticateToken.js';

const router = Router();

router.get(
	'/items',
	authenticateToken,
	async (req: AuthenticatedRequest, res: Response): Promise<void> => {
		if (!req.user) {
			res.status(401).json({ message: 'Unauthorized' });
			return;
		}
		res.json(items);
	}
);

export const items: Item[] = [
	{
		id: 1,
		name: 'Mushroom',
		description: 'A small brown mushroom with white spots.',
		type: 'misc',
		rarity: 'common',
		stats: { attack: 0, defense: 0, healing: 0, speed: 0 },
		levelRequirement: 1,
		equipped: false,
		quantity: 1,
		icon: '../assets/items/mushroom.png',
		equippedSlot: 'inventory',
		currentDurability: 100,
		maxDurability: 100,
		isDroppable: true,
		isUsable: true,
		Owner: undefined,
		Ownername: '',
	},
];
