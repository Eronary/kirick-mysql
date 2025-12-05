  interface SQL extends AsyncDisposable {
    /**
     * Executes a SQL query using template literals
     * @example
     * ```ts
     * const [user] = await sql<Users[]>`select * from users where id = ${1}`;
     * ```
     */
    <T = any>(strings: TemplateStringsArray, ...values: unknown[]): SQL.Query<T>;

    /**
     * Execute a SQL query using a string
     *
     * @example
     * ```ts
     * const users = await sql<User[]>`SELECT * FROM users WHERE id = ${1}`;
     * ```
     */
    <T = any>(string: string): SQL.Query<T>;

    /**
     * Helper function for inserting an object into a query
     *
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
    <T extends { [Key in PropertyKey]: unknown }>(obj: T | T[] | readonly T[]): SQL.Helper<T>; // Contributor note: This is the same as the signature below with the exception of the columns and the Pick<T, Keys>

    /**
     * Helper function for inserting an object into a query, supporting specific columns
     *
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
    ): SQL.Helper<Pick<T, Keys>>; // Contributor note: This is the same as the signature above with the exception of this signature tracking keys

    /**
     * Helper function for inserting any serializable value into a query
     *
     * @example
     * ```ts
     * const result = await sql`SELECT * FROM users WHERE id IN ${sql([1, 2, 3])}`;
     * ```
     */
    <T>(value: T): SQL.Helper<T>;
  }
