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
	private inventoryPanel?: Phaser.GameObjects.Graphics;
	private inventoryOverlay?: Phaser.GameObjects.Rectangle;
	private invetoryItemGroup?: Phaser.GameObjects.Group;

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
				color: '#000000',
				backgroundColor: '#FFD700',
			})
			.setScrollFactor(0)
			.setShadow(5, 5, '#FF4500', 5, true, true);

		(this.playerExp = this.add
			.text(20, 30, `EXP:${this.playerData.exp}`, {
				fontSize: '18px',
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
				color: '#ffffff',
			})
			.setScrollFactor(0);

		this.velocityText = this.add
			.text(10, this.cameras.main.height - 200, 'Velocity: (0, 0)', {
				fontSize: '18px',
				color: '#ffffff',
			})
			.setScrollFactor(0);

		this.lastDirection = this.add
			.text(10, this.cameras.main.height - 220, 'Velocity: (0, 0)', {
				fontSize: '18px',
				color: '#ffffff',
			})
			.setScrollFactor(0);

		// Joystick-Position und Größe
		const joystickRadius = 50;
		const joystickX = 100;
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
		this.events.on('updateVelocity', this.updateVelocity, this);
		this.events.on('lastDirection', this.updatelastDirection, this);
		this.events.on('openInventory', this.openInventory, this);

		this.actionbutton = this.add
			.sprite(
				this.cameras.main.width - 100,
				this.cameras.main.height - 100,
				'actionbutton'
			)
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

		// Overlay für Input-Blockierung
		this.inventoryOverlay = this.add
			.rectangle(
				this.scale.width / 2,
				this.scale.height / 2,
				panelWidth,
				panelHeight,
				0x000000,
				0
			)
			.setInteractive()
			.setVisible(false)
			.setScrollFactor(1);

		this.invetoryItemGroup = this.add.group({});
		// Panel selbst
		this.inventoryPanel = this.add.graphics();
		this.inventoryPanel
			.fillStyle(0xdeb887, 0.8)
			.fillRect(panelX, panelY, panelWidth, panelHeight)
			.lineStyle(2, 0x000000)
			.strokeRect(panelX, panelY, panelWidth, panelHeight)
			.setVisible(false)
			.setScrollFactor(1);

		this.socket.on('loadInventory', (loadedInventory: Inventory[]) => {
			this.inventory = loadedInventory[0];
		});
	}

	openInventory(isOpen: boolean) {
		{
			isOpen && this.getInventory();
			isOpen && this.loadInventoryItems(this.inventoryPanel);
			this.inventoryOverlay?.setVisible(isOpen);
			this.inventoryPanel!.setVisible(isOpen);
			!isOpen && this.deleteInventoryItems();
		}
	}

	updatePlayerPosition(playerX: number, playerY: number) {
		// Aktualisiere den Text mit der aktuellen Spielerposition
		this.uiText!.setText(
			`Player Position: (${Math.round(playerX)}, ${Math.round(playerY)})`
		);
	}

	updateVelocity(velocityX: number, velocityY: number) {
		this.velocityText!.setText(
			`Velocity: (${Math.round(velocityX)}, ${Math.round(velocityY)}})`
		);
	}

	updatelastDirection(lastDirection: Direction) {
		this.lastDirection!.setText(`lastDirection: ${lastDirection}`);
	}

	getInventory() {
		this.socket.emit('getInventory', this.playerData.id);
	}

	loadInventoryItems(inventoryPanel: Phaser.GameObjects.Graphics | undefined) {
		if (this.inventoryPanel) {
			let counter = 1;
			const heightOffset = 50; // Höhe des Panels
			const itemHeight = 30; // Höhe jedes Items

			this.inventory.forEach((item) => {
				counter++;
				const itemicon = this.add
					.image(
						this.scale.width / 2 - 500,
						this.scale.height / 2 - 440 + counter * heightOffset,
						'Mushroom'
					)
					.setOrigin(0.5, 0.5)
					.setScale(0.1, 0.1)
					.setScrollFactor(1)
					.setInteractive();

				const itemText = this.add.text(
					this.scale.width / 2 + 20 - 500,
					this.scale.height / 2 - 440 + counter * heightOffset - 10,
					`${item.name} (${item.quantity})`,
					{
						fontSize: '18px',
						color: '#000000',
					}
				);

				this.invetoryItemGroup?.add(itemicon);
				this.invetoryItemGroup?.add(itemText);
			});
		}
	}

	deleteInventoryItems() {
		if (this.invetoryItemGroup) {
			this.invetoryItemGroup.clear(true, true);
		}
	}
}
