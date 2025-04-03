import express from 'express';
import cors from 'cors';
import http from 'http';
import authRoutes from './routes/auth.js';
import playersRoutes from './routes/players.js';
import protectedRoutes from './routes/protected.js';
import SocketManager from './SocketManager.js';

const app = express();
const server = http.createServer(app);

const PORT = process.env.APP_PORT;

const corsOptions = {
	origin: 'http://localhost:8080',
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

server.listen(PORT, () => {
	console.log(`Server läuft auf http://localhost:${PORT}`);
});
