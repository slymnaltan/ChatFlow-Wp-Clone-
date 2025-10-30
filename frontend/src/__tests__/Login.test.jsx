import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/Login.jsx';
import axios from 'axios';

jest.mock('axios');

test('submits credentials and calls onLogin on success', async () => {
	const onLogin = jest.fn();
	axios.post.mockResolvedValueOnce({ data: { user: { username: 'u' }, token: 't' } });
	render(
		<MemoryRouter>
			<Login onLogin={onLogin} />
		</MemoryRouter>
	);

	fireEvent.change(screen.getByPlaceholderText(/Email/i), { target: { value: 'a@b.com' } });
	fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: '123456' } });
	fireEvent.click(screen.getByRole('button', { name: /login/i }));

	await waitFor(() => expect(onLogin).toHaveBeenCalledWith({ username: 'u' }, 't'));
});

test('shows error when API fails', async () => {
	const onLogin = jest.fn();
	axios.post.mockRejectedValueOnce({ response: { data: { error: 'Login failed' } } });
	render(
		<MemoryRouter>
			<Login onLogin={onLogin} />
		</MemoryRouter>
	);

	fireEvent.change(screen.getByPlaceholderText(/Email/i), { target: { value: 'bad@b.com' } });
	fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: 'wrong' } });
	fireEvent.click(screen.getByRole('button', { name: /login/i }));

	await waitFor(() => expect(screen.getByText(/Login failed/i)).toBeInTheDocument());
	expect(onLogin).not.toHaveBeenCalled();
});

