import mariadb from 'mariadb';

export class DbService {
	private readonly _POOL;
	get pool() {
		return this._POOL;
	}
	constructor() {
		this._POOL = mariadb.createPool({
			host: 'loclahost',
			user: 'example',
			password: 'example', // Ersetze mit deinem DB-Passwort
			database: 'exampledb',
			connectionLimit: 5,
		});
	}
}
