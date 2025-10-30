module.exports = {
	// Node environment for backend tests
	testEnvironment: 'node',
	transform: {},
	collectCoverageFrom: ['**/*.js', '!node_modules/**', '!dist/**'],
	testMatch: ['**/__tests__/**/*.test.js'],
};

