import mysql2 from 'mysql2/promise';
import { bunSql } from './sql.js';

export type MysqlClient = {
	sql<T = unknown>(
		query: TemplateStringsArray,
		...values: unknown[]
	): Promise<T>;
};

/**
 * Creates a new mysql client. Connects to the server automatically.
 * @param config - Client configuration.
 * @returns - Mysql client.
 */
export function mysql(config: mysql2.PoolOptions): MysqlClient {
	const raw_client = mysql2.createPool(config);

	return {
		async sql<T = unknown>(
			query: TemplateStringsArray,
			...values: unknown[]
		): Promise<T> {
			const compiled = bunSql(query, ...values);

			// <T = any>(strings: TemplateStringsArray, ...values: unknown[]): SQL.Query<T>;
			// но не хелпер
			const [result] = await raw_client.query(compiled.query, compiled.values);
			return result as T;
		},
	};
}
