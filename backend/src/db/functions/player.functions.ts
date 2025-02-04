import { query } from '../index.js';
import type { Player } from '../models/player.models.js';

export async function insertPlayer(playername: string, accountId: number) {
	const createdPlayer = await query<Player>(
		'INSERT INTO players (name,account_id,money,exp,level,positionX,positionY) VALUES (?,?,?,?,?,?,?)',
		[playername, accountId, 0, 0, 1, 0, 0]
	);

	return createdPlayer;
}
