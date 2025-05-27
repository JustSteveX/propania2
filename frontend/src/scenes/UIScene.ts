import Phaser from 'phaser';
import type { Socket } from 'socket.io-client';
import SocketManager from '../SocketManager.ts';
import type { Player } from 'src/types/players.type.ts';
import { preloadUIAssets } from '../assets/UISceneAssetLoader.ts';
import type { Direction } from '../types/direction.enum';
import type { Inventory } from '../types/inventory.type.ts';

export default class UIScene extends Phaser.Scene {
	private playerLvL?: Phaser.GameObjects.Text;
	private playerExp?: Phaser.GameObjects.Text;
	private playerMoney?: Phaser.GameObjects.Text;
	private inventory: Inventory = [];

	private uiText?: Phaser.GameObjects.Text;
	private velocityText?: Phaser.GameObjects.Text;
	private lastDirection?: Phaser.GameObjects.Text;
	private isDragging?: boolean;
	private pointer?: Phaser.Input.Pointer;
	private joystickBase?: Phaser.GameObjects.Arc;
	private joystickStick?: Phaser.GameObjects.Arc;
	private socket: Socket;
	private playerData!: Player;
	private actionbutton?: Phaser.GameObjects.Sprite;

	private htmlInventoryContainer?: HTMLDivElement;

	constructor() {
		super({ key: 'UIScene' });
		this.socket = SocketManager.getSocket();
	}

	init(data: { playerData?: Player }) {
		if (data.playerData) {
			this.playerData = data.playerData;
		}
	}

	preload() {
		preloadUIAssets(this);
	}

