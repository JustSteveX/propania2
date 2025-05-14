import { Server } from 'socket.io';
import type { Socket } from 'socket.io';
import { allItems } from './routes/items.js';
import { get, type Server as HttpServer } from 'http';
import type { Player } from './types/player.type.js';
import { insertItem } from './db/functions/item.funtions.js';
import { updatePlayer } from './db/functions/player.functions.js';
import { getInventoryForPlayer } from './db/functions/item.funtions.js';
import type { Inventory } from './types/inventory.type.js';
const worldItems = [...allItems];

const SERVER_PORT = Number(process.env.SERVER_PORT) || 3001;
const HOST_SERVER = process.env.HOST_SERVER;
const CLIENT_PORT = process.env.CLIENT_PORT;

class SocketManager {
	private static io: Server;
	private static players: { [socketId: string]: Player } = {};

	public static initialize(server: HttpServer) {
		this.io = new Server(server, {
			cors: {
				//origin: `http://${HOST_SERVER}:${CLIENT_PORT}`,
				origin: [
					`http://localhost:${CLIENT_PORT}`,
					`http://127.0.0.1:${CLIENT_PORT}`,
					`http://192.168.178.89:${CLIENT_PORT}`,
					`http://78.46.179.15:${CLIENT_PORT}`,
					`http://cloud.propanben.de:3001`,
					`http://cloud.propanben.de:${CLIENT_PORT}`,
					`http://propania2.de`,
					`http://propania2.de:${CLIENT_PORT}`,
				],
				methods: ['GET', 'POST'],
				credentials: true,
			},
		});

		this.io.on('connection', (socket: Socket) => {
			//console.log('Ein Benutzer ist verbunden:', socket.id);
			this.registerEvents(socket);
		});
	}

	private static registerEvents(socket: Socket) {
		socket.on('login', (playerData: Player) => {
			const newPlayer = { ...playerData, socket_id: socket.id };
			this.players[socket.id] = newPlayer;

			//console.log('👤 Spieler hinzugefügt:', newPlayer);
			//console.log('📋 Aktuelle Spieler:', this.players);

			// Sende allen Clients die aktuellen Spieler
			socket.emit('currentPlayers', this.players);
			socket.broadcast.emit('newPlayer', newPlayer);
		});

		socket.on('playerMovement', (data) => {
			const player = this.players[socket.id];
			if (player) {
				// Aktualisiere den Spieler inkl. übergebenem animationKey
				this.players[socket.id] = { ...player, ...data };
				socket.broadcast.emit('playerMoved', { socket_id: socket.id, ...data });
			}
		});

		socket.on('disconnect', () => {
			const player = this.players[socket.id];
			updatePlayer(player);
			//console.log('Spieler getrennt:', socket.id);
			delete SocketManager.players[socket.id];
			this.io.emit('playerDisconnected', socket.id);
		});

		socket.on('loadItems', () => {
			//console.log('Items werden gesendet', items);
			socket.emit('getItems', worldItems);
		});

		socket.on('pickupItem', (data) => {
			// data[0] = socketId
			// data[1] = itemId

			const socketId = data[0];
			const itemId = data[1];

			const index = worldItems.findIndex((item) => item.id === itemId);

			if (index !== -1) {
				worldItems.splice(index, 1);
				socket.emit('getItems', worldItems);

				const player_id = this.players[socketId]?.id;

				if (player_id !== undefined) {
					insertItem(player_id, itemId, 1);
					socket.broadcast.emit('destroyItem', itemId);
				} else {
					console.error('Player ID is undefined for socket:', socketId);
				}
			}
		});

		socket.on('getInventory', (player_id: number) => {
			getInventoryForPlayer(player_id)
				.then((inventory: Inventory) => {
					socket.emit('loadInventory', [inventory]);
				})
				.catch((error) => {
					console.error('Fehler beim Laden des Inventars:', error);
					socket.emit('loadInventoryError', {
						message: 'Inventar konnte nicht geladen werden.',
					});
				});
		});
	}
}

export default SocketManager;
