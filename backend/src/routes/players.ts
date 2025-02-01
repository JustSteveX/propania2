// src/routes/auth.ts
import type { Response } from 'express';
import { Router } from 'express';
import { query } from './../db/index.js';
import type { AuthenticatedRequest } from '../middlewares/authenticateToken';
import { authenticateToken } from '../middlewares/authenticateToken.js';
import { Player } from '../db/models/player.model.js';
import { insertPlayer } from './../db/functions/player.functions.js';

const router = Router();

router.post(
	'/createplayer',
	authenticateToken,
	async (req: AuthenticatedRequest, res: Response) => {
		const { playername } = req.body as { playername: string };

		const existingPlayers: Player[] = await query<Player[]>(
			'SELECT * FROM players WHERE name = ?',
			[playername]
		);

		if (existingPlayers.length > 0) {
			res.status(400).json({ message: 'Player already exists' });
			return;
		}
		const newPlayer = new Player(playername);
		insertPlayer(newPlayer);
		res.status(201).json({ message: 'Player created.' });
	}
);

export default router;
