import Phaser from 'phaser';
import type { Socket } from 'socket.io-client';
import SocketManager from '../SocketManager.ts';

const HOST = import.meta.env.VITE_HOST_SERVER;
const PORT = import.meta.env.VITE_API_PORT;
const PROTOKOLL = import.meta.env.VITE_API_PROTOKOLL;
const API_URL = `${PROTOKOLL}://${HOST}:${PORT}`;

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
    window.addEventListener('resize', () => this.resizeUI());
    this.scale.on('resize', () => this.resizeUI());

    this.events.on('deactivateInputs', this.deactivateInputs, this);
    this.clickSound = this.sound.add('clickSound');

    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    const bg = this.add.image(0, 0, 'background').setOrigin(0).setName('background');
    this.graphics = this.add.graphics();

    this.add
      .image(centerX, centerY - 250, 'propania2')
      .setScale(0.8)
      .setName('propania2');

    this.emailtext = document.createElement('div');
    this.emailtext.innerText = 'E-Mail';
    this.emailtext.style.position = 'absolute';
    document.body.appendChild(this.emailtext);

    this.emailInput = document.createElement('input');
    this.emailInput.type = 'email';
    this.emailInput.placeholder = 'E-Mail-Adresse';
    this.emailInput.autocomplete = 'email';
    this.emailInput.style.position = 'absolute';
    this.emailInput.style.width = '200px';
    this.emailInput.style.height = '30px';
    this.emailInput.style.fontSize = '16px';
    this.emailInput.style.zIndex = '10';
    this.emailInput.style.border = '1px solid #ccc';
    this.emailInput.addEventListener('input', (e) => {
      const email = (e.target as HTMLInputElement).value;
      const emailRegex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
      if (emailRegex.test(email)) {
        this.emailInput.style.border = '2px solid #4CAF50';
        this.feedbacktext.innerHTML = '';
      } else {
        this.emailInput.style.border = email ? '2px solid #f44336' : '1px solid #ccc';
      }
    });
    document.body.appendChild(this.emailInput);

    this.passwordtext = document.createElement('div');
    this.passwordtext.innerText = 'Password';
    this.passwordtext.style.position = 'absolute';
    document.body.appendChild(this.passwordtext);

    this.passwordInput = document.createElement('input');
    this.passwordInput.type = 'password';
    this.passwordInput.placeholder = 'Passwort';
    this.passwordInput.autocomplete = 'current-password';
    this.passwordInput.style.position = 'absolute';
    this.passwordInput.style.width = '200px';
    this.passwordInput.style.height = '30px';
    this.passwordInput.style.fontSize = '16px';
    this.passwordInput.style.zIndex = '10';
    document.body.appendChild(this.passwordInput);

    this.add
      .image(centerX, centerY + 50, 'loginbutton')
      .setInteractive()
      .setScale(0.3)
      .setName('loginbutton')
      .on('pointerdown', () => {
        this.handleLogin();
        this.handleClickSound();
      });

    this.add
      .image(centerX, centerY + 120, 'registerbutton')
      .setInteractive()
      .setScale(0.3)
      .setName('registerbutton')
      .on('pointerdown', () => {
        this.handleRegister();
        this.handleClickSound();
      });

    this.feedbacktext = document.createElement('div');
    this.feedbacktext.style.position = 'absolute';
    this.feedbacktext.style.color = '#f44336';
    document.body.appendChild(this.feedbacktext);

    this.add
      .text(centerX - 100, centerY + 170, 'To the Game', { fontSize: '32px' })
      .setInteractive()
      .setName('toGameText')
      .on('pointerdown', () => {
        this.scene.start('GameScene');
        this.scene.sleep();
      });

    this.socket.on('loginSuccess', (message: string) => console.log(message));
    this.socket.on('loginFailed', (message: string) => console.log(message));

    this.resizeUI();
  }

  private resizeUI() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    const bg = this.children.getByName('background') as Phaser.GameObjects.Image;
    if (bg) {
      const scaleX = this.scale.width / bg.width;
      const scaleY = this.scale.height / bg.height;
      const scale = Math.max(scaleX, scaleY);
      bg.setScale(scale).setPosition(0, 0);
    }

    if (this.graphics) {
      this.graphics.clear();
      this.graphics.fillStyle(0xdeb887, 1);
      this.graphics.fillRoundedRect(centerX - 150, centerY - 150, 300, 400, 20);
    }

    const propania = this.children.getByName('propania2') as Phaser.GameObjects.Image;
    if (propania) propania.setPosition(centerX, centerY - 250);

    const loginBtn = this.children.getByName('loginbutton') as Phaser.GameObjects.Image;
    if (loginBtn) loginBtn.setPosition(centerX, centerY + 50);

    const registerBtn = this.children.getByName('registerbutton') as Phaser.GameObjects.Image;
    if (registerBtn) registerBtn.setPosition(centerX, centerY + 120);

    const gameText = this.children.getByName('toGameText') as Phaser.GameObjects.Text;
    if (gameText) gameText.setPosition(centerX - 100, centerY + 170);

    const inputWidth = 200;
    const inputHeight = 30;
    const gap = 20;

    this.emailtext.style.left = `${centerX - inputWidth / 2 + 70}px`;
    this.emailtext.style.top = `${centerY - inputHeight / 2 - (inputHeight + gap) - 80}px`;

    this.emailInput.style.left = `${centerX - inputWidth / 2}px`;
    this.emailInput.style.top = `${centerY - inputHeight / 2 - (inputHeight + gap) - 50}px`;

    this.passwordtext.style.left = `${centerX - inputWidth / 2 + 70}px`;
    this.passwordtext.style.top = `${centerY - inputHeight / 2 - (inputHeight + gap + 10)}px`;

    this.passwordInput.style.left = `${centerX - inputWidth / 2}px`;
    this.passwordInput.style.top = `${centerY - inputHeight / 2 - 25}px`;

    this.feedbacktext.style.left = `${centerX - inputWidth / 2 + 30}px`;
    this.feedbacktext.style.top = `${centerY - inputHeight / 2 - (inputHeight + gap - 230)}px`;
  }

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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
      .then((res) => res.ok ? res.json() : res.json().then(err => { throw new Error(err.message); }))
      .then((data) => this.feedbacktext.innerHTML = data.message)
      .catch((err) => {
        console.error('Failed to register:', err.message);
        this.feedbacktext.innerHTML = err.message;
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
      .then((res) => res.ok ? res.json() : Promise.reject('Login failed'))
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
      .catch((err) => this.feedbacktext.innerHTML = err);
  }

  validateToken(token: string) {
    fetch(`${API_URL}/auth/validateToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.ok ? this.scene.start('PlayerSelectionScene') : Promise.reject('Invalid token'))
      .catch((err) => {
        console.error('Token validation failed:', err);
        localStorage.removeItem('token');
      });
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