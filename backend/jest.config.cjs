module.exports = {
	// Node environment for backend tests
	testEnvironment: 'node',
	// Recognize ESM imports in tests
	extensionsToTreatAsEsm: ['.js'],
	transform: {},
	collectCoverageFrom: ['**/*.js', '!node_modules/**', '!dist/**'],
	testMatch: ['**/__tests__/**/*.test.js'],
};

