// src/routes/auth.ts
import type { Response } from 'express';
import { Router } from 'express';
import { query } from './../db/index.js';
import type { AuthenticatedRequest } from '../middlewares/authenticateToken';
import { authenticateToken } from '../middlewares/authenticateToken.js';
import { Player } from './../db/models/player.models.js';
import { insertPlayer } from './../db/functions/player.functions.js';

const router = Router();

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
			// 1. Check if user already has 3 players
			const existingPlayers = await query<{ playerCount: number }[]>(
				'SELECT COUNT(*) as playerCount FROM players WHERE account_id = ?',
				[accountId]
			);

			if (existingPlayers[0].playerCount >= 3) {
				res.status(400).json({ message: 'Maximum of 3 players allowed' });
				return;
			}

			// 2. Check if player name exists
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

router.get(
	'/loadplayers',
	authenticateToken,
	async (req: AuthenticatedRequest, res: Response): Promise<void> => {
		if (!req.user) {
			res.status(401).json({ message: 'Unauthorized' });
			return;
		}
		const accountId = req.user.id as number;

		try {
			const players = await query<Player[]>(
				'SELECT * FROM players WHERE account_id = ?',
				[accountId]
			);
			res.status(200).json(players);
		} catch (error) {
			console.error(error);
			res.status(500).json({
				message: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}
);

export default router;
