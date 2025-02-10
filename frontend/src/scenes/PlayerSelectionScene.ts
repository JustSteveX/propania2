import Phaser from 'phaser';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';

export default class PlayerSelectionScene extends Phaser.Scene {
	private socket: Socket;
	private graphics!: Phaser.GameObjects.Graphics;
	private clickSound!: Phaser.Sound.BaseSound;
	private playernametext!: HTMLElement;
	private playernameInput!: HTMLInputElement;
	private feedbacktext!: HTMLElement;

	constructor() {
		super({ key: 'PlayerSelectionScene' });
		this.socket = io('http://localhost:3001');
	}

	init() {
		this.scene.get('LoginScene').events.emit('deactivateInputs');
		this.scene.sleep('LoginScene');
	}

	preload() {
		this.load.image('background', 'assets/images/background.png');
		this.load.image('playerselection', 'assets/images/playerselection.png');
		this.load.image('logoutbutton', 'assets/images/logoutbutton.png');
		this.load.image('createbutton', 'assets/images/createbutton.png');
	}

	create() {
		// Events
		this.events.on('deactivateInputs', this.deactivateInputs, this);

		// Sounds

		this.clickSound = this.sound.add('clickSound');

		const centerX = this.scale.width / 2;
		const centerY = this.scale.height / 2;

		// Hintergrundbild hinzufügen
		const bg = this.add.image(0, 0, 'background').setOrigin(0, 0);
		bg.setOrigin(0, 0);

		const propaniaImage = this.add
			.image(centerX, centerY - 250, 'playerselection')
			.setScale(0.8, 0.8);

		// Skalierung berechnen, um den Bildschirm zu füllen
		const scaleX = this.scale.width / bg.width;
		const scaleY = this.scale.height / bg.height;
		const scale = Math.max(scaleX, scaleY);
		bg.setScale(scale);
		bg.setPosition(0, 0);

		this.graphics = this.add.graphics();
		this.graphics.fillStyle(0xdeb887, 1);
		this.graphics.fillRoundedRect(centerX - 150, centerY - 150, 300, 400, 20);

		// Berechne die Positionen für das responsive Login-Formular
		const inputWidth = 200;
		const inputHeight = 30;
		const gap = 20; // Abstand zwischen den Eingabefeldern

		// E-Mail-Text erstellen und als Klassenattribute speichern
		this.playernametext = document.createElement('div');
		this.playernametext.style.left = `${centerX - inputWidth / 2 + 50}px`;
		this.playernametext.style.top = `${centerY - inputHeight / 2 - (inputHeight + gap) - 80}px`;
		this.playernametext.innerText = 'Playername';
		this.playernametext.style.position = 'absolute';
		document.body.appendChild(this.playernametext);

		// E-Mail-Eingabefeld erstellen und zentrieren
		this.playernameInput = document.createElement('input');
		this.playernameInput.type = 'text';
		this.playernameInput.placeholder = 'Playername';
		this.playernameInput.style.position = 'absolute';
		this.playernameInput.style.left = `${centerX - inputWidth / 2}px`;
		this.playernameInput.style.top = `${centerY - inputHeight / 2 - (inputHeight + gap) - 50}px`;
		this.playernameInput.style.width = `${inputWidth}px`;
		this.playernameInput.style.height = `${inputHeight}px`;
		this.playernameInput.style.fontSize = '16px';
		this.playernameInput.style.zIndex = '10';
		document.body.appendChild(this.playernameInput);

		const createbutton = this.add
			.image(centerX, centerY - 50, 'createbutton')
			.setInteractive()
			.setScale(0.3, 0.3)
			.on('pointerdown', () => {
				this.handlePlayerCreation();
				this.handleClickSound();
			})
			.on('pointerover', () => {
				createbutton.setScale(0.31, 0.31);
			})
			.on('pointerout', () => {
				createbutton.setScale(0.3, 0.3);
			});

		// Rückmeldungstext initialisieren
		this.feedbacktext = document.createElement('div');
		this.feedbacktext.style.left = `${centerX - inputWidth / 2 + 30}px`;
		this.feedbacktext.style.top = `${centerY - inputHeight / 2 - (inputHeight + gap - 150)}px`;
		this.feedbacktext.innerText = '';
		this.feedbacktext.style.position = 'absolute';

		document.body.appendChild(this.feedbacktext);

		const loginbutton = this.add
			.image(centerX, centerY + 150, 'loginbutton')
			.setInteractive()
			.setScale(0.3, 0.3)
			.on('pointerdown', () => {
				this.handleLogin();
				this.handleClickSound();
			})
			.on('pointerover', () => {
				loginbutton.setScale(0.31, 0.31);
			})
			.on('pointerout', () => {
				loginbutton.setScale(0.3, 0.3);
			});

		const logoutbutton = this.add
			.image(centerX, centerY + 200, 'logoutbutton')
			.setScale(0.3, 0.3)
			.setInteractive()
			.on('pointerdown', () => {
				this.handleLogout();
				this.handleClickSound();
			})
			.on('pointerover', () => {
				logoutbutton.setScale(0.31, 0.31);
			})
			.on('pointerout', () => {
				logoutbutton.setScale(0.3, 0.3);
			});
	}

	handlePlayerCreation() {
		const playername = this.playernameInput.value;
		const token = localStorage.getItem('token');

		if (!playername) {
			this.feedbacktext.innerHTML = 'Please fill all fields!';
			return;
		}

		fetch('http://localhost:3001/players/createplayer', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`, // ✅ Send token in header
			},
			body: JSON.stringify({ playername }),
		})
			.then(async (response) => {
				const text = await response.text();

				try {
					const data = JSON.parse(text);
					if (!response.ok) {
						throw new Error(data.message || 'Failed to register');
					}
					return data;
				} catch (error) {
					throw new Error(`Invalid JSON response: ${text}`);
				}
			})
			.then((data) => {
				this.feedbacktext.innerHTML = data.message;
			})
			.catch((error) => {
				console.error('Failed to register:', error.message);
				this.feedbacktext.innerHTML = error.message;
			});
	}

	handleLogin() {
		this.scene.start('GameScene');
	}

	handleLogout() {
		localStorage.removeItem('token');
		this.scene.sleep('PlayerSelectionScene');
		this.scene.start('LoginScene');
	}

	handleClickSound() {
		this.clickSound.play();
	}

	deactivateInputs() {
		this.playernametext.style.display = 'none';
		this.playernameInput.style.display = 'none';
	}
}
