import { query } from '../index.js';
import type { Account } from '../models/account.model.js';
import bcrypt from 'bcrypt';

export async function insertAccount(email: string, pass: string) {
	const hashedPassword = await bcrypt.hash(pass, 10);

	const account: Account = {
		email,
		password: hashedPassword,
	};

	const createdAccount = await query<Account>(
		'INSERT INTO account (email, password) VALUES (?, ?)',
		[account.email, account.password]
	);

	delete createdAccount.password;

	return createdAccount;
}
