import { io, Socket } from 'socket.io-client';

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
}

export default SocketManager;
