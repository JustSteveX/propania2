import Phaser from 'phaser';
import type { Socket } from 'socket.io-client';
import SocketManager from '../SocketManager.ts';
import type { Item } from '../types/item.type.ts';
import type { Player } from '../types/players.type.ts';
import { Direction } from '../types/direction.enum.ts';
import InputManager from '../controls/InputManager.js';
import CameraControl from '../controls/CameraControl.js';
import TreeManager from '../gameobjects/TreeManager.ts';
import type { Vector2D } from '../types/direction.enum.ts';
import type { Inventory } from 'src/types/inventory.type.ts';
import AnimationManager from '../animations/AnimationManager.js';
import { preloadAssets } from '../assets/GameSceneAssetLoader.ts';

export default class GameScene extends Phaser.Scene {
	//Setup
	private socket: Socket;

	//Player
	private player?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
	private playerData!: Player;
	private players: {
		[id: string]: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
	} = {};
	private playersGroup!: Phaser.Physics.Arcade.Group;
	private actionzoneOffset?: Vector2D;
	private actionzone?: Phaser.GameObjects.Rectangle;
	private inventory: Inventory = [];

	//Player Controls
	private cameraControl?: CameraControl;
	private inputManager?: InputManager;
	private animationManager?: AnimationManager;

	//Items
	private itemsGroup!: Phaser.Physics.Arcade.Group;
	private items: Item[] = [];
	private overlapping?: boolean;

	//Objects
	private tree?: Phaser.Physics.Arcade.Sprite;
	private objects: Phaser.Physics.Arcade.Sprite[] = [];
	private objectsGroup!: Phaser.Physics.Arcade.Group;

	// Map and Layers
	private groundLayer?: Phaser.Tilemaps.TilemapLayer;
	private obstaclesLayer?: Phaser.Tilemaps.TilemapLayer;

	//Sounds
	private popsound!: Phaser.Sound.BaseSound;
	private cuttingtreesound!: Phaser.Sound.BaseSound;
	private treefallsound!: Phaser.Sound.BaseSound;
	private treefalldownsound!: Phaser.Sound.BaseSound;

	//#########################################################################################################################################//

	constructor() {
		super({ key: 'GameScene' });
		this.socket = SocketManager.getSocket();
	}

	init(data: { playerdata: Player }) {
		document.getElementById('playernametext')?.remove();
		document.getElementById('playernameinput')?.remove();
		document.getElementById('feedbacktext')?.remove();

		this.playerData = data.playerdata;
		this.playerData.socket_id = this.socket.id;
		this.scene.remove('PlayerSelectionScene');
		this.scene.launch('UIScene', { playerData: this.playerData });
	}

	preload() {
		preloadAssets(this);
	}

