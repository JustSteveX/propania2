import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import type { Player } from './types/players.type';

class SocketManager {
	private static socket: Socket | null = null;

	public static getSocket(): Socket {
		if (!this.socket) {
			console.log('🔵 Erstelle neue Socket-Verbindung...');
			this.socket = io('http://localhost:3001', {
				withCredentials: true, // Falls Cookies oder Sitzungsdaten verwendet werden
			});

			this.socket.on('connect', () => {
				console.log('✅ Verbindung hergestellt mit ID:', this.socket?.id);
			});

			this.socket.on('disconnect', () => {
				console.warn('❌ Verbindung zum Server verloren.');
			});
		}
		return this.socket;
	}
}

export default SocketManager;
