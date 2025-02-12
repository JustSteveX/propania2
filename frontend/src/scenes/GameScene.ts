import CameraControl from '../controls/CameraControl.js';
import InputManager from '../controls/InputManager.js';
import AnimationManager from '../animations/AnimationManager.js';
import Phaser from 'phaser';
import type { Vector2D } from '../types/direction.enum.ts';
import { Direction } from '../types/direction.enum.ts';
import type { Player } from '../types/players.type.ts';
import SocketManager from '../SocketManager.ts';
import type { Socket } from 'socket.io-client';

export default class GameScene extends Phaser.Scene {
	private playerData!: Player;
	private player?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
	private item?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

	private actionzoneOffset?: Vector2D;

	private spriteObjects: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody[] =
		[];
	private actionzone?: Phaser.GameObjects.Rectangle;
	private blueRectangle?: Phaser.GameObjects.Rectangle;

	private treeGroup?: Phaser.GameObjects.Group;

	private groundLayer?: Phaser.Tilemaps.TilemapLayer;
	private obstaclesLayer?: Phaser.Tilemaps.TilemapLayer;

	private cameraControl?: CameraControl;
	private inputManager?: InputManager;
	private animationManager?: AnimationManager;
	private playerNameText?: Phaser.GameObjects.Text;
	private socket: Socket;

	constructor() {
		super({ key: 'GameScene' });
		this.socket = SocketManager.getSocket();
	}

	init(data: { playerdata: Player }) {
		if (data.playerdata) {
			this.playerData = data.playerdata;
			console.log('Player received in GameScene:', this.playerData);
		} else {
			console.warn('No player data received!');
		}
		this.scene.get('PlayerSelectionScene').events.emit('deactivateInputs');
		this.scene.sleep('PlayerSelectionScene');
		this.scene.launch('UIScene', { playerData: this.playerData });
	}

	preload() {
		// Assets laden
		this.load.tilemapTiledJSON('map', 'assets/map/maps/map.json');
		this.load.image('ground', 'assets/map/images/Ground.png');
		this.load.image('treeleaves', 'assets/map/images/TreeLeaves.png');
		this.load.image('trees', 'assets/map/images/TreeStump.png');
		this.load.image('stone', 'assets/map/images/stone.png');
		this.load.image('item', 'assets/images/pickaxe2.png');
		this.load.image({
			key: 'tree',
			url: 'assets/images/Tree_isometric.png',
			frameConfig: {
				frameWidth: 360,
				frameHeight: 360,
			},
		});
		this.load.spritesheet({
			key: 'player',
			url: 'assets/players/Player_Template.png',
			frameConfig: {
				frameWidth: 64,
				frameHeight: 64,
			},
		});
	}

