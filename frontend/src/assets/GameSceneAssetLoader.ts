export function preloadAssets(scene: Phaser.Scene): void {
	//Audio
	scene.load.audio('popsound', 'assets/sounds/pop.mp3');
	scene.load.audio('cuttingtree', 'assets/sounds/cuttingtree.mp3');
	scene.load.audio('treefall', 'assets/sounds/treefall.mp3');
	scene.load.audio('treefalldown', 'assets/sounds/treefalldown.mp3');

	// Assets laden
	scene.load.tilemapTiledJSON('map', 'assets/map/maps/map.json');
	scene.load.image('ground', 'assets/map/images/Ground.png');
	scene.load.image('treeleaves', 'assets/map/images/TreeLeaves.png');
	scene.load.image('stone', 'assets/map/images/stone.png');
	scene.load.image('item', 'assets/images/pickaxe2.png');

	scene.load.image({
		key: 'tree',
		url: 'assets/objects/tree.png',
		frameConfig: {
			frameWidth: 96,
			frameHeight: 96,
		},
	});
	scene.load.spritesheet({
		key: 'player',
		url: 'assets/players/Player_Template.png',
		frameConfig: {
			frameWidth: 64,
			frameHeight: 64,
		},
	});
	scene.load.image({
		key: 'Mushroom',
		url: 'assets/items/mushroom.png',
		frameConfig: {
			frameWidth: 512,
			frameHeight: 15,
		},
	});
	scene.load.spritesheet({
		key: 'Log',
		url: 'assets/items/items.png',
		frameConfig: {
			frameWidth: 32,
			frameHeight: 32,
			startFrame: 3,
			endFrame: 3,
		},
	});
}
