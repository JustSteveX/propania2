import type { Direction } from './direction.enum.ts'; //

export type Player = {
	socket_id?: string;
	id?: number;
	account_id: number;
	name: string;
	money: number;
	exp: number;
	level: number;
	positionX: number;
	positionY: number;
	velocityX: number;
	velocityY: number;
	direction: Direction;
};
