// src/routes/auth.ts
import type { Response } from 'express';
import { Router } from 'express';
import { query } from './../db/index.js';
import type { AuthenticatedRequest } from '../middlewares/authenticateToken';
import { authenticateToken } from '../middlewares/authenticateToken.js';
import { Player } from './../db/models/player.models.js';
import { insertPlayer } from './../db/functions/player.functions.js';

const router = Router();

// src/routes/players.ts
router.post(
	'/createplayer',
	authenticateToken,
	async (req: AuthenticatedRequest, res: Response): Promise<void> => {
		const { playername } = req.body as { playername: string };
		if (!req.user) {
			res.status(401).json({ message: 'Unauthorized' });
			return;
		}
		const accountId = req.user.id as number;

		try {
			// 1. Check if player name exists
			const [existingPlayer] = await query<Player[]>(
				'SELECT name FROM players WHERE name = ?',
				[playername]
			);

			if (existingPlayer) {
				res.status(400).json({ message: 'Player already exists' });
				return;
			}

			// 3. Create new player
			await insertPlayer(playername, accountId);
			res.status(201).json({ message: 'Player created' });
		} catch (error) {
			console.error(error);
			res.status(500).json({
				message: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}
);

export default router;
