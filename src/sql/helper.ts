import type { SQL as BunSQLType } from 'bun';
import { isPlainObject } from '../util.js';

/**
 * SqlHelper represents a parameter or serializable value inside of a query.
 */
export class SqlHelper<const T extends object> implements BunSQLType.Helper<T> {
	constructor(
		public readonly value: T[],
		public readonly columns: (keyof T)[],
	) {}

	/**
	 * Picks a subset of columns from an object.
	 * @returns - New object containing only the specified columns
	 * @example - row = { name: 'Alice', email: 'alice@example.com' };
	 * pickColumns(row, ['name']); // { name: 'Alice' }
	 */
	pickColumns(): Record<PropertyKey, unknown>[] {
		return this.value.map((item) => {
			if (!isPlainObject(item)) {
				throw new TypeError('Invalid value');
			}

			const result: Record<PropertyKey, unknown> = {};

			const cols: (keyof T)[] =
				this.columns.length > 0
					? this.columns
					: (Object.keys(item) as (keyof T)[]);

			for (const col of cols) {
				result[col] = item[col as string];
			}

			return result;
		});
	}
}
