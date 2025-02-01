// src/middlewares/authenticateToken.ts
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/app.js';
import type { Account } from './../db/models/account.model.js';

export interface AuthenticatedRequest extends Request {
	account?: Account;
}

export function authenticateToken(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
): void {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];

	if (!token) {
		res.status(401).json({ message: 'Kein Token bereitgestellt' });
		return;
	}

	jwt.verify(token, ENV.JWT_SECRET, (err, account) => {
		if (err) {
			res.status(403).json({ message: 'Ungültiger Token' });
		}

		req.account = account as Account; // Typ setzen
		next();
	});
}
