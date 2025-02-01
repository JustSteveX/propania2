// src/routes/auth.ts
import type { Response } from 'express';
import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/app.js';
import { query } from './../db/index.js';
import type { AuthenticatedRequest } from '../middlewares/authenticateToken';
import { authenticateToken } from '../middlewares/authenticateToken.js';
import type { Account } from '../db/models/account.model.js';
import { insertAccount } from '../db/functions/account.functions.js';

const router = Router();

// Registrierung
router.post('/register', async (req, res) => {
	try {
		const { email, password } = req.body as {
			email: string;
			password: string;
		};

		// Check if user exists
		const [existingAccount] = await query<Account[]>(
			'SELECT * FROM account WHERE email = ?',
			[email]
		);
		if (existingAccount) {
			res.status(400).json({ message: 'Benutzer existiert bereits' });
			return;
		}

		insertAccount(email, password);

		res.status(201).json({ message: 'Benutzer registriert!' });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: error });
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
		const [user] = await query<Account[]>(
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
		const token = jwt.sign(user, ENV.JWT_SECRET, { expiresIn: '1h' });

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
		res.status(200).json({ message: 'Token is valid', account: req.account });
	}
);

export default router;