	create() {
		// init TreeManager
		const treeManager = new TreeManager(this);

		// Audio
		this.popsound = this.sound.add('popsound');
		this.cuttingtreesound = this.sound.add('cuttingtree');
		this.treefallsound = this.sound.add('treefall');
		this.treefalldownsound = this.sound.add('treefalldown');
		this.itemsGroup = this.physics.add.group();

		// Load Items
		this.socket.emit('loadItems');
		this.socket.on('getItems', (receivedItems: Item[]) => {
			this.items = [];
			this.items = receivedItems;

			this.items.forEach((item) => {
				const itemSprite = this.itemsGroup.create(
					item.x,
					item.y,
					item.name
				) as Phaser.Physics.Arcade.Sprite & { itemData?: Item };
				itemSprite.itemData = item;
				itemSprite.setScale(0.5);
				itemSprite.setDepth(10);
				itemSprite.setDisplaySize(8, 8);
				if (itemSprite.body) {
					itemSprite.body.setSize(256, 256);
				}
			});
		});
		this.socket.on('destroyItem', (itemid) => {
			this.itemsGroup.children.iterate((item) => {
				const itemSprite = item as Phaser.Physics.Arcade.Sprite & {
					itemData?: Item;
				};
				if (itemSprite.itemData?.id === itemid) {
					itemSprite.destroy();
				}
				return true;
			});
		});

		// Load Invetory

		this.socket.emit('getInventory', this.playerData.id);
		this.socket.on('loadInventory', (inventory: Inventory[]) => {
			this.inventory = inventory[0];
		});

		// Spielergruppe initialisieren
		this.playersGroup = this.physics.add.group();

		this.socket.emit('login', { ...this.playerData, id: this.socket.id });

		this.socket.on('currentPlayers', (serverPlayers) => {
			//console.log('Empfangene Spieler:', serverPlayers);
			Object.keys(serverPlayers).forEach((id) => {
				//console.log('Spieler wird hinzugefügt:', serverPlayers[id]);
				this.addPlayer(this, id, serverPlayers[id]);
			});
		});

		this.socket.on('newPlayer', (data) => {
			this.addPlayer(this, data.socket_id, data);
		});

		this.socket.on('playerMoved', (data) => {
			// data.id entspricht der Socket-ID des bewegten Spielers
			if (this.players[data.socket_id]) {
				this.updatePlayer(this.players[data.socket_id], data);
				// Falls der Server den animationKey mitgesendet hat, Animation aktualisieren
				if (data.animationKey) {
					this.players[data.socket_id].anims.play(data.animationKey, true);
				}
			}
		});

		this.socket.on('playerDisconnected', (id) => {
			this.players[id]?.destroy();
			this.playersGroup?.remove(this.players[id], true, true);
			delete this.players[id];
		});

		// Karte erstellen
		const map = this.make.tilemap({ key: 'map' });
		const groundTiles = map.addTilesetImage('Ground', 'ground');
		const treeLeavesTiles = map.addTilesetImage('TreeLeaves', 'treeleaves');
		const treesTiles = map.addTilesetImage('Trees', 'trees');

		this.groundLayer = map.createLayer('Ground', groundTiles!, 0, 0)!;
		this.obstaclesLayer = map.createLayer(
			'Obstacles',
			[treeLeavesTiles!, treesTiles!],
			0,
			0
		)!;
		this.obstaclesLayer.setCollisionByExclusion([-1]);

		// Create Objects

		// Objekte-Gruppe initialisieren
		this.objectsGroup = this.physics.add.group();

		// Bäume erstellen

		const tree = treeManager.createTree(0, 400);
		this.objectsGroup.add(tree);

		// Falls der lokale Spieler schon existiert, initialisiere Steuerung und Animationen
		if (this.player) {
			this.cameraControl = new CameraControl(this, this.player);
			this.inputManager = new InputManager(
				this,
				this.player,
				this.cameraControl
			);
			this.animationManager = new AnimationManager(this, this.player);
		}

		this.actionzoneOffset = { x: 10, y: 10 }; // Offset für die actionzone relativ zum Spieler
		this.actionzone = this.add.rectangle(
			(this.player?.x ?? 0) + (this.actionzoneOffset?.x ?? 0),
			(this.player?.y ?? 0) + (this.actionzoneOffset?.y ?? 0),
			10,
			10,
			0xff0000,
			0.5
		);
		this.actionzone.setAlpha(0);

		this.physics.add.existing(this.actionzone, false); // **Dynamisch statt statisch**
		this.actionzone.setDepth(11);

		// Collisions
		this.physics.add.collider(this.playersGroup, this.objectsGroup);
		this.physics.add.collider(this.playersGroup, this.playersGroup);

		// Cutting Trees
		if (this.actionzone) {
			this.physics.add.collider(
				this.actionzone,
				treeManager.getTrees(),
				(player, collidedTree) => {
					if (this.inputManager) {
						treeManager.setupCuttingInteraction(
							this.actionzone as Phaser.GameObjects.GameObject,
							this.inputManager,
							this.player,
							this.playerData,
							this.cuttingtreesound,
							this.treefallsound,
							this.treefalldownsound,
							this.popsound,
							this.tweens
						);
					}
				}
			);
		}

		// Physics

		this.physics.add.overlap(
			this.actionzone as Phaser.GameObjects.GameObject,
			this.itemsGroup,
			this.pickupItem as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
			undefined,
			this
		);
	}

	update() {
		if (
			!this.player ||
			!this.inputManager ||
			!this.animationManager ||
			!this.cameraControl
		) {
			return;
		}

		// Object Layers update

		Object.values(this.players).forEach((playerSprite) => {
			playerSprite.setDepth(playerSprite.body.y);
		});

		this.objectsGroup?.children.iterate((obj) => {
			const sprite = obj as Phaser.Physics.Arcade.Sprite;
			if (sprite.body) {
				sprite.setDepth(sprite.body.y);
			}
			return true;
		});

		// Spielerbewegung
		const velocity = this.inputManager.handlePlayerMovement();
		const direction: Direction = this.inputManager.getDirection();
		// Ermittelt den aktuellen Animations-Key (z. B. 'walk_up', 'idle_right', etc.)

		this.animationManager?.updateState(
			direction,
			[velocity[0], velocity[1]],
			this.inputManager.getAction()
		);

		const currentAnimKey = this.animationManager.getCurrentAnimationKey();

		// Kamera aktualisieren
		this.cameraControl.update();

		// Spielerdaten aktualisieren
		this.playerData.positionX = this.player.x;
		this.playerData.positionY = this.player.y;
		this.playerData.velocityX = this.player.body.velocity.x;
		this.playerData.velocityY = this.player.body.velocity.y;
		this.playerData.direction = direction;
		// Sende die Spielerdaten inkl. currentAnimKey an den Server
		this.socket.emit('playerMovement', {
			...this.playerData,
			animationKey: currentAnimKey,
		});
		this.scene
			.get('UIScene')
			.events.emit('updatePlayerPosition', this.player.x, this.player.y);

		// Actionzone mit dem Spieler bewegen
		this.actionzone!.setPosition(
			this.player!.x + this.actionzoneOffset!.x,
			this.player!.y + this.actionzoneOffset!.y - 15
		);
		this.setActionzoneDirection(this.actionzone!, direction);

		// Items
		this.itemsGroup.children.iterate((item) => {
			const itemSprite = item as Phaser.Physics.Arcade.Sprite;

			const isOverlapping = this.actionzone
				? this.physics.overlap(this.actionzone, itemSprite)
				: false;

			if (isOverlapping) {
				itemSprite.setAlpha(0.5);
			} else {
				itemSprite.setAlpha(1);
			}

			return true;
		});
	}

