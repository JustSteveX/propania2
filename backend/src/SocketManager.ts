import type { Server as HttpServer } from 'http';
import type { Socket } from 'socket.io';
import { Server } from 'socket.io';
import type { Player } from './types/player.type.js';

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
			console.log('Ein Benutzer ist verbunden:', socket.id);
			this.registerEvents(socket);
		});
	}

	private static registerEvents(socket: Socket) {
		socket.on('login', (playerData: Player) => {
			// Nutze socket.id, um sicherzustellen, dass die ID korrekt ist
			const newPlayer = { ...playerData, socket_id: socket.id };
			this.players[socket.id] = { ...playerData, socket_id: socket.id };

			// Debug-Ausgaben:
			console.log('👤 Spieler hinzugefügt:', newPlayer);
			console.log('📋 Aktuelle Spieler:', this.players);

			// Sende alle aktuellen Spieler an den neu verbundenen Client
			socket.emit('currentPlayers', this.players);

			// Informiere alle anderen Clients über den neuen Spieler
			socket.broadcast.emit('newPlayer', newPlayer);
		});

		socket.on('playerMovement', (data) => {
			const player = Object.values(this.players).find(
				(p) => p.socket_id === socket.id
			);
			if (player) {
				this.players[socket.id] = { ...player, ...data };
				socket.broadcast.emit('playerMoved', { id: socket.id, ...data });
			}
		});

		socket.on('disconnect', () => {
			console.log('Spieler getrennt:', socket.id);
			delete SocketManager.players[socket.id];
			this.io.emit('playerDisconnected', socket.id);
		});
	}

	public static getSocket() {
		return this.io;
	}
}

export default SocketManager;
