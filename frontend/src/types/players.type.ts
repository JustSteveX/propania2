import type { Direction } from './direction.enum.ts'; //

export type Player = {
	id?: number;
	account_id: number;
	name: string;
	money: number;
	exp: number;
	level: number;
	positionX: number;
	positionY: number;
	direction: Direction;
	velocityX: number;
	velocityY: number;
};
