import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App.jsx';

test('renders login page by default', () => {
	render(
		<MemoryRouter>
			<App />
		</MemoryRouter>
	);
	expect(screen.getByText(/Welcome Back/i)).toBeInTheDocument();
});