	create() {
		// Spieler erstellen
		this.player = this.physics.add
			.sprite(
				this.playerData.positionX,
				this.playerData.positionY,
				'player',
				26
			)
			.setOrigin(0.5, 0.5)
			.setScale(0.5);
		this.player.setData('name', this.playerData.name);
		this.player.setData('money', this.playerData.level);
		this.player.setData('exp', this.playerData.exp);
		this.player.setData('level', this.playerData.level);

		this.physics.world.enable(this.player);
		this.player.body.setSize(16, 16);
		this.player.setDepth(10);
		this.spriteObjects.push(this.player);
		this.player.setOrigin(0.5, 1);

		// Spielername über dem Kopf anzeigen
		this.playerNameText = this.add
			.text(
				this.player.x,
				this.player.y - 30, // Position über dem Spieler
				this.player.getData('name'), // Name aus gespeicherten Daten holen
				{
					fontSize: '8px',
					fontFamily: 'Arial',
					color: '#ffffff',
					padding: { left: 5, right: 5, top: 2, bottom: 2 },
					align: 'center',
				}
			)
			.setOrigin(0.5)
			.setDepth(10);

		// Actionzone erstellen
		this.actionzoneOffset = { x: 10, y: 10 }; // Offset für die actionzone relativ zum Spieler
		this.actionzone = this.add.rectangle(
			this.player.x + this.actionzoneOffset.x,
			this.player.y + this.actionzoneOffset.y,
			10,
			10,
			0xff0000,
			0.5
		);

		this.physics.add.existing(this.actionzone, false); // **Dynamisch statt statisch**
		this.actionzone.setDepth(11);
		this.spriteObjects.push(this.player!);

		this.blueRectangle = this.add.rectangle(-150, 900, 20, 20, 0x0000ff, 0.5);
		this.physics.add.existing(this.blueRectangle, true);
		this.blueRectangle.setDepth(10);

		this.physics.add.collider(this.player, this.blueRectangle);

		this.item = this.physics.add
			.sprite(-48, 952, 'item')
			.setOrigin(0.5, 0.5)
			.setScale(0.5);
		this.physics.world.enable(this.item);
		this.item.body.setSize(32, 32);
		this.item.setDepth(9);

		//Groups
		this.treeGroup = this.add.group();

		// Füge mehrere Bäume an zufälligen Positionen hinzu
		for (let i = 0; i < 10; i++) {
			const x = Phaser.Math.Between(0, 200);
			const y = Phaser.Math.Between(700, 1000);
			const tree = this.physics.add
				.sprite(x, y, 'tree')
				.setDepth(9)
				.setScale(0.5);
			const stumpHeight = 20;
			const stumpWidth = tree.width * 0.15;
			tree.setSize(stumpWidth, stumpHeight);
			tree.setOffset(
				(tree.width - stumpWidth) / 2,
				tree.height - stumpHeight - 30
			);
			tree.setOrigin(0.5, 0.9);
			tree.setImmovable(true);
			this.spriteObjects.push(tree);
			this.treeGroup.add(tree);
		}

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
		this.physics.add.collider(this.player, this.obstaclesLayer);

		// Kollisionserkennung für Zone
		this.physics.add.collider(this.actionzone, this.blueRectangle);
		this.physics.add.overlap(
			this.actionzone,
			this.treeGroup,
			this.handleActionzoneCollision,
			undefined,
			this
		);
		this.physics.add.collider(
			this.player,
			this.treeGroup,
			undefined,
			undefined,
			this
		);

		// Kollisionserkennung für Actionzone und Baum
		this.physics.add.overlap(
			this.actionzone,
			this.treeGroup,
			this.handleActionzoneCollision,
			undefined,
			this
		);

		// Überwachung der Kollisionen, um den Alpha-Wert zurückzusetzen, wenn der Spieler nicht mehr überlappt
		this.physics.world.on('worldstep', () => {
			this.treeGroup!.getChildren().forEach((tree) => {
				if (
					!this.isPlayerOverlappingTree(
						tree as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
					)
				) {
					(tree as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody).setAlpha(
						1
					);
				}
			});
		});

		// Input Manager und Kamera-Steuerung
		this.cameraControl = new CameraControl(this, this.player);
		this.inputManager = new InputManager(this, this.player, this.cameraControl);

		// Animationen
		this.animationManager = new AnimationManager(this, this.player);

		// Spieler-Updates empfangen
		this.socket.on('playerJoined', (playerData: Player) => {
			this.addOtherPlayer(playerData);
		});

		this.socket.on('playerLeft', (playerData: Player) => {
			this.removeOtherPlayer(playerData);
		});

		this.socket.on('playerUpdated', (playerData: Player) => {
			this.updateOtherPlayer(playerData);
		});

		this.socket.on('currentPlayers', (players: Player[]) => {
			players.forEach((playerData: Player) => {
				if (playerData.id !== this.playerData.id) {
					this.addOtherPlayer(playerData);
				}
			});
		});
	}

