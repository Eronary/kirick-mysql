import mysql2 from 'mysql2/promise';
import type {
	SQLClientConstructor,
	SQLClientProperties,
	SQLFn,
} from './types.js';

/**
 * Define properties on an object with correct types.
 * @param target -
 * @param properties -
 */
function merge<T, P extends Record<string, unknown>>(target: T, properties: P) {
	return Object.defineProperties(
		target,
		Object.fromEntries(
			Object.entries(properties).map(([key, value]) => [
				key,
				{ enumerable: true, value },
			]),
		) as Record<string, PropertyDescriptor>,
	) as T & P;
}

// oxlint-disable-next-line func-style
export const SQL = function (options: string) {
	const raw_client = mysql2.createPool(options);

	// oxlint-disable-next-line func-style
	const sql: SQLFn = function (arg0: unknown, ...args: unknown[]) {
		// Tagged template
		if (isTemplateStringsArray(arg0)) {
			const sql_query = createSqlQuery(arg0, ...args);
			return raw_client.query(sql_query.query, sql_query.values);
		}
	};

	return merge(sql, {
		options,
	} satisfies SQLClientProperties);
} as unknown as SQLClientConstructor;

export type { MySQLError } from './error.js';
