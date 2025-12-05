import type { SQL as BunSQL } from 'bun';

/*
import { sql, SQL } from "bun";

// конструктор клиента
const mysql = new SQL("mysql://user:pass@localhost:3306/mydb");
const mysqlResults = await mysql`
  SELECT * FROM users
  WHERE active = ${true}
`;

// готовый клиент из env
const users = await sql`
  SELECT * FROM users
  WHERE active = ${true}
  LIMIT ${10}
`;
*/

/**
 * Define properties on an object with correct types.
 * @param target -
 * @param properties -
 */
function defineProperties<T, P extends PropertyDescriptorMap>(target: T, properties: P) {
	return Object.defineProperties(target, properties) as T & { [K in keyof P]: P[K]['value'] };
}

type _Sql = BunSQL;

// eslint-disable-next-line jsdoc/require-jsdoc
export function SQL(options: string | URL | BunSQL.Options) {
	const fn: _Sql = (arg0: unknown, ...args: unknown[]) => {
		return 1;
	};

	const r: BunSQL = defineProperties(
		(arg0: unknown, ...args: unknown[]) => {
			return 1;
		},
		{
			options: {
				enumerable: true,
				value: options,
			},
			connect: {
				enumerable: true,
				value(): Promise<BunSQL> {
					throw new Error('Not implemented');
				},
			},
			close: {
				enumerable: true,
				value(): Promise<void> {
					throw new Error('Not implemented');
				},
			},
		},
	);

	return r;
}
