import CameraControl from '../controls/CameraControl.js';
import InputManager from '../controls/InputManager.js';
import AnimationManager from '../animations/AnimationManager.js';
import Phaser from 'phaser';
import type { Vector2D } from '../types/direction.enum.ts';
import type { Direction } from '../types/direction.enum.ts';
import type { Player } from '../types/players.type.ts';
import SocketManager from '../SocketManager.ts';
import type { Socket } from 'socket.io-client';

export default class GameScene extends Phaser.Scene {
	private player?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
	private playerData!: Player;
	// Spieler werden als Objekt mit der Socket-ID als Schlüssel gespeichert
	private players: {
		[id: string]: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
	} = {};
	private groundLayer?: Phaser.Tilemaps.TilemapLayer;
	private obstaclesLayer?: Phaser.Tilemaps.TilemapLayer;
	private cameraControl?: CameraControl;
	private inputManager?: InputManager;
	private animationManager?: AnimationManager;
	private socket: Socket;

	constructor() {
		super({ key: 'GameScene' });
		this.socket = SocketManager.getSocket();
	}

	init(data: { playerdata: Player }) {
		this.playerData = data.playerdata;
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
		this.socket.emit('login', { ...this.playerData, id: this.socket.id });

		this.socket.on('currentPlayers', (serverPlayers) => {
			console.log('Empfangene Spieler:', serverPlayers);
			Object.keys(serverPlayers).forEach((id) => {
				console.log('Spieler wird hinzugefügt:', serverPlayers[id]);
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

		// Spielerbewegung
		const velocity = this.inputManager.handlePlayerMovement();
		const direction: Direction = this.inputManager.getDirection();
		// Ermittelt den aktuellen Animations-Key (z. B. 'walk_up', 'idle_right', etc.)
		const currentAnimKey = this.animationManager.playAnimation(
			direction,
			velocity
		);

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
		newPlayer.setDepth(10);
		newPlayer.setOrigin(0.5, 1);
		this.physics.world.enable(newPlayer);

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
}
