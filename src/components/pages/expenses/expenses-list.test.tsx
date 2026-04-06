import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import ExpensesListClient from './expenses-list';
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
	useGetExpensesQuery: jest.fn(() => ({ data: [], isLoading: false })),
	useGetProjectsListQuery: jest.fn(() => ({ data: [], isLoading: false })),
	useGetCategoriesQuery: jest.fn(() => ({ data: [], isLoading: false })),
	useDeleteExpenseMutation: jest.fn(() => [jest.fn(), { isLoading: false }]),
	useBulkDeleteExpensesMutation: jest.fn(() => [jest.fn(), { isLoading: false }]),
}));

jest.mock('@/utils/routes', () => ({
	EXPENSES_ADD: '/dashboard/expenses/new',
	EXPENSES_VIEW: (id: number) => `/dashboard/expenses/${id}`,
	EXPENSES_EDIT: (id: number) => `/dashboard/expenses/${id}/edit`,
}));

jest.mock('@/components/shared/paginatedDataGrid/paginatedDataGrid', () => {
	const Mock = ({ columns }: { columns: { headerName: string }[] }) => (
		<div data-testid="paginated-data-grid">
			{columns.map((c) => (
				<span key={c.headerName} data-testid={`col-${c.headerName}`}>
					{c.headerName}
				</span>
			))}
		</div>
	);
	Mock.displayName = 'PaginatedDataGrid';
	return { __esModule: true, default: Mock };
});

jest.mock('@/components/htmlElements/modals/actionModal/actionModals', () => {
	const Mock = () => <div data-testid="action-modals" />;
	Mock.displayName = 'ActionModals';
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

jest.mock('@/components/shared/mobileActionsMenu/mobileActionsMenu', () => {
	const Mock = () => <div data-testid="mobile-actions-menu" />;
	Mock.displayName = 'MobileActionsMenu';
	return { __esModule: true, default: Mock };
});

jest.mock('@/components/htmlElements/tooltip/darkTooltip/darkTooltip', () => {
	const Mock = ({ children }: { children: React.ReactNode }) => <>{children}</>;
	Mock.displayName = 'DarkTooltip';
	return { __esModule: true, default: Mock };
});

jest.mock('@/components/shared/chipSelectFilter/chipSelectFilterBar', () => {
	const Mock = () => <div data-testid="chip-filter-bar" />;
	Mock.displayName = 'ChipSelectFilterBar';
	return { __esModule: true, default: Mock };
});

jest.mock('@/components/shared/dateRangeFilter/dateRangeFilterOperator', () => ({
	createDateRangeFilterOperator: jest.fn(() => []),
}));

jest.mock('@/components/shared/numericFilter/numericFilterOperator', () => ({
	createNumericFilterOperators: jest.fn(() => []),
}));

jest.mock('@/components/shared/dropdownFilter/dropdownFilter', () => ({
	createDropdownFilterOperators: jest.fn(() => []),
}));

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

describe('ExpensesListClient', () => {
	it('renders the component', () => {
		render(
			<Provider store={store}>
				<ExpensesListClient session={mockSession} />
			</Provider>,
		);
		expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
	});

	it('renders correct column headers', () => {
		render(
			<Provider store={store}>
				<ExpensesListClient session={mockSession} />
			</Provider>,
		);
		expect(screen.getByTestId('col-Description')).toBeInTheDocument();
		expect(screen.getByTestId('col-Projet')).toBeInTheDocument();
		expect(screen.getByTestId('col-Catégorie')).toBeInTheDocument();
		expect(screen.getByTestId('col-Montant')).toBeInTheDocument();
		expect(screen.getByTestId('col-Date')).toBeInTheDocument();
		expect(screen.getByTestId('col-Fournisseur')).toBeInTheDocument();
		expect(screen.getByTestId('col-Créé par')).toBeInTheDocument();
		expect(screen.getByTestId('col-Actions')).toBeInTheDocument();
	});

	it('renders add button', () => {
		render(
			<Provider store={store}>
				<ExpensesListClient session={mockSession} />
			</Provider>,
		);
		expect(screen.getByText('Nouvelle dépense')).toBeInTheDocument();
	});

	it('renders protected wrapper', () => {
		render(
			<Provider store={store}>
				<ExpensesListClient session={mockSession} />
			</Provider>,
		);
		expect(screen.getByTestId('protected')).toBeInTheDocument();
	});
});
