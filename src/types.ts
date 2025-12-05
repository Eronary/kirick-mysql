interface SQLHelper<T> {
	readonly value: T[];
	readonly columns: (keyof T)[];
}

export interface SQLFn {
	/**
	 * Executes a SQL query using template literals
	 * @example
	 * ```ts
	 * const [user] = await sql<Users[]>`select * from users where id = ${1}`;
	 * ```
	 */
	<T>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T>;

	/**
	 * Creates identifier.
	 * @example
	 * ```ts
	 * const users = await sql`SELECT * FROM ${sql('users')}`;
	 * ```
	 */
	(string: string): SQLQuery;

	/**
	 * Helper function for inserting an object into a query
	 * @example
	 * ```ts
	 * // Insert an object
	 * const result = await sql`insert into users ${sql(users)} returning *`;
	 *
	 * // Or pick specific columns
	 * const result = await sql`insert into users ${sql(users, "id", "name")} returning *`;
	 *
	 * // Or a single object
	 * const result = await sql`insert into users ${sql(user)} returning *`;
	 * ```
	 */
	<T extends { [Key in PropertyKey]: unknown }>(
		obj: T | T[] | readonly T[],
	): SQLHelper<T>; // Contributor note: This is the same as the signature below with the exception of the columns and the Pick<T, Keys>

	/**
	 * Helper function for inserting an object into a query, supporting specific columns
	 * @example
	 * ```ts
	 * // Insert an object
	 * const result = await sql`insert into users ${sql(users)} returning *`;
	 *
	 * // Or pick specific columns
	 * const result = await sql`insert into users ${sql(users, "id", "name")} returning *`;
	 *
	 * // Or a single object
	 * const result = await sql`insert into users ${sql(user)} returning *`;
	 * ```
	 */
	<T extends { [Key in PropertyKey]: unknown }, Keys extends keyof T = keyof T>(
		obj: T | T[] | readonly T[],
		...columns: readonly Keys[]
	): SQLHelper<Pick<T, Keys>>; // Contributor note: This is the same as the signature above with the exception of this signature tracking keys

	/**
	 * Helper function for inserting any serializable value into a query
	 * @example
	 * ```ts
	 * const result = await sql`SELECT * FROM users WHERE id IN ${sql([1, 2, 3])}`;
	 * ```
	 */
	<T>(value: T): SQLHelper<T>;
}

export type SQLClientProperties = {
	options: string;
};

type SQLClient = SQLFn & SQLClientProperties;

export interface SQLClientConstructor {
	new (options: string): SQLClient;
}
