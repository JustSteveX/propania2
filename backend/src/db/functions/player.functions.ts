import { query } from '../index.js';
import type { Player } from '../models/player.models.js';

export async function insertPlayer(playername: string) {
	const createdPlayer = await query<Player>(
		'INSERT INTO players (name,money,exp,level,positionX,positionY) VALUES (?,?,?,?,?,?)',
		[playername, 0, 0, 1, 0, 0]
	);

	return createdPlayer;
}
