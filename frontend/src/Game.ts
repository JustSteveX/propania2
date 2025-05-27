import Phaser from 'phaser';
import LoginScene from './scenes/LoginScene.js';
import PlayerSelectionScene from './scenes/PlayerSelectionScene.js';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';
import IsoMapScene from './scenes/IsoMapScene.js';
import SocketManager from './SocketManager.ts';

const socket = SocketManager.getSocket();

// Phaser.js-Konfiguration
const config: Phaser.Types.Core.GameConfig = {
	type: Phaser.AUTO,
	width: window.innerWidth,
	height: window.innerHeight,
	parent: 'game-container',
	scale: {
		mode: Phaser.Scale.RESIZE, // Passt das Spiel an die Fenstergröße an
		autoCenter: Phaser.Scale.CENTER_BOTH, // Zentriert das Spiel
	},
	scene: [LoginScene, PlayerSelectionScene, GameScene, UIScene, IsoMapScene],
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { y: 0, x: 0 },
			debug: true,
		},
	},
};

const game = new Phaser.Game(config);

// Optional: Aktualisiere die Spielgröße bei Fensteränderungen
window.addEventListener('resize', () => {
	game.scale.resize(window.innerWidth, window.innerHeight);
});
