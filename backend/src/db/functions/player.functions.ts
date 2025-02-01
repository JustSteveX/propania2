import { query } from '../index.js';
import type { PlayerType, Player } from '../models/player.model.js';

export async function insertPlayer(player: Player) {
	const createdPlayer = await query<PlayerType>(
		'INSERT INTO players (name,money,exp,level,positionX,positionY) VALUES (?,?,?,?,?,?)',
		[
			player.name,
			player.money,
			player.exp,
			player.level,
			player.positionX,
			player.positionY,
		]
	);

	return createdPlayer;
}
