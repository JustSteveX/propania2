import { defineConfig } from 'vite';

export default defineConfig({
	base: './', // Basis für relative Pfade
	server: {
		open: true,
		port: 8080, // Port für den Entwicklungsserver
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
