import { describe, it, expect, beforeAll } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth.js';

describe('authenticateToken middleware', () => {
	beforeAll(() => {
		process.env.JWT_SECRET = 'test-secret';
	});

	it('returns 401 when no token provided', () => {
		const req = { headers: {} };
		const res = {
			statusCode: 200,
			status(code) { this.statusCode = code; return this; },
			json(payload) { this.payload = payload; },
		};
		let nextCalled = false;
		authenticateToken(req, res, () => { nextCalled = true; });
		expect(nextCalled).toBe(false);
		expect(res.statusCode).toBe(401);
		expect(res.payload).toEqual({ error: 'No token' });
	});

	it('returns 403 for invalid token', () => {
		const req = { headers: { authorization: 'Bearer invalid.token.here' } };
		const res = {
			statusCode: 200,
			status(code) { this.statusCode = code; return this; },
			json(payload) { this.payload = payload; },
		};
		let nextCalled = false;
		authenticateToken(req, res, () => { nextCalled = true; });
		expect(nextCalled).toBe(false);
		expect(res.statusCode).toBe(403);
		expect(res.payload).toEqual({ error: 'Invalid token' });
	});

	it('calls next and sets req.user for valid token', () => {
		const token = jwt.sign({ id: '123', username: 'tester' }, process.env.JWT_SECRET);
		const req = { headers: { authorization: `Bearer ${token}` } };
		const res = {
			status() { return this; },
			json() {},
		};
		let nextCalled = false;
		authenticateToken(req, res, () => { nextCalled = true; });
		expect(nextCalled).toBe(true);
		expect(req.user).toMatchObject({ id: '123', username: 'tester' });
	});
});

