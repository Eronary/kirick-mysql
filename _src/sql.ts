import type { SQL as BunSQLType } from 'bun';
import { SQL as BunSQLRuntime } from 'bun';
import { SqlHelper } from './sql/helper.js';
import { SqlIdentifier } from './sql/identifier.js';
import { isPlainObject } from './util.js';

export class Sql {
	constructor(
		public readonly query: string,
		public readonly values: unknown[],
	) {}
}

/**
 * Creates an SQL INSERT statement.
 * @param row - The row to insert.
 * @returns - Sql instance.
 */
function insert(row: Record<string, unknown>): Sql;

/**
 * Creates an SQL INSERT statement.
 * @param rows - The rows to insert.
 * @returns - Sql instance.
 */
function insert(rows: Record<string, unknown>[]): Sql;

function insert(
	arg0: Record<string, unknown> | Record<string, unknown>[],
): Sql {
	if (isPlainObject(arg0)) {
		return insert([arg0]);
	}

	const rows_keys: string[] = [];
	const rows_values: unknown[][] = [];
	for (const row of structuredClone(arg0)) {
		const row_values: unknown[] = [];

		for (const key of rows_keys) {
			row_values.push(row[key] ?? null);
			delete row[key];
		}

		// add new keys
		for (const [key, value] of Object.entries(row)) {
			rows_keys.push(key);
			row_values.push(value);

			for (const prev_row_values of rows_values) {
				prev_row_values.push(null);
			}
		}

		rows_values.push(row_values);
	}

	const ids = rows_keys.map((name) => new SqlIdentifier(name));

	return createSql`(${ids}) VALUES ${rows_values}`;
}

/**
 * Generates SET expressions for SQL queries.
 * @param row - The row data to generate SET expressions for.
 * @returns An array of SET expressions.
 */
function set(row: Record<string, unknown>): Sql[] {
	const sqls: Sql[] = [];
	for (const [key, value] of Object.entries(row)) {
		sqls.push(createSql`${new SqlIdentifier(key)}=${value}`);
	}

	return sqls;
}

/**
 * Detects whether the given value is a TemplateStringsArray.
 * @param value - The value to check.
 * @returns True if the value is a TemplateStringsArray, false otherwise.
 */
function isTemplateStringsArray(value: unknown): value is TemplateStringsArray {
	return (
		Array.isArray(value)
		&& Object.hasOwn(value, 'raw')
		&& 'raw' in value
		&& Array.isArray(value.raw)
	);
}

type SqlContext = 'default' | 'insert' | 'update_set';

/**
 * Detects the SQL context based on the prefix SQL.
 * @param prefix_sql - The prefix SQL string.
 * @returns The detected SQL context.
 */
function detectContext(prefix_sql: string): SqlContext {
	const upper = prefix_sql.toUpperCase();

	const insert_index = upper.lastIndexOf('INSERT ');
	const update_index = upper.lastIndexOf('UPDATE ');
	const set_index = upper.lastIndexOf(' SET ');

	// If there is an INSERT statement and it comes before the UPDATE statement
	if (insert_index !== -1 && insert_index >= update_index) {
		return 'insert';
	}

	// If there is an UPDATE statement and it comes before the SET statement
	if (update_index !== -1 && set_index !== -1 && set_index > update_index) {
		return 'update_set';
	}

	return 'default';
}

/**
 * Transforms an object into a SET expression:
 * { name: 'Alice', email: 'alice@example.com' }
 * -> "??=?,??=?" and values: ["name","Alice","email","alice@example.com"]
 * @param row -
 * @returns -
 */
function toSetSql(row: Record<PropertyKey, unknown>[]): Sql {
	if (row.length !== 1) {
		throw new Error('Invalid row length');
	}

	const parts = set(row[0] as Record<string, unknown>);
	if (parts.length === 0) {
		return new Sql('', []);
	}

	const sql_parts: string[] = [];
	const values: unknown[] = [];

	for (const part of parts) {
		sql_parts.push(part.query);
		values.push(...part.values);
	}

	return new Sql(sql_parts.join(','), values);
}

/**
 * Converts a value to a SQL string representation.
 * @param value - Value to convert
 * @param depth - Depth of the SQL string representation
 * @param context - Context of the SQL string representation
 * @returns - SQL string representation of the value
 */
