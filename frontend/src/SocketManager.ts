import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import type { Player } from './types/players.type';

class SocketManager {
	private static socket: Socket | null = null;

	// Singleton-Muster, um sicherzustellen, dass es nur eine Socket-Verbindung gibt
	public static getSocket(): Socket {
		if (!this.socket) {
			this.socket = io('http://localhost:3001', {
				withCredentials: true, // Falls Cookies oder Sitzungsdaten verwendet werden
			});
		}
		return this.socket;
	}

	// 🎯 Spieler-Updates empfangen
	public static onPlayerUpdate(callback: (players: Player[]) => void): void {
		if (!this.socket) {
			this.getSocket();
		}
		this.socket!.on('updatePlayers', callback);
	}
}

export default SocketManager;
