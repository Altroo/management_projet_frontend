import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotFound from './not-found';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
	useRouter: () => ({
		push: mockPush,
		forward: jest.fn(),
		refresh: jest.fn(),
		replace: jest.fn(),
		prefetch: jest.fn(),
	}),
}));

jest.mock('@/utils/routes', () => ({
	DASHBOARD: '/dashboard',
}));

describe('NotFound (404 page)', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders the 404 text', () => {
		render(<NotFound />);
		expect(screen.getByText('404')).toBeInTheDocument();
	});

	it('renders "Page introuvable" heading', () => {
		render(<NotFound />);
		expect(screen.getByText('Page introuvable')).toBeInTheDocument();
	});

	it('renders the description text', () => {
		render(<NotFound />);
		expect(screen.getByText(/la page que vous recherchez/i)).toBeInTheDocument();
	});

	it('does not offer a history-dependent return', () => {
		render(<NotFound />);
		expect(screen.queryByRole('button', { name: 'Retour' })).not.toBeInTheDocument();
	});

	it('renders Accueil button', () => {
		render(<NotFound />);
		expect(screen.getByText('Accueil')).toBeInTheDocument();
	});

	it('calls router.push(DASHBOARD) when Accueil is clicked', () => {
		render(<NotFound />);
		fireEvent.click(screen.getByText('Accueil'));
		expect(mockPush).toHaveBeenCalledWith('/dashboard');
	});
});
