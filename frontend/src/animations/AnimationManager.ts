import type { Direction } from 'src/types/direction.enum';

export default class AnimationManager {
	private scene: Phaser.Scene;
	private player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
	private currentAnimationKey: string = '';
	private animationKeys: string[] = [];

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
			{ key: 'run_up', row: 34, startColumn: 0, endColumn: 7, frameRate: 10 },
			{ key: 'run_down', row: 36, startColumn: 0, endColumn: 7, frameRate: 10 },
			{ key: 'run_left', row: 35, startColumn: 0, endColumn: 7, frameRate: 10 },
			{
				key: 'run_right',
				row: 37,
				startColumn: 0,
				endColumn: 7,
				frameRate: 10,
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
				repeat: -1,
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
	 * Spielt die passende Animation basierend auf der Bewegungsrichtung und Geschwindigkeit.
	 * Gibt den aktuell gespielten Animations-Key zurück.
	 */
	playAnimation(direction: Direction, velocity: number[]): string {
		const [velocityX, velocityY] = velocity;
		const maxSpeed = Math.max(Math.abs(velocityX), Math.abs(velocityY));
		let walkState: string;

		if (maxSpeed === 0) {
			walkState = 'idle';
		} else if (maxSpeed <= 60) {
			walkState = 'walk';
		} else {
			walkState = 'run';
		}

		const animationName = `${walkState}_${direction}`;
		this.player.anims.play(animationName, true);
		this.currentAnimationKey = animationName;
		return this.currentAnimationKey;
	}

	// Gibt den aktuell verwendeten Animations-Key zurück
	getCurrentAnimationKey(): string {
		return this.currentAnimationKey;
	}

	// Ermöglicht den Zugriff auf alle erstellten Animationen (Keys)
	getAvailableAnimations(): string[] {
		return this.animationKeys;
	}
}
