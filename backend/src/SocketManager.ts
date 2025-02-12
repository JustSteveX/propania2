import type { Server as HttpServer } from 'http';
import type { Socket } from 'socket.io';
import { Server } from 'socket.io';
import type { Player } from './types/player.type.js';

class SocketManager {
	private static io: Server;
	private static players: Player[] = [];

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

			// Sende die aktuelle Spielerliste an den neuen Client
			socket.emit('currentPlayers', this.players);
		});
	}

	private static registerEvents(socket: Socket) {
		socket.on('login', (playerData: Player) => {
			const newPlayer = { ...playerData, socketId: socket.id };
			this.players.push(newPlayer);
			console.log('Spieler verbunden:', newPlayer);

			// Informiere alle Clients über den neuen Spieler
			this.io.emit('playerJoined', newPlayer);
		});

		socket.on('disconnect', () => {
			const disconnectedPlayer = this.players.find(
				(player) => player.socketId === socket.id
			);
			this.players = this.players.filter(
				(player) => player.socketId !== socket.id
			);
			console.log('Client disconnected:', socket.id);
			console.log('Verbleibende Spieler:', this.players);

			// Informiere alle Clients über den getrennten Spieler
			if (disconnectedPlayer) {
				this.io.emit('playerLeft', disconnectedPlayer);
			}
		});

		socket.on('updatePlayer', (playerData: Player) => {
			const index = this.players.findIndex(
				(player) => player.socketId === socket.id
			);
			if (index !== -1) {
				this.players[index] = { ...this.players[index], ...playerData };
				this.io.emit('playerUpdated', this.players[index]);
			}
		});
	}

	public static getSocket() {
		return this.io;
	}
}

export default SocketManager;
