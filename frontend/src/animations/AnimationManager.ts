import { Direction } from '../types/direction.enum.ts';

type PlayerState = 'idle' | 'walk' | 'run' | 'pickup' | 'treecut';

export default class AnimationManager {
	private scene: Phaser.Scene;
	private player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
	private currentAnimationKey: string = '';
	private animationKeys: string[] = [];

	private currentState: PlayerState = 'idle';
	private currentDirection: Direction = Direction.LEFT;
	private lastDirection: Direction = Direction.DOWN;

	constructor(
		scene: Phaser.Scene,
		player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
	) {
		this.scene = scene;
		this.player = player;
		this.createAnimations();
	}

	// Erstellt alle Animationen und speichert deren Keys
	private createAnimations() {
		const animations = [
			{ key: 'idle_up', row: 22, startColumn: 0, endColumn: 1, frameRate: 1 },
			{ key: 'idle_down', row: 24, startColumn: 0, endColumn: 1, frameRate: 1 },
			{ key: 'idle_left', row: 23, startColumn: 0, endColumn: 1, frameRate: 1 },
			{
				key: 'idle_right',
				row: 25,
				startColumn: 0,
				endColumn: 1,
				frameRate: 1,
			},
			{ key: 'walk_up', row: 8, startColumn: 0, endColumn: 8, frameRate: 10 },
			{
				key: 'walk_down',
				row: 10,
				startColumn: 0,
				endColumn: 8,
				frameRate: 10,
			},
			{ key: 'walk_left', row: 9, startColumn: 0, endColumn: 8, frameRate: 10 },
			{
				key: 'walk_right',
				row: 11,
				startColumn: 0,
				endColumn: 8,
				frameRate: 10,
			},
			{ key: 'run_up', row: 38, startColumn: 0, endColumn: 7, frameRate: 10 },
			{ key: 'run_down', row: 40, startColumn: 0, endColumn: 7, frameRate: 10 },
			{ key: 'run_left', row: 39, startColumn: 0, endColumn: 7, frameRate: 10 },
			{
				key: 'run_right',
				row: 41,
				startColumn: 0,
				endColumn: 7,
				frameRate: 10,
			},
			{
				key: 'pickup_right',
				row: 15,
				startColumn: 3,
				endColumn: 0,
				frameRate: 5,
				repeat: 0,
			},
			{
				key: 'pickup_left',
				row: 13,
				startColumn: 3,
				endColumn: 0,
				frameRate: 5,
				repeat: 0,
			},
			{
				key: 'pickup_up',
				row: 12,
				startColumn: 3,
				endColumn: 0,
				frameRate: 5,
				repeat: 0,
			},
			{
				key: 'pickup_down',
				row: 14,
				startColumn: 3,
				endColumn: 0,
				frameRate: 5,
				repeat: 0,
			},
			{
				key: 'treecut_up',
				row: 54,
				startColumn: 5,
				endColumn: 0,
				frameRate: 6,
				repeat: 0,
			},
			{
				key: 'treecut_down',
				row: 55,
				startColumn: 4,
				endColumn: 0,
				frameRate: 6,
				repeat: 0,
			},
			{
				key: 'treecut_left',
				row: 56,
				startColumn: 4,
				endColumn: 0,
				frameRate: 6,
				repeat: 0,
			},
			{
				key: 'treecut_right',
				row: 57,
				startColumn: 4,
				endColumn: 0,
				frameRate: 6,
				repeat: 0,
			},
		];

		animations.forEach((anim) => {
			this.scene.anims.create({
				key: anim.key,
				frames: this.scene.anims.generateFrameNumbers('player', {
					start: this.getFrameIndex(anim.row, anim.startColumn),
					end: this.getFrameIndex(anim.row, anim.endColumn),
				}),
				frameRate: anim.frameRate,
				repeat: anim.repeat ?? -1,
			});
			this.animationKeys.push(anim.key);
		});
	}

	// Berechnet den Frame-Index anhand der Zeile und Spalte im Spritesheet
	private getFrameIndex(row: number, column: number): number {
		const SPRITESHEET_COLUMNS = 13; // Anzahl der Spalten im Spritesheet
		return row * SPRITESHEET_COLUMNS + column;
	}

	/**
	 * Aktualisiert den State basierend auf Richtung, Geschwindigkeit und Aktion
	 * und spielt die passende Animation nur wenn sich etwas geändert hat.
	 */
	public updateState(
		direction: Direction,
		velocity: [number, number],
		isActionPressed: boolean,
		actionType: 'pickup' | 'treecut' | null = null
	): string {
		const [velocityX, velocityY] = velocity;
		const maxSpeed = Math.max(Math.abs(velocityX), Math.abs(velocityY));

		let newState: PlayerState;

		// NEU: Action-Type hat Priorität
		if (isActionPressed && actionType) {
			newState = actionType;
		} else if (maxSpeed === 0) {
			newState = 'idle';
		} else if (maxSpeed <= 60) {
			newState = 'walk';
		} else {
			newState = 'run';
		}

		// Falls Richtung 0 ist (kein Input), dann lastDirection verwenden
		let newDirection = direction;
		if (!newDirection) {
			newDirection = this.lastDirection;
		}

		// Wenn sich State oder Richtung ändert, Animation wechseln
		if (
			newState !== this.currentState ||
			newDirection !== this.currentDirection
		) {
			this.currentState = newState;
			this.currentDirection = newDirection;
			this.lastDirection = newDirection;

			const animationName = `${newState}_${newDirection}`;
			this.player.anims.play(animationName, true);
			this.currentAnimationKey = animationName;
		}

		return this.currentAnimationKey;
	}

	// Gibt den aktuell verwendeten Animations-Key zurück
	public getCurrentAnimationKey(): string {
		return this.currentAnimationKey;
	}

	// Ermöglicht den Zugriff auf alle erstellten Animationen (Keys)
	public getAvailableAnimations(): string[] {
		return this.animationKeys;
	}
}
