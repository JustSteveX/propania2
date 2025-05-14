import express from 'express';
import cors from 'cors';
import http from 'http';
import authRoutes from './routes/auth.js';
import playersRoutes from './routes/players.js';
import protectedRoutes from './routes/protected.js';
import SocketManager from './SocketManager.js';

const app = express();
const server = http.createServer(app);

const SERVER_PORT = Number(process.env.SERVER_PORT) || 3001;
const HOST_SERVER = process.env.HOST_SERVER;
const CLIENT_PORT = process.env.CLIENT_PORT;

const allowedOrigins = [
	'http://localhost',
	'http://192.168.178.89',
	'http://78.46.179.15',
];

const corsOptions = {
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
	allowedHeaders: ['Content-Type', 'Authorization'],
	credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/players', playersRoutes);
app.use('/protected', protectedRoutes);

// Initialisiere den SocketManager
SocketManager.initialize(server);

server.listen(SERVER_PORT, '0.0.0.0', () => {
	console.log(`Server läuft auf http://${HOST_SERVER}:${SERVER_PORT}`);
});
