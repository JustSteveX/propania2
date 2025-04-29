import type { Server as HttpServer } from 'http';
import type { Socket } from 'socket.io';
import { Server } from 'socket.io';
import type { Player } from './types/player.type.js';
import { updatePlayer } from './db/functions/player.functions.js';
import { items } from './routes/items.js';
import { insertItem } from './db/functions/item.funtions.js';

class SocketManager {
	private static io: Server;
	private static players: { [socketId: string]: Player } = {};

	public static initialize(server: HttpServer) {
		this.io = new Server(server, {
			cors: {
				origin: 'http://localhost:8080',
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
			socket.emit('getItems', items);
		});

		socket.on('pickupItem', (data) => {
			// data[0] = socketId
			// data[1] = itemId

			const socketId = data[0];
			const itemId = data[1];

			const index = items.findIndex((item) => item.id === itemId);

			if (index !== -1) {
				items.splice(index, 1);
				socket.emit('getItems', items);

				const player_id = this.players[socketId]?.id;

				console.log(player_id, itemId, 1);
				if (player_id !== undefined) {
					insertItem(player_id, itemId, 1);
					socket.broadcast.emit('destroyItem', itemId);
				} else {
					console.error('Player ID is undefined for socket:', socketId);
				}
			} else {
				console.log('Item nicht gefunden:', itemId);
			}
		});
	}
}

export default SocketManager;
