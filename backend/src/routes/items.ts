import { Router } from 'express';
import type { Response } from 'express';
import type { Item } from '../types/item.type';
import type { AuthenticatedRequest } from '../middlewares/authenticateToken';
import { authenticateToken } from '../middlewares/authenticateToken.js';
import { readFileSync } from 'fs';
const raw = readFileSync(
	new URL('../data/items.json', import.meta.url),
	'utf-8'
);
export const allItems: Item[] = JSON.parse(raw) as Item[];

const router = Router();

router.get(
	'/items',
	authenticateToken,
	async (req: AuthenticatedRequest, res: Response): Promise<void> => {
		if (!req.user) {
			res.status(401).json({ message: 'Unauthorized' });
			return;
		}
		res.json(allItems);
	}
);

export default router;
