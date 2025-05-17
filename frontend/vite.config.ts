import { defineConfig } from 'vite';
import dotenv from 'dotenv';

// .env laden
dotenv.config();

const HOST = process.env.VITE_HOST_SERVER || 'localhost';
const API_PORT = process.env.VITE_API_PORT || 3001;
const PROTOKOLL = process.env.VITE_API_PROTOKOLL || 'https';

export default defineConfig({
	base: './', // Basis für relative Pfade
	server: {
		host: HOST,
		open: true,
		port: 8080, // Port für den Entwicklungsserver
		proxy: {
			'/api': {
				target: `${PROTOKOLL}://${HOST}:${API_PORT}`,
				changeOrigin: true,
				secure: false,
				ws: true, // Aktiviert WebSocket-Proxying
			},
		},
	},
	build: {
		outDir: 'dist', // Ausgabeordner
		sourcemap: true, // Erstelle Sourcemaps für Debugging
		target: 'esnext', // Ziel für moderne Browser
		rollupOptions: {
			input: 'index.html',
		},
	},
});
