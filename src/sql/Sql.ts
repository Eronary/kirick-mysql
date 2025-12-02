export class Sql {
	constructor(
		public readonly query: string,
		public readonly values: unknown[],
	) {}
}
