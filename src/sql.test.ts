import { describe, expect, test } from 'bun:test';
import { bunSql } from './sql.js';

describe('sql``', () => {
	test('no values', () => {
		expect(bunSql`SELECT 1`).toMatchObject({
			query: 'SELECT 1',
			values: [],
		});
	});

	test('1 value', () => {
		const name = 'Alice';

		expect(bunSql`SELECT * FROM users WHERE name = ${name}`).toMatchObject({
			query: 'SELECT * FROM users WHERE name = ?',
			values: ['Alice'],
		});
	});

	test('2 values', () => {
		const name = 'Alice';

		expect(
			bunSql`SELECT * FROM users WHERE user_id = ${1} OR name = ${name}`,
		).toMatchObject({
			query: 'SELECT * FROM users WHERE user_id = ? OR name = ?',
			values: [1, 'Alice'],
		});
	});

	test('array', () => {
		const names = ['Alice', 'Bob'];

		expect(bunSql`SELECT * FROM users WHERE name IN (${names})`).toMatchObject({
			query: 'SELECT * FROM users WHERE name IN (?,?)',
			values: ['Alice', 'Bob'],
		});
	});

	test('array of arrays', () => {
		const names = [
			['Alice', 'alice@example.com'],
			['Bob', 'bob@example.com'],
		];

		expect(
			bunSql`INSERT INTO users (name, email) VALUES ${names}`,
		).toMatchObject({
			query: 'INSERT INTO users (name, email) VALUES (?,?),(?,?)',
			values: ['Alice', 'alice@example.com', 'Bob', 'bob@example.com'],
		});
	});

	test('nested sql', () => {
		const name = 'Alice';

		expect(
			bunSql`SELECT * FROM users WHERE user_id = ${1} ${'test' in globalThis ? bunSql`` : bunSql`OR name = ${name}`}`,
		).toMatchObject({
			query: 'SELECT * FROM users WHERE user_id = ? OR name = ?',
			values: [1, 'Alice'],
		});
	});
});

test('sql.id', () => {
	expect(
		bunSql`SELECT * FROM ${bunSql('users')} WHERE ${bunSql('user_id')} = ${1}`,
	).toMatchObject({
		query: 'SELECT * FROM ?? WHERE ?? = ?',
		values: ['users', 'user_id', 1],
	});
});

describe('sql.insert', () => {
	test('one row', () => {
		expect(
			bunSql`INSERT INTO users ${bunSql({
				name: 'Alice',
				email: 'alice@example.com',
			})}`,
		).toMatchObject({
			query: 'INSERT INTO users (??,??) VALUES (?,?)',
			values: ['name', 'email', 'Alice', 'alice@example.com'],
		});
	});

	test('multiple rows', () => {
		expect(
			bunSql`INSERT INTO users ${bunSql([
				{
					name: 'Alice',
					email: 'alice@example.com',
				},
				{
					name: 'Bob',
					email: 'bob@example.com',
				},
			])}`,
		).toMatchObject({
			query: 'INSERT INTO users (??,??) VALUES (?,?),(?,?)',
			values: [
				'name',
				'email',
				'Alice',
				'alice@example.com',
				'Bob',
				'bob@example.com',
			],
		});
	});
});

test('sql.set', () => {
	expect(
		bunSql`UPDATE users SET ${bunSql({
			name: 'Alice',
			email: 'alice@example.com',
		})}`,
	).toMatchObject({
		query: 'UPDATE users SET ??=?,??=?',
		values: ['name', 'Alice', 'email', 'alice@example.com'],
	});
});
