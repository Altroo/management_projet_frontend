import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotFound from './not-found';

const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('next/navigation', () => ({
	useRouter: () => ({
		push: mockPush,
		back: mockBack,
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

	it('renders Retour button', () => {
		render(<NotFound />);
		expect(screen.getByText('Retour')).toBeInTheDocument();
	});

	it('renders Accueil button', () => {
		render(<NotFound />);
		expect(screen.getByText('Accueil')).toBeInTheDocument();
	});

	it('calls router.back() when Retour is clicked', () => {
		render(<NotFound />);
		fireEvent.click(screen.getByText('Retour'));
		expect(mockBack).toHaveBeenCalledTimes(1);
	});

	it('calls router.push(DASHBOARD) when Accueil is clicked', () => {
		render(<NotFound />);
		fireEvent.click(screen.getByText('Accueil'));
		expect(mockPush).toHaveBeenCalledWith('/dashboard');
	});
});