	addPlayer(scene: Phaser.Scene, id: string, data: Player) {
		const newPlayer = scene.physics.add.sprite(
			data.positionX,
			data.positionY,
			'player',
			26
		);

		// Setze den lokalen Spieler, wenn die IDs übereinstimmen
		if (data.socket_id === this.socket.id) {
			this.player =
				newPlayer as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
			this.cameraControl = new CameraControl(this, this.player);
			this.inputManager = new InputManager(
				this,
				this.player,
				this.cameraControl
			);
			this.animationManager = new AnimationManager(this, this.player);
		}
		newPlayer.setOrigin(0.5, 0.5);
		newPlayer.setScale(0.5);
		newPlayer.setData('name', data.name);
		newPlayer.setData('money', data.level);
		newPlayer.setData('exp', data.exp);
		newPlayer.setData('level', data.level);
		newPlayer.body.setSize(16, 16);
		newPlayer.body.setOffset(24, 45);
		newPlayer.setDepth(newPlayer.body.y);
		newPlayer.setOrigin(0.5, 1);
		//	newPlayer.body.setAllowGravity(false);
		//newPlayer.body.setBounce(0);
		this.physics.world.enable(newPlayer);
		this.playersGroup.add(newPlayer);

		// Für Remote-Spieler eine Standardanimation starten
		if (data.socket_id !== this.socket.id) {
			newPlayer.anims.play('idle_down', true);
		}

		// Spieler zur Liste hinzufügen (Schlüssel ist die Socket-ID)
		this.players[id] = newPlayer;
	}

	updatePlayer(
		player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
		data: Player
	) {
		if (player) {
			player.setPosition(data.positionX, data.positionY);
			player.setVelocityX(data.velocityX);
			player.setVelocityY(data.velocityY);
			player.setData('direction', data.direction);
		}
	}

	async updateplayerData(playerData: Player) {
		try {
			const response = await fetch('/updateplayer', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${localStorage.getItem('token')}`,
				},
				body: JSON.stringify({
					playerData,
				}),
			});

			if (!response.ok) {
				console.error(
					'Fehler beim Aktualisieren des Spielers:',
					await response.json()
				);
			} else {
				console.log('Spieler erfolgreich aktualisiert.');
			}
		} catch (error) {
			console.error('Fetch-Fehler:', error);
		}
	}

	setActionzoneDirection(
		actionzone: Phaser.GameObjects.Rectangle,
		direction: Direction
	): void {
		const offsets: {
			left: Vector2D;
			right: Vector2D;
			up: Vector2D;
			down: Vector2D;
		} = {
			left: { x: -10, y: 10 },
			right: { x: 10, y: 10 },
			up: { x: 0, y: 0 },
			down: { x: 0, y: 20 },
		};
		if (!!offsets[direction]) {
			this.actionzoneOffset = offsets[direction];
		}

		direction === Direction.UP
			? actionzone.setDepth(8)
			: actionzone.setDepth(11);
	}

	pickupItem(
		player: Phaser.GameObjects.GameObject,
		item: Phaser.GameObjects.GameObject
	): void {
		const pickedItem = item as Phaser.Physics.Arcade.Sprite & {
			itemData?: Item;
			alreadyPickedUp?: boolean;
		};

		pickedItem.setAlpha(0.5);

		if (pickedItem.alreadyPickedUp) {
			return;
		}

		if (this.inputManager?.isActionPressed() && pickedItem.itemData) {
			pickedItem.alreadyPickedUp = true;
			this.time.delayedCall(500, () => {
				this.socket.emit('pickupItem', [
					this.playerData.socket_id,
					pickedItem.itemData?.id,
				]);
				this.popsound.play();
				pickedItem.destroy();
				this.inputManager?.setAction(false);
				this.socket.emit('getInventory', this.playerData.id);
			});
		}
	}
}
