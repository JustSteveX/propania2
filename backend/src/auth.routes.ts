import bcrypt from 'bcrypt';
import type { Propania2Server } from './server';
import jwt from 'jsonwebtoken';
import type { Route } from './types/route.type';
import type { DbService } from './services/db.service';
import type { Pool } from 'mariadb';
import type { Request, Response } from 'express';

export class AuthRoutes implements Route {
	private readonly _pool: Pool;

	constructor(
		private propania2Server: Propania2Server,
		private dbService: DbService
	) {
		this._pool = this.dbService.pool;
	}

	registerRoutes(): void {
		this.propania2Server.app.post('/register', async (req, res) => {
			const { email, password } = req.body as {
				email: string;
				password: string;
			};
			if (!email || !password) {
				res.status(400).json({ message: 'Bitte alle Felder ausfüllen!' });
			}

			try {
				const hashedPassword = (await bcrypt.hash(password, 10)) as string; // Passwort hashen

				const conn = await this._pool.getConnection();
				const query = `INSERT INTO account (email, password, created_at) VALUES (?, ?, NOW())`;
				await conn.query(query, [email, hashedPassword]);
				conn.release();

				res.status(201).json({ message: 'Benutzer erfolgreich registriert!' });
			} catch (error) {
				console.error(error);
				res.status(500).json({ message: 'Fehler beim Erstellen des Kontos' });
			}
		});

		// Benutzer-Login
		this.propania2Server.app.post(
			'/login',
			async (req: Request, res: Response): Promise<void> => {
				const { email, password } = req.body as {
					email: string;
					password: string;
				};

				if (!email || !password) {
					res.status(400).json({ message: 'Bitte alle Felder ausfüllen!' });
					return;
				}

				try {
					const conn = await this._pool.getConnection();
					try {
						const query = `SELECT * FROM account WHERE email = ?`;
						const rows: { id: number; email: string; password: string }[] =
							(await conn.query(query, [email])) as [];

						if (rows.length === 0) {
							res.status(401).json({ message: 'Ungültige Anmeldedaten!' });
							return;
						}

						const user = rows[0];
						const isPasswordValid = (await bcrypt.compare(
							password,
							user.password
						)) as boolean;

						if (!isPasswordValid) {
							res.status(401).json({ message: 'Ungültige Anmeldedaten!' });
							return;
						}

						const token = jwt.sign(
							{ userId: user.id, email: user.email },
							process.env.JWT_SECRET!,
							{
								expiresIn: '1h',
							}
						) as string;

						res.status(200).json({ message: 'Login erfolgreich!', token });
						return;
					} finally {
						conn.release();
					}
				} catch (error) {
					console.error('Error during login:', error);
					res.status(500).json({ message: 'Fehler beim Login' });
					return;
				}
			}
		);
	}
}