function toSql(
	value: unknown,
	depth: number = 0,
	context: SqlContext = 'default',
): Sql {
	if (Array.isArray(value) || value instanceof Set) {
		const result_sql_parts: string[] = [];
		const result_values: unknown[] = [];

		for (const item of value) {
			const sql_nested = toSql(item, depth + 1, context);
			result_sql_parts.push(sql_nested.query);
			result_values.push(...sql_nested.values);
		}

		return new Sql(
			(depth > 0 ? '(' : '')
				+ result_sql_parts.join(',')
				+ (depth > 0 ? ')' : ''),
			result_values,
		);
	}

	if (value instanceof SqlHelper) {
		const row = value.pickColumns();
		if (context === 'insert') {
			return insert(row as Record<string, unknown>[]);
		}

		if (context === 'update_set') {
			return toSetSql(row);
		}

		throw new Error(`Unsupported context "${context}"`);
	}

	if (value instanceof Sql) {
		return value;
	}

	if (value instanceof SqlIdentifier) {
		return new Sql('??', [value.id]);
	}

	return new Sql('?', [value]);
}

/**
 * Creates SQL Query object from template string tag.
 * @param query - Query string
 * @param values - Values to interpolate into the query string
 * @returns - SQL Query object
 */
function createSql(query: TemplateStringsArray, ...values: unknown[]): Sql {
	const query_0 = query[0];
	if (query_0 === undefined) {
		throw new TypeError('Argument "query" must contain at least 1 element.');
	}

	const result_sql_parts: string[] = [query_0];
	const result_values: unknown[] = [];

	for (const [index, value] of values.entries()) {
		const prefix_sql = result_sql_parts.join('');
		const context = detectContext(prefix_sql);

		const sql_nested = toSql(value, 0, context);
		result_sql_parts.push(sql_nested.query);
		result_values.push(...sql_nested.values);

		const query_element = query[index + 1];
		if (query_element === undefined) {
			throw new TypeError(
				`Element ${index + 1} of argument "query" is not a string.`,
			);
		}

		result_sql_parts.push(query_element);
	}

	return new Sql(result_sql_parts.join(''), result_values);
}

/**
 * SQL builder
 * @param first - SQL query template / object / array.
 * @param rest - Values to be interpolated into the query.
 * @returns SQL object or helper.
 */
function sql(
	first: unknown,
	...rest: unknown[]
): Sql | SqlHelper<Record<string, unknown>> {
	// Tagged template
	if (isTemplateStringsArray(first)) {
		return createSql(first, ...rest);
	}

	// IN helper: sql(rows, 'id')
	if (
		Array.isArray(first)
		&& rest.length > 0
		&& rest.every((column) => typeof column === 'string')
		&& first.length > 0
		&& first.every((value) => isPlainObject(value))
	) {
		const column_names = rest;
		const main_column = column_names[0];
		if (main_column === undefined) {
			throw new TypeError('Column name is undefined.');
		}

		const values = first.map((row) => {
			const row_object = row as Record<string, unknown>;
			return row_object[main_column as string];
		});

		return toSql(values);
	}

	if (Array.isArray(first)) {
		const array = first;

		// INSERT helper: sql(rows)
		if (array.length > 0 && array.every((value) => isPlainObject(value))) {
			return insert(array as Record<string, unknown>[]);
		}

		// sql([1,2,3])
		return toSql(array);
	}

	if (isPlainObject(first)) {
		if (rest.length > 0 && rest.every((col) => typeof col === 'string')) {
			throw new TypeError('Columns after object in sql(...) must be strings.');
		}

		return new SqlHelper([first], rest as string[]);
	}

	if (first instanceof Sql) {
		return first;
	}

	if (typeof first === 'string') {
		return toSql(new SqlIdentifier(first));
	}

	return toSql(first);
}

const bunMySqlClient = new BunSQLRuntime({
	adapter: 'mysql',
});

/**
 *
 * @param first
 * @param rest
 * @returns
 */
function localSql(
	first: unknown,
	...rest: unknown[]
): Sql | SqlHelper<Record<string, unknown>> {
	return sql(first, ...rest);
}

/**
 * Copy properties from bunMySqlClient to localSql
 */
function attachBunSqlProperties(
	target: (...args: unknown[]) => unknown,
	source: BunSQLType,
): BunSQLType {
	const descriptors = Object.getOwnPropertyDescriptors(source);
	const result = Object.defineProperties(target, descriptors) as BunSQLType;

	return result;
}

export const bunSql: BunSQLType = attachBunSqlProperties(
	localSql,
	bunMySqlClient,
);
