import type Phaser from 'phaser';

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
		tree.setOrigin(0.5, 1);
		tree.setScale(0.5);
		tree.setData('chopcount', Math.floor(Math.random() * (3 - 2 + 1)) + 2);
		this.trees.add(tree);
		if (tree.body) {
			tree.body.setSize(100, 80);
			tree.body.setOffset(135, 300);
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
			const randomOffsetX = Math.random() * 40 - 20;
			const randomOffsetY = Math.random() * 40 - 20;

			const log = this.scene.physics.add.sprite(
				x + randomOffsetX,
				y + randomOffsetY,
				'Log'
			);
			log.setScale(0.3);
			log.setOrigin(0.5, 1);
			log.setDisplaySize(32, 32);
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
		cuttingtreesound: Phaser.Sound.BaseSound,
		treefallsound: Phaser.Sound.BaseSound,
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
							chopCount--;
							treeSprite.setData('chopcount', chopCount);

							if (chopCount <= 0) {
								treefallsound.play();

								const options = [90, -90];
								const randomOffset =
									options[Math.floor(Math.random() * options.length)];
								// Baum fällt
								tweens.add({
									targets: treeSprite,
									angle: randomOffset,
									duration: 3000,
									ease: 'Sine.easeInOut',
									onComplete: () => {
										// Logs spawnen
										this.spawnLogs(treeSprite.x, treeSprite.y - 20, popsound);
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
