module.exports = {
	testEnvironment: 'jsdom',
	extensionsToTreatAsEsm: ['.jsx', '.js'],
	setupFilesAfterEnv: ['<rootDir>/setupTests.js'],
	transform: {
		'^.+\\.[jt]sx?$': ['babel-jest', { presets: ['@babel/preset-env', ['@babel/preset-react', { runtime: 'automatic' }]] }],
	},
	moduleNameMapper: {
		'\\.(css|less|scss|sass)$': 'identity-obj-proxy',
	},
	testMatch: ['**/__tests__/**/*.test.[jt]sx'],
};

