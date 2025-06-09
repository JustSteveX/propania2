import type Phaser from 'phaser';
import type { Player } from '../types/players.type.ts';

export default class TreeManager {
	private scene: Phaser.Scene;
	private trees: Phaser.Physics.Arcade.Group;
	private logs: Phaser.Physics.Arcade.Group;

	constructor(scene: Phaser.Scene) {
		this.scene = scene;
		this.trees = this.scene.physics.add.group();
		this.logs = this.scene.physics.add.group(); // Gruppe für Logs
	}

	createTree(x: number, y: number): Phaser.Physics.Arcade.Sprite {
		const tree = this.scene.physics.add.sprite(
			x,
			y,
			'tree'
		) as Phaser.Physics.Arcade.Sprite;
		tree.setOrigin(0.5, 0.5);
		tree.setScale(1);
		tree.setData('chopcount', Math.floor(Math.random() * (10 - 5 + 1)) + 5);
		this.trees.add(tree);
		if (tree.body) {
			tree.body.setSize(32, 16);
			tree.body.setOffset(32, 80);
			tree.body.pushable = false;
		}
		return tree;
	}

	getTrees(): Phaser.Physics.Arcade.Group {
		return this.trees;
	}

	getLogs(): Phaser.Physics.Arcade.Group {
		return this.logs;
	}

	private async spawnLogs(
		x: number,
		y: number,
		popsound: Phaser.Sound.BaseSound
	): Promise<void> {
		for (let i = 0; i < 3; i++) {
			// Random offset in Bereich [-20, 20]
			const randomOffsetX = Math.random() * 40;
			const randomOffsetY = Math.random() * 40;

			const log = this.scene.physics.add.sprite(
				x + randomOffsetX,
				y + randomOffsetY,
				'Log'
			);
			log.setScale(0.3);
			log.setOrigin(0.5, 1);
			log.setDisplaySize(16, 16);
			this.logs.add(log);
			popsound.play();

			await this.sleep(100);
		}
	}

	setupCuttingInteraction(
		actionZone: Phaser.GameObjects.GameObject,
		inputManager: {
			getDirection: () => string;
			isActionJustPressed: () => boolean;
		},
		player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | undefined,
		playerData: Player,
		cuttingtreesound: Phaser.Sound.BaseSound,
		treefallsound: Phaser.Sound.BaseSound,
		treefalldownsound: Phaser.Sound.BaseSound,
		popsound: Phaser.Sound.BaseSound,
		tweens: Phaser.Tweens.TweenManager
	): void {
		this.scene.physics.add.collider(
			actionZone,
			this.getTrees(),
			(_, collidedTree) => {
				const dir = inputManager?.getDirection();
				if (inputManager?.isActionJustPressed()) {
					const anim = `treecut_${dir}`;
					player?.anims.play(anim);

					const treeSprite = collidedTree as Phaser.Physics.Arcade.Sprite;
					tweens.add({
						targets: treeSprite,
						x: treeSprite.x,
						y: '+=0.2',
						duration: 100,
						yoyo: true,
						repeat: 0,
						onComplete: () => {
							cuttingtreesound.play();
							let chopCount: number = treeSprite.getData('chopcount');
							if (chopCount > 0) {
								chopCount--;
								treeSprite.setData('chopcount', chopCount);
							}

							if (chopCount <= 0) {
								treefallsound.play();
								if (treeSprite.body) {
									treeSprite.body.enable = false;
								}

								let treeangle: number = 0;
								let treexoffset: number = 0;

								if (playerData.direction == 'left') {
									treeangle = -90;
									treexoffset = -30;
								} else {
									treeangle = 90;
									treexoffset = +30;
								}

								// Baum fällt
								tweens.add({
									targets: treeSprite,
									y: treeSprite.y + 30,
									x: treeSprite.x + treexoffset,
									angle: treeangle,
									duration: 3000,
									ease: 'Sine.easeInOut',
									onComplete: () => {
										treefalldownsound.play();
										// Logs spawnen
										this.spawnLogs(treeSprite.x, treeSprite.y, popsound);
										// Baum entfernen
										treeSprite.destroy();
									},
								});
							}
						},
					});
				}
			}
		);
	}

	sleep(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
