import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import RevenuesListClient from './revenues-list';
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
	useGetRevenuesQuery: jest.fn(() => ({
		data: [{ id: 1, montant: 1200, description: 'Mission', project: 1, project_name: 'Projet Alpha', date: '2024-01-01' }],
		isLoading: false,
	})),
	useGetProjectsListQuery: jest.fn(() => ({ data: [], isLoading: false })),
	useDeleteRevenueMutation: jest.fn(() => [jest.fn(), { isLoading: false }]),
	useBulkDeleteRevenuesMutation: jest.fn(() => [jest.fn(), { isLoading: false }]),
}));

jest.mock('@/utils/routes', () => ({
	REVENUES_ADD: '/dashboard/revenues/new',
	REVENUES_VIEW: (id: number) => `/dashboard/revenues/${id}`,
	REVENUES_EDIT: (id: number) => `/dashboard/revenues/${id}/edit`,
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

jest.mock('@/components/shared/summaryKpiCard/summaryKpiCard', () => {
	const Mock = ({ label, value, testId }: { label: string; value: string; testId?: string }) => (
		<div data-testid={testId ?? 'summary-kpi-card'}>
			<span>{label}</span>
			<span>{value}</span>
		</div>
	);
	Mock.displayName = 'SummaryKpiCard';
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

describe('RevenuesListClient', () => {
	it('renders the component', () => {
		render(
			<Provider store={store}>
				<RevenuesListClient session={mockSession} />
			</Provider>,
		);
		expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
	});

	it('renders correct column headers', () => {
		render(
			<Provider store={store}>
				<RevenuesListClient session={mockSession} />
			</Provider>,
		);
		expect(screen.getByTestId('col-Description')).toBeInTheDocument();
		expect(screen.getByTestId('col-Projet')).toBeInTheDocument();
		expect(screen.getByTestId('col-Montant')).toBeInTheDocument();
		expect(screen.getByTestId('col-Date')).toBeInTheDocument();
		expect(screen.getByTestId('col-Créé par')).toBeInTheDocument();
		expect(screen.getByTestId('col-Actions')).toBeInTheDocument();
	});

	it('renders add button', () => {
		render(
			<Provider store={store}>
				<RevenuesListClient session={mockSession} />
			</Provider>,
		);
		expect(screen.getByText('Nouveau revenu')).toBeInTheDocument();
	});

	it('renders revenue total card', () => {
		render(
			<Provider store={store}>
				<RevenuesListClient session={mockSession} />
			</Provider>,
		);
		expect(screen.getByTestId('revenues-total-card')).toBeInTheDocument();
		expect(screen.getByText('Revenu total')).toBeInTheDocument();
		expect(screen.getByText('1.200 MAD')).toBeInTheDocument();
	});

	it('renders protected wrapper', () => {
		render(
			<Provider store={store}>
				<RevenuesListClient session={mockSession} />
			</Provider>,
		);
		expect(screen.getByTestId('protected')).toBeInTheDocument();
	});
});
