import type Phaser from 'phaser';

export default class TreeManager {
	private scene: Phaser.Scene;
	private trees: Phaser.Physics.Arcade.Group;

	constructor(scene: Phaser.Scene) {
		this.scene = scene;
		this.trees = this.scene.physics.add.group();
	}

	createTree(x: number, y: number): Phaser.Physics.Arcade.Sprite {
		const tree = this.scene.physics.add.sprite(
			x,
			y,
			'tree'
		) as Phaser.Physics.Arcade.Sprite;
		tree.setOrigin(0.5, 1);
		tree.setScale(0.5);
		tree.setData('isTree', true);
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
}
