import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import type { Player } from './types/players.type';

class SocketManager {
	private static socket: Socket | null = null;

	public static getSocket(): Socket {
		if (!this.socket) {
			const host = import.meta.env.VITE_HOST_SERVER;
			const apiport = import.meta.env.VITE_API_PORT;
			const protokoll = import.meta.env.VITE_API_PROTOKOLL;
			console.log('🔵 Erstelle neue Socket-Verbindung...');
			this.socket = io(`${protokoll}://${host}:${apiport}`, {
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
