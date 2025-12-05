export class MySQLError extends Error {
	constructor(
		message: string,
		public readonly code: string,
		public readonly errno: number | undefined,
		public readonly sqlState: string | undefined,
	) {
		super(message);
	}
}
