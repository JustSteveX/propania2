import type { Auditable } from './auditable.model';

export type Account = Auditable & {
	id?: string;
	email: string;
	password?: string;
};
