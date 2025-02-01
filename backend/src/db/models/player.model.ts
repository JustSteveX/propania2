import type { Auditable } from './auditable.model';

export type PlayerType = Auditable & {
	id?: number;
	name: string;
	money: number;
	exp: number;
	level: number;
	positionX: number;
	positionY: number;
};

export class Player implements PlayerType {
	createdAt?: Date;
	id?: number;
	name: string;
	money: number;
	exp: number;
	level: number;
	positionX: number;
	positionY: number;

	constructor(
		name: string,
		money = 0,
		exp = 0,
		level = 1,
		positionX = 0,
		positionY = 0
	) {
		this.name = name;
		this.money = money;
		this.exp = exp;
		this.level = level;
		this.positionX = positionX;
		this.positionY = positionY;
	}
}
