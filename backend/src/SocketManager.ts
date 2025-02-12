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
		});
	}

	private static registerEvents(socket: Socket) {
		socket.on('login', (playerData: Player) => {
			this.players.push({ ...playerData, socketId: socket.id });
			console.log('Spieler verbunden:', this.players);
		});

		socket.on('disconnect', () => {
			this.players = this.players.filter(
				(player) => player.socketId !== socket.id
			);
			console.log('Client disconnected:', socket.id);
			console.log('Verbleibende Spieler:', this.players);
		});
	}
}

export default SocketManager;