	create() {
		this.playerLvL = this.add
			.text(10, 30, `LvL:${this.playerData.level}`, {
				fontSize: '18px',
				fontFamily: 'PerryGothic',
				color: '#000000',
				backgroundColor: '#FFD700',
			})
			.setScrollFactor(0)
			.setShadow(5, 5, '#FF4500', 5, true, true);

		(this.playerExp = this.add
			.text(20, 30, `EXP:${this.playerData.exp}`, {
				fontSize: '18px',
				fontFamily: 'PerryGothic',
				color: '#000000',
				backgroundColor: '#FFD700',
			})
			.setScrollFactor(0)
			.setShadow(5, 5, '#FF4500', 5, true, true)).setPosition(
			screen.availWidth / 2 - this.playerExp.displayWidth / 2,
			30
		);

		(this.playerMoney = this.add
			.text(10, 30, `${this.playerData.money}G`, {
				fontSize: '18px',
				fontFamily: 'PerryGothic',
				color: '#000000',
				backgroundColor: '#FFD700',
			})
			.setScrollFactor(0)
			.setShadow(5, 5, '#FF4500', 5, true, true)).setPosition(
			screen.availWidth - this.playerMoney.displayWidth - 10,
			30
		);

		// Füge den Text in der linken unteren Ecke hinzu
		this.uiText = this.add
			.text(10, this.cameras.main.height - 30, 'Player Position: (0, 0)', {
				fontSize: '18px',
				fontFamily: 'PerryGothic',
				color: '#ffffff',
			})
			.setScrollFactor(0);

		// Joystick-Position und Größe
		const joystickRadius = 50;
		const joystickX = 80;
		const joystickY = this.cameras.main.height - 100;

		// Joystick-Basis und Stick erstellen
		this.joystickBase = this.add
			.circle(joystickX, joystickY, joystickRadius, 0x888888)
			.setScrollFactor(0);
		this.joystickStick = this.add
			.circle(joystickX, joystickY, 25, 0xffffff)
			.setScrollFactor(0);

		// Joystick-Eingabesteuerung
		this.isDragging = false;

		this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
			const distance = Phaser.Math.Distance.Between(
				pointer.x,
				pointer.y,
				joystickX,
				joystickY
			);
			if (distance <= joystickRadius) {
				this.isDragging = true;
			}
		});

		this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
			if (this.isDragging) {
				const angle = Phaser.Math.Angle.Between(
					joystickX,
					joystickY,
					pointer.x,
					pointer.y
				);
				const distance = Phaser.Math.Clamp(
					Phaser.Math.Distance.Between(
						pointer.x,
						pointer.y,
						joystickX,
						joystickY
					),
					0,
					joystickRadius
				);

				const stickX = joystickX + Math.cos(angle) * distance;
				const stickY = joystickY + Math.sin(angle) * distance;

				this.joystickStick!.setPosition(stickX, stickY);

				// Normalisierte Richtung für Bewegung
				const normalizedX = (stickX - joystickX) / joystickRadius;
				const normalizedY = (stickY - joystickY) / joystickRadius;

				// Sende Bewegungsdaten an die Hauptszene
				this.events.emit('joystickMove', normalizedX, normalizedY);
			}
		});

		this.input.on('pointerup', () => {
			this.isDragging = false;
			this.joystickStick!.setPosition(joystickX, joystickY);

			// Bewegungsdaten zurücksetzen
			this.events.emit('joystickMove', 0, 0);
		});

		// EventListener für Spielerposition (von der Hauptszene aktualisiert)
		this.events.on('updatePlayerPosition', this.updatePlayerPosition, this);
		//this.events.on('updateVelocity', this.updateVelocity, this);
		//	this.events.on('lastDirection', this.updatelastDirection, this);
		this.events.on('openInventory', this.openInventory, this);

		this.actionbutton = this.add
			.sprite(80, this.cameras.main.height - 220, 'actionbutton')

			.setInteractive()
			.on('pointerdown', () => {
				this.events.emit('uiAction');
				this.actionbutton!.setScale(1.2);
				console;
			})
			.on('pointerup', () => {
				this.events.emit('uiActionreleased');
				this.actionbutton!.setScale(1.0);
			});

		const sizeFactor = 0.8; // 0.5 = 50% des Bildschirms

		const panelWidth = this.scale.width * sizeFactor;
		const panelHeight = this.scale.height * sizeFactor;

		const panelX = this.scale.width / 2 - panelWidth / 2;
		const panelY = this.scale.height / 2 - panelHeight / 2;

		this.socket.on('loadInventory', (loadedInventory: Inventory[]) => {
			this.inventory = loadedInventory[0];
		});

		//HTML-Elemente für das Inventar
		this.htmlInventoryContainer = document.createElement('div');
		this.htmlInventoryContainer.id = 'inventoryContainer';
		document.body.appendChild(this.htmlInventoryContainer);
	}

	openInventory(isOpen: boolean) {
		{
			this.getInventory();
			this.loadInventoryItems();
			this.htmlInventoryContainer!.style.visibility = isOpen
				? 'visible'
				: 'hidden';
			!isOpen && this.deleteInventoryItems();
		}
	}

	updatePlayerPosition(playerX: number, playerY: number) {
		// Aktualisiere den Text mit der aktuellen Spielerposition
		this.uiText!.setText(
			`Player Position: (${Math.round(playerX)}, ${Math.round(playerY)})`
		);
	}

	getInventory() {
		this.socket.emit('getInventory', this.playerData.id);
	}

	loadInventoryItems() {
		let counter = 1;

		this.inventory.forEach((item) => {
			counter++;
			const itemicon = document.createElement('img');
			itemicon.src = item.icon;
			const itemInventory = document.createElement('div');
			itemInventory.className = 'inventoryItem';
			itemInventory.appendChild(itemicon);
			document.body.appendChild(itemInventory);
			this.htmlInventoryContainer!.appendChild(itemInventory);

			const itemText = document.createElement('p');
			itemText.innerText = `${item.name} x${item.quantity}`;
			itemInventory.appendChild(itemText);
		});
	}

	deleteInventoryItems() {
		if (this.htmlInventoryContainer) {
			this.htmlInventoryContainer.innerHTML = '';
		}
		this.socket.emit('getInventory', this.playerData.id);
	}
}
