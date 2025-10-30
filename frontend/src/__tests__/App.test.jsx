import { render, screen } from '@testing-library/react';
import App from '../App.jsx';

test('renders login page by default', () => {
	render(<App />);
	expect(screen.getByText(/Welcome Back/i)).toBeInTheDocument();
});

