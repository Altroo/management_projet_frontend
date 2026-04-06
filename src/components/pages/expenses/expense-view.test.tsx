import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import ExpenseViewClient from './expense-view';
import type { AppSession } from '@/types/_initTypes';

jest.mock('next/navigation', () => ({
	useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/utils/hooks', () => {
	const { translations } = jest.requireActual('@/translations');
	return {
		useToast: () => ({ onSuccess: jest.fn(), onError: jest.fn() }),
		useLanguage: () => ({ t: translations.fr }),
	};
});

jest.mock('@/store/services/project', () => ({
	...jest.requireActual('@/store/services/project'),
	useGetExpenseQuery: jest.fn(() => ({ data: undefined, isLoading: false, error: undefined })),
	useDeleteExpenseMutation: jest.fn(() => [jest.fn(), { isLoading: false }]),
}));

jest.mock('@/utils/routes', () => ({
	EXPENSES_LIST: '/dashboard/expenses',
	EXPENSES_EDIT: (id: number) => `/dashboard/expenses/${id}/edit`,
}));

jest.mock('@/components/formikElements/apiLoading/apiProgress/apiProgress', () => {
	const Mock = () => <div data-testid="api-progress" />;
	Mock.displayName = 'ApiProgress';
	return { __esModule: true, default: Mock };
});

jest.mock('@/components/formikElements/apiLoading/apiAlert/apiAlert', () => {
	const Mock = () => <div data-testid="api-alert" />;
	Mock.displayName = 'ApiAlert';
	return { __esModule: true, default: Mock };
});

jest.mock('@/components/layouts/navigationBar/navigationBar', () => {
	const Mock = ({ children }: { children: React.ReactNode }) => <div data-testid="navigation-bar">{children}</div>;
	Mock.displayName = 'NavigationBar';
	return { __esModule: true, default: Mock };
});

jest.mock('@/components/layouts/protected/protected', () => ({
	Protected: ({ children }: { children: React.ReactNode }) => <div data-testid="protected">{children}</div>,
}));

jest.mock('@/components/htmlElements/modals/actionModal/actionModals', () => {
	const Mock = () => <div data-testid="action-modals" />;
	Mock.displayName = 'ActionModals';
	return { __esModule: true, default: Mock };
});

const mockSession: AppSession = {
	accessToken: 'mock-token',
	refreshToken: 'mock-refresh-token',
	accessTokenExpiration: '2099-12-31T23:59:59Z',
	refreshTokenExpiration: '2099-12-31T23:59:59Z',
	expires: '2099-12-31T23:59:59Z',
	user: {
		id: '1',
		pk: 1,
		email: 'test@example.com',
		emailVerified: null,
		name: 'Test User',
		first_name: 'Test',
		last_name: 'User',
	},
};

describe('ExpenseViewClient', () => {
	it('shows warning when expense not found', () => {
		render(
			<Provider store={store}>
				<ExpenseViewClient session={mockSession} id={99} />
			</Provider>,
		);
		expect(screen.getByText(/dépense introuvable/i)).toBeInTheDocument();
	});

	it('renders expense details when data is loaded', () => {
		const { useGetExpenseQuery } = jest.requireMock('@/store/services/project');
		(useGetExpenseQuery as jest.Mock).mockReturnValue({
			data: {
				id: 1,
				project_name: 'Projet Alpha',
				description: 'Expense description',
				montant: '25000',
				date: '2025-04-10',
				category_name: 'Matériaux',
				sous_categorie_name: 'Peinture',
				element: 'Paint bucket',
				fournisseur: 'Fournisseur A',
				notes: 'Notes here',
				created_by_user_name: 'Admin',
			},
			isLoading: false,
			error: undefined,
		});

		render(
			<Provider store={store}>
				<ExpenseViewClient session={mockSession} id={1} />
			</Provider>,
		);

		expect(screen.getByText('Projet Alpha')).toBeInTheDocument();
		expect(screen.getByText('Matériaux')).toBeInTheDocument();
		expect(screen.getByText('Fournisseur A')).toBeInTheDocument();
	});

	it('renders edit and delete buttons when data is loaded', () => {
		const { useGetExpenseQuery } = jest.requireMock('@/store/services/project');
		(useGetExpenseQuery as jest.Mock).mockReturnValue({
			data: {
				id: 1,
				project_name: 'Test',
				montant: '1000',
				date: '2025-01-01',
			},
			isLoading: false,
			error: undefined,
		});

		render(
			<Provider store={store}>
				<ExpenseViewClient session={mockSession} id={1} />
			</Provider>,
		);

		expect(screen.getByRole('button', { name: /modifier/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /supprimer/i })).toBeInTheDocument();
	});

	it('renders back button to expenses list', () => {
		render(
			<Provider store={store}>
				<ExpenseViewClient session={mockSession} id={99} />
			</Provider>,
		);
		expect(screen.getByText('Liste des dépenses')).toBeInTheDocument();
	});
});
