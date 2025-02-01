import { query } from '../index.js';
import type { DbUser } from '../models/users.model';
import bcrypt from 'bcrypt';

export async function insertUser(name: string, email: string, pass: string) {
	const hashedPassword = await bcrypt.hash(pass, 10);

	const user: DbUser = {
		email,
		password: hashedPassword,
	};

	const createdUser = await query<DbUser>(
		'INSERT INTO account (email, password) VALUES (?, ?)',
		[user.email, user.password]
	);

	delete createdUser.password;

	return createdUser;
}
