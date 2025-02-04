// src/routes/auth.ts
import type { Response } from 'express';
import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/app.js';
import { query } from './../db/index.js';
import type { AuthenticatedRequest } from '../middlewares/authenticateToken';
import { authenticateToken } from '../middlewares/authenticateToken.js';
import { DbUser } from './../db/models/users.model.js';
import { insertUser } from './../db/functions/user.functions.js';
import dns from 'dns/promises';

const router = Router();

router.post('/register', async (req, res) => {
	try {
		const { email, password } = req.body as {
			email: string;
			password: string;
		};

		// ************* Regex-Validierung hinzufügen *************
		const emailRegex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
		if (!emailRegex.test(email)) {
			res.status(400).json({ message: 'Invalid Mail E-Mail-Format' });
			return;
		}

		// MX record validation
		const domain = email.split('@')[1];
		try {
			const mxRecords = await dns.resolveMx(domain);
			if (!mxRecords || mxRecords.length === 0) {
				res.status(400).json({
					message: 'Email domain is not configured to receive emails',
				});
				return;
			}
		} catch (error) {
			res.status(400).json({
				message: 'Email domain not valid',
			});
			return;
		}

		// Benutzer existenz prüfen
		const [existingUser] = await query<DbUser[]>(
			'SELECT * FROM account WHERE email = ?',
			[email]
		);

		if (existingUser) {
			res.status(400).json({ message: 'Account already exists' });
			return;
		}

		// ************* Korrektur: await hinzufügen *************
		await insertUser(email, email, password);

		res.status(201).json({ message: 'User registerted successfully' });
	} catch (error) {
		console.error(error);
		res.status(500).json({
			message: error instanceof Error ? error.message : 'Intern Server Error',
		});
	}
});

// Login
router.post('/login', async (req, res) => {
	try {
		const { email, password } = req.body as {
			email: string;
			password: string;
		};

		// Nutzer suchen
		const [user] = await query<DbUser[]>(
			'SELECT * FROM account WHERE email = ?',
			[email]
		);
		if (!user) {
			res.status(401).json({ message: 'Ungültige Anmeldedaten' });
			return;
		}

		// Passwort validieren
		const isValid = await bcrypt.compare(password, user.password!);
		if (!isValid) {
			res.status(401).json({ message: 'Ungültige Anmeldedaten' });
			return;
		}

		delete user.password;

		// Token generieren
		const token = jwt.sign(
			{
				id: user.id,
				email: user.email,
			},
			ENV.JWT_SECRET,
			{ expiresIn: '1h' }
		);

		res.json({ token });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Interner Serverfehler' });
	}
});

router.post(
	'/validateToken',
	authenticateToken,
	(req: AuthenticatedRequest, res: Response) => {
		// Wenn die Middleware `authenticateToken` erfolgreich ist, ist der Token gültig
		res.status(200).json({ message: 'Token is valid', user: req.user });
	}
);

export default router;
