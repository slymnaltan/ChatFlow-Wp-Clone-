module.exports = {
	testEnvironment: 'jsdom',
	setupFilesAfterEnv: ['<rootDir>/setupTests.js'],
	transform: {
		'^.+\\.[jt]sx?$': 'babel-jest',
	},
	moduleNameMapper: {
		'\\.(css|less|scss|sass)$': 'identity-obj-proxy',
	},
	testMatch: ['**/__tests__/**/*.test.[jt]sx'],
};