	addOtherPlayer(playerData: Player) {
		const otherPlayer = this.physics.add
			.sprite(playerData.positionX, playerData.positionY, 'player')
			.setOrigin(0.5, 0.5)
			.setScale(0.5);
		otherPlayer.setData('id', playerData.id);
		this.spriteObjects.push(otherPlayer);

		// Spielername über dem Kopf anzeigen
		const playerNameText = this.add
			.text(otherPlayer.x, otherPlayer.y - 30, playerData.name, {
				fontSize: '8px',
				fontFamily: 'Arial',
				color: '#ffffff',
				padding: { left: 5, right: 5, top: 2, bottom: 2 },
				align: 'center',
			})
			.setOrigin(0.5)
			.setDepth(10);

		otherPlayer.setData('nameText', playerNameText);
	}

	removeOtherPlayer(playerData: Player) {
		const otherPlayer = this.spriteObjects.find(
			(p) => p.getData('id') === playerData.id
		);
		if (otherPlayer) {
			otherPlayer.destroy();
			const nameText = otherPlayer.getData('nameText');
			if (nameText) {
				nameText.destroy();
			}
			this.spriteObjects = this.spriteObjects.filter(
				(p) => p.getData('id') !== playerData.id
			);
		}
	}

	updateOtherPlayer(playerData: Player) {
		const otherPlayer = this.spriteObjects.find(
			(p) => p.getData('id') === playerData.id
		);
		if (otherPlayer) {
			otherPlayer.setPosition(playerData.positionX, playerData.positionY);
			const nameText = otherPlayer.getData('nameText');
			if (nameText) {
				nameText.setPosition(otherPlayer.x, otherPlayer.y - 30);
			}
		}
	}

	update() {
		if (this.playerNameText && this.player) {
			this.playerNameText.setPosition(this.player.x, this.player.y - 30);
		}

		// Spielerbewegung
		const velocity = this.inputManager!.handlePlayerMovement();
		const direction: Direction = this.inputManager!.getDirection();
		this.animationManager!.playAnimation(direction, velocity);

		// Kamera aktualisieren
		this.cameraControl!.update();

		// Spielerdaten aktualisieren
		this.playerData.positionX = this.player!.x;
		this.playerData.positionY = this.player!.y;
		this.playerData.velocityX = this.player!.body.velocity.x;
		this.playerData.velocityY = this.player!.body.velocity.y;
		this.playerData.direction = direction;

		// Spielerdaten an den Server senden
		this.socket.emit('updatePlayer', this.playerData);

		// Spielerdaten an UIScene senden
		this.scene
			.get('UIScene')
			.events.emit('updatePlayerPosition', this.player!.x, this.player!.y);

		// Actionzone mit dem Spieler bewegen
		this.actionzone!.setPosition(
			this.player!.x + this.actionzoneOffset!.x,
			this.player!.y + this.actionzoneOffset!.y - 15
		);

		this.setActionzoneDirection(this.actionzone!, direction);

		// Sortiere alle Objekte basierend auf ihrer Y-Position
		this.spriteObjects.sort((a, b) => a.y - b.y);

		// Aktualisiere die Tiefenwerte basierend auf der Sortierung
		this.spriteObjects.forEach((obj, index) => {
			obj.setDepth(index);
		});
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

	handleActionzoneCollision(
		zone:
			| Phaser.Types.Physics.Arcade.GameObjectWithBody
			| Phaser.Physics.Arcade.Body
			| Phaser.Tilemaps.Tile,
		tree:
			| Phaser.Types.Physics.Arcade.GameObjectWithBody
			| Phaser.Physics.Arcade.Body
			| Phaser.Tilemaps.Tile
	): void {
		console.log('Zone hat einen Baum berührt!');
		(tree as Phaser.Tilemaps.Tile).setAlpha(0.5);
	}

	isPlayerOverlappingTree(
		tree: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
	): boolean {
		const playerBounds = new Phaser.Geom.Rectangle(
			this.player!.x - this.player!.width / 2,
			this.player!.y - this.player!.height / 2,
			this.player!.width,
			this.player!.height
		);
		const treeBounds = tree.getBounds();

		return Phaser.Geom.Intersects.RectangleToRectangle(
			playerBounds,
			treeBounds
		);
	}
}
