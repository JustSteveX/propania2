import Phaser from 'phaser';
import type { Socket } from 'socket.io-client';
import SocketManager from '../SocketManager.ts';
const HOST = import.meta.env.VITE_HOST_SERVER;
const PORT = import.meta.env.VITE_API_PORT;
const API_URL = `http://${HOST}:${PORT}`;

export default class LoginScene extends Phaser.Scene {
	private emailtext!: HTMLElement;
	private passwordtext!: HTMLElement;
	private feedbacktext!: HTMLElement;
	private emailInput!: HTMLInputElement;
	private passwordInput!: HTMLInputElement;
	private socket: Socket;
	private graphics!: Phaser.GameObjects.Graphics;
	private clickSound!: Phaser.Sound.BaseSound;

	constructor() {
		super({ key: 'LoginScene' });
		this.socket = SocketManager.getSocket();
	}

	init() {
		// Überprüfen, ob ein Token vorhanden ist
		const token = localStorage.getItem('token');
		if (token) {
			this.validateToken(token);
		}
	}

	preload() {
		this.load.image('background', 'assets/images/background.png');
		this.load.image('propania2', 'assets/images/propania2.png');
		this.load.image('loginbutton', 'assets/images/loginbutton.png');
		this.load.image('registerbutton', 'assets/images/registerbutton.png');
		this.load.audio('clickSound', 'assets/sounds/click.mp3');
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

		this.graphics = this.add.graphics();
		this.graphics.fillStyle(0xdeb887, 1);
		this.graphics.fillRoundedRect(centerX - 150, centerY - 150, 300, 400, 20);

		const propaniaImage = this.add
			.image(centerX, centerY - 250, 'propania2')
			.setScale(0.8, 0.8);

		// Skalierung berechnen
		const scaleX = this.scale.width / bg.width;
		const scaleY = this.scale.height / bg.height;
		const scale = Math.max(scaleX, scaleY);
		bg.setScale(scale);
		bg.setPosition(0, 0);

		// Positionen für das Login-Formular
		const inputWidth = 200;
		const inputHeight = 30;
		const gap = 20;

		// E-Mail-Text
		this.emailtext = document.createElement('div');
		this.emailtext.style.left = `${centerX - inputWidth / 2 + 70}px`;
		this.emailtext.style.top = `${centerY - inputHeight / 2 - (inputHeight + gap) - 80}px`;
		this.emailtext.innerText = 'E-Mail';
		this.emailtext.style.position = 'absolute';
		document.body.appendChild(this.emailtext);

		// E-Mail-Eingabefeld
		this.emailInput = document.createElement('input');
		this.emailInput.type = 'email';
		this.emailInput.autocomplete = 'email';
		this.emailInput.placeholder = 'E-Mail-Adresse';
		this.emailInput.style.position = 'absolute';
		this.emailInput.style.left = `${centerX - inputWidth / 2}px`;
		this.emailInput.style.top = `${centerY - inputHeight / 2 - (inputHeight + gap) - 50}px`;
		this.emailInput.style.width = `${inputWidth}px`;
		this.emailInput.style.height = `${inputHeight}px`;
		this.emailInput.style.fontSize = '16px';
		this.emailInput.style.zIndex = '10';
		this.emailInput.style.border = '1px solid #ccc'; // Standard-Rahmen

		// E-Mail-Validierung hinzufügen
		this.emailInput.addEventListener('input', (e) => {
			const email = (e.target as HTMLInputElement).value;
			const emailRegex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

			if (emailRegex.test(email)) {
				this.emailInput.style.border = '2px solid #4CAF50';
				this.feedbacktext.innerHTML = '';
			} else {
				if (this.emailInput.value.length > 0) {
					this.emailInput.style.border = '2px solid #f44336';
				} else {
					this.emailInput.style.border = '1px solid #ccc';
				}
			}
		});

		// Passwort-Text
		this.passwordtext = document.createElement('div');
		this.passwordtext.style.left = `${centerX - inputWidth / 2 + 70}px`;
		this.passwordtext.style.top = `${centerY - inputHeight / 2 - (inputHeight + gap + 10)}px`;
		this.passwordtext.innerText = 'Password';
		this.passwordtext.style.position = 'absolute';
		document.body.appendChild(this.passwordtext);

		// Passwort-Eingabefeld
		this.passwordInput = document.createElement('input');
		this.passwordInput.type = 'password';
		this.passwordInput.autocomplete = 'current-password';
		this.passwordInput.placeholder = 'Passwort';
		this.passwordInput.style.position = 'absolute';
		this.passwordInput.style.left = `${centerX - inputWidth / 2}px`;
		this.passwordInput.style.top = `${centerY - inputHeight / 2 - 25}px`;
		this.passwordInput.style.width = `${inputWidth}px`;
		this.passwordInput.style.height = `${inputHeight}px`;
		this.passwordInput.style.fontSize = '16px';
		this.passwordInput.style.zIndex = '10';

		// Elemente hinzufügen
		document.body.appendChild(this.emailInput);
		document.body.appendChild(this.passwordInput);

		// Login-Button
		const loginButton = this.add
			.image(centerX, centerY + 50, 'loginbutton')
			.setInteractive()
			.setScale(0.3, 0.3)
			.on('pointerdown', () => {
				this.handleLogin();
				this.handleClickSound();
			})
			.on('pointerover', () => loginButton.setScale(0.31, 0.31))
			.on('pointerout', () => loginButton.setScale(0.3, 0.3));

		// Registrieren-Button
		const registerButton = this.add
			.image(centerX, centerY + 120, 'registerbutton')
			.setInteractive()
			.setScale(0.3, 0.3)
			.on('pointerdown', () => {
				this.handleRegister();
				this.handleClickSound();
			})
			.on('pointerover', () => registerButton.setScale(0.31, 0.31))
			.on('pointerout', () => registerButton.setScale(0.3, 0.3));

		// Feedback-Text
		this.feedbacktext = document.createElement('div');
		this.feedbacktext.style.left = `${centerX - inputWidth / 2 + 30}px`;
		this.feedbacktext.style.top = `${centerY - inputHeight / 2 - (inputHeight + gap - 230)}px`;
		this.feedbacktext.style.position = 'absolute';
		this.feedbacktext.style.color = '#f44336';
		document.body.appendChild(this.feedbacktext);

		// Server-Kommunikation
		this.socket.on('loginSuccess', (message: string) => console.log(message));
		this.socket.on('loginFailed', (message: string) => console.log(message));

		// Spiel-Start-Text
		this.add
			.text(centerX - 100, centerY + inputHeight + 170, 'To the Game', {
				fontSize: '32px',
			})
			.setInteractive()
			.on('pointerdown', () => {
				this.scene.start('GameScene');
				this.scene.sleep();
			});
	}

