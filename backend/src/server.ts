import type { Application, Request, Response, NextFunction } from 'express';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { DbService } from './services/db.service';
import { AuthRoutes } from './auth.routes';
import type { Route } from './types/route.type';
import dotenv from 'dotenv';

export class Propania2Server {
	private readonly _APP: Application = express();
	get app() {
		return this._APP;
	}

	private readonly _SOCKET_SERVER = createServer(this._APP);
	get socketServer() {
		return this._SOCKET_SERVER;
	}

	private readonly _SOCKET_IO;
	get socket_io() {
		return this._SOCKET_IO;
	}

	private readonly DbService = new DbService();

	constructor() {
		this._SOCKET_IO = new Server(this._SOCKET_SERVER, {
			cors: {
				origin: 'http://localhost:8080', // Erlaube Frontend auf Port 8080
				methods: ['GET', 'POST'],
				allowedHeaders: ['Content-Type'], // Sicherstellen, dass der Content-Type erlaubt wird
				credentials: true, // Falls du mit Cookies oder Authentifizierung arbeitest
			},
		});
		this.initMiddleware();
		this.loadRoutes();

		this.start();
	}

	private initMiddleware() {
		this.app.use(
			cors({
				origin: 'http://localhost:8080', // Erlaube Frontend auf Port 8080
				methods: ['GET', 'POST'],
				credentials: true, // Falls Cookies verwendet werden
			})
		);
		this.app.use(express.json());
	}

	private loadRoutes() {
		// TODO hier sollten alle routes dynamisch geladen werden
		[new AuthRoutes(this, this.DbService)].forEach((route: Route) =>
			route.registerRoutes()
		);
	}

	private start(): void {
		const PORT = 3001;
		this.socketServer.listen(PORT, () => {
			console.log(`Backend läuft auf http://localhost:${PORT}`);
		});
	}
}
dotenv.config();
new Propania2Server();

// Middleware für CORS (HTTP-Anfragen)

const JWT_SECRET = 'propania2secret';

// Middleware zur Authentifizierung mit JWT
interface AuthenticatedRequest extends Request {
	user?: { userId: number; email: string };
}

function authenticateToken(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): void {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];

	if (!token) {
		res.status(401).json({ message: 'Zugriff verweigert!' });
	}

	if (typeof token === 'string') {
		jwt.verify(token, JWT_SECRET, (err, user) => {
			if (err) {
				return res.status(403).json({ message: 'Ungültiger Token!' });
			}

			req.user = user as { userId: number; email: string };
			next();
		});
	} else {
		res.status(401).json({ message: 'Zugriff verweigert!' });
	}
}
/*
// Beispiel geschützter Route
app.get(
	'/protected',
	authenticateToken,
	(req: AuthenticatedRequest, res: Response) => {
		res.status(200).json({ message: 'Geschützter Inhalt', user: req.user });
	}
);

// Socket.IO-Verbindungen
io.on('connection', (socket) => {
	console.log(`Benutzer verbunden: ${socket.id}`);

	// Event-Listener für Nachrichten
	socket.on('message', (data) => {
		console.log(`Nachricht erhalten: ${data}`);
		io.emit('message', `Server hat empfangen: ${data}`);
	});

	// Event-Listener für Trennung
	socket.on('disconnect', () => {
		console.log(`Benutzer getrennt: ${socket.id}`);
	});
});
*/
// Server starten
