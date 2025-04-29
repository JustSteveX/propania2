import { query } from '../index.js'; // dein DB-Modul

export async function insertItem(
	player_id: number,
	item_id: number,
	quantity: number
): Promise<void> {
	// Prüfung, ob alle benötigten Parameter vorhanden sind
	if (!player_id || !item_id || !quantity || quantity <= 0) {
		throw new Error('Missing or invalid parameters');
	}

	try {
		// Einfügen oder Aktualisieren des Inventars mit der Menge
		await query(
			`
      INSERT INTO players_inventory (players_id, item_id, quantity)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
      `,
			[player_id, item_id, quantity]
		);
		console.log(
			`Item ${item_id} für Spieler ${player_id} mit Menge ${quantity} hinzugefügt/aktualisiert.`
		);
	} catch (err) {
		console.error('Fehler beim Einfügen ins Inventar:', err);
		throw err;
	}
}