	update() {}

	handleRegister() {
		const email = this.emailInput.value;
		const password = this.passwordInput.value;
		const emailRegex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

		if (!email || !password) {
			this.feedbacktext.innerHTML = 'Please fill all fields!';
			return;
		}

		if (!emailRegex.test(email)) {
			this.feedbacktext.innerHTML = 'Invalid email format!';
			this.emailInput.style.border = '2px solid #f44336';
			return;
		}

		fetch(`${API_URL}/auth/register`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ email, password }),
		})
			.then((response) => {
				if (response.ok) return response.json() as Promise<{ message: string }>;
				return response.json().then((errorData: { message: string }) => {
					throw new Error(errorData.message || 'Failed to register');
				});
			})
			.then((data) => (this.feedbacktext.innerHTML = data.message))
			.catch((error) => {
				console.error('Failed to register:', error.message);
				this.feedbacktext.innerHTML = error.message;
			});
	}

	handleLogin() {
		const email = this.emailInput.value;
		const password = this.passwordInput.value;
		const emailRegex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

		if (!email || !password) {
			this.feedbacktext.innerHTML = 'Please fill all fields!';
			return;
		}

		if (!emailRegex.test(email)) {
			this.feedbacktext.innerHTML = 'Invalid email format!';
			this.emailInput.style.border = '2px solid #f44336';
			return;
		}

		fetch(`${API_URL}/auth/login`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ email, password }),
		})
			.then((response) => {
				if (response.ok) return response.json();
				throw new Error('Login failed');
			})
			.then((data) => {
				if (data.token) {
					localStorage.setItem('token', data.token);
					this.feedbacktext.innerHTML = 'Login successfull!';
					this.deactivateInputs();
					this.scene.start('PlayerSelectionScene');
				} else {
					throw new Error('Undefined Server Error');
				}
			})
			.catch((error) => (this.feedbacktext.innerHTML = error.message));
	}

	validateToken(token: string) {
		fetch(`${API_URL}/auth/validateToken`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
		})
			.then((response) => {
				if (response.ok) {
					this.scene.start('PlayerSelectionScene');
				} else {
					localStorage.removeItem('token');
					throw new Error('Invalid token');
				}
			})
			.catch((error) => console.error('Token validation failed:', error));
	}

	deactivateInputs() {
		this.emailInput.style.display = 'none';
		this.passwordInput.style.display = 'none';
		this.feedbacktext.style.display = 'none';
		this.emailtext.style.display = 'none';
		this.passwordtext.style.display = 'none';
	}

	handleClickSound() {
		this.clickSound.play();
	}
}
