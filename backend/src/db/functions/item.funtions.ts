import { query } from '../index.js';
import { allItems } from '../../routes/items.js';
import type { Inventory } from '../../types/inventory.type.js'; // Achte darauf, dass Item und Inventory richtig importiert sind

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
	} catch (err) {
		console.error('Fehler beim Einfügen ins Inventar:', err);
		throw err;
	}
}

export async function getInventoryForPlayer(
	player_id: number
): Promise<Inventory> {
	if (!player_id) {
		throw new Error('player_id ist erforderlich');
	}

	try {
		// Hole die player_inventory-Daten (item_id, quantity)
		const inventoryRows: { item_id: number; quantity: number }[] = await query(
			`
      SELECT item_id, quantity
      FROM players_inventory
      WHERE players_id = ?
      `,
			[player_id]
		);

		if (inventoryRows.length === 0) {
			return [];
		}

		const inventory: Inventory = inventoryRows
			.map((invRow) => {
				const itemId = Number(invRow.item_id);
				const item = allItems.find((i) => i.id === itemId);

				if (!item) {
					console.warn(`Item mit ID ${itemId} nicht gefunden!`);
					return null;
				}

				return {
					...item,
					quantity: invRow.quantity,
				};
			})
			.filter((item) => item !== null) as Inventory;

		return inventory;
	} catch (err) {
		console.error('Fehler beim Abrufen des Inventars:', err);
		throw err;
	}
}
