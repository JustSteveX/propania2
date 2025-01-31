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
	(req: AuthenticatedRequest, res: Response) => {
		const { playername } = req.body as { playername: string };

		// Check if user exists
		query<Player[]>('SELECT name FROM players WHERE name = ?', [playername])
			.then(([existingPlayer]) => {
				if (existingPlayer) {
					res.status(400).json({ message: 'Player already exists' });
					return;
				}

				// Insert player
				return insertPlayer(playername).then(() => {
					res.status(201).json({ message: 'Player created' });
				});
			})
			.catch((error) => {
				console.error(error);
				res.status(500).json({ message: error });
			});
	}
);

export default router;
