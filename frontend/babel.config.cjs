module.exports = {
	presets: [
		['@babel/preset-env', { targets: { node: 'current' } }],
		['@babel/preset-react', { runtime: 'automatic' }],
	],
	plugins: [
		['babel-plugin-transform-vite-meta-env', {
			env: {
				VITE_API_URL: 'http://localhost:5000',
				VITE_SOCKET_URL: 'http://localhost:5000'
			}
		}]
	]
};

