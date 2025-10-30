import { render, screen } from '@testing-library/react';
import * as React from 'react';
import App from '../App.jsx';

jest.mock('../pages/Chat.jsx', () => () => <div>Chat Page</div>);

beforeEach(() => {
	localStorage.clear();
});

test('shows Login when no token', () => {
	render(<App />);
	expect(screen.getByText(/Welcome Back/i)).toBeInTheDocument();
});

test('shows Chat when token exists', () => {
	localStorage.setItem('token', 'x');
	localStorage.setItem('user', JSON.stringify({ username: 'u' }));
	render(<App />);
	expect(screen.getByText(/Chat Page/i)).toBeInTheDocument();
});

