import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import ProjectDashboardClient from './project-dashboard';
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
	useGetMultiProjectDashboardQuery: jest.fn(() => ({
		data: undefined,
		isLoading: false,
	})),
}));

jest.mock('@/utils/rawData', () => ({
	CHART_COLORS: { primary: '#1976d2', secondary: '#2e7d32', error: '#d32f2f' },
	PROJECT_COLORS: ['#1976d2', '#2e7d32', '#ed6c02'],
	CHART_OPTS: { responsive: true, maintainAspectRatio: false },
	STATUS_CHIP_COLORS: { en_cours: 'info', complete: 'success', en_attente: 'warning' },
}));

jest.mock('@/utils/helpers', () => ({
	formatNumber: jest.fn((n: string | number) => Number(n).toLocaleString('fr-MA')),
}));

jest.mock('chart.js', () => ({
	Chart: { register: jest.fn() },
	CategoryScale: jest.fn(),
	LinearScale: jest.fn(),
	BarElement: jest.fn(),
	ArcElement: jest.fn(),
	Title: jest.fn(),
	Tooltip: jest.fn(),
	Legend: jest.fn(),
}));

jest.mock('react-chartjs-2', () => ({
	Bar: () => <div data-testid="bar-chart" />,
	Doughnut: () => <div data-testid="doughnut-chart" />,
}));

jest.mock('@/components/layouts/navigationBar/navigationBar', () => {
	const Mock = ({ children }: { children: React.ReactNode }) => <div data-testid="navigation-bar">{children}</div>;
	Mock.displayName = 'NavigationBar';
	return { __esModule: true, default: Mock };
});

jest.mock('@/components/layouts/protected/protected', () => ({
	Protected: ({ children }: { children: React.ReactNode }) => <div data-testid="protected">{children}</div>,
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

describe('ProjectDashboardClient', () => {
	it('renders the dashboard component', () => {
		render(
			<Provider store={store}>
				<ProjectDashboardClient session={mockSession} />
			</Provider>,
		);
		expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
	});

	it('renders overview title', () => {
		render(
			<Provider store={store}>
				<ProjectDashboardClient session={mockSession} />
			</Provider>,
		);
		expect(screen.getByText(/aperçu des projets/i)).toBeInTheDocument();
	});

	it('renders KPI cards with data', () => {
		const { useGetMultiProjectDashboardQuery } = jest.requireMock('@/store/services/project');
		(useGetMultiProjectDashboardQuery as jest.Mock).mockReturnValue({
			data: {
				total_projects: 5,
				total_budget: '200000',
				total_revenue: '150000',
				total_expenses: '80000',
				total_profit: '70000',
				total_margin: 46.7,
				budget_utilisation: 40.0,
				projects: [
					{
						id: 1,
						nom: 'Projet A',
						status: 'en_cours',
						budget_total: '100000',
						revenue: '80000',
						expenses: '40000',
						profit: '40000',
					},
				],
			},
			isLoading: false,
		});

		render(
			<Provider store={store}>
				<ProjectDashboardClient session={mockSession} />
			</Provider>,
		);

		expect(screen.getByText('5')).toBeInTheDocument();
	});

	it('renders loading spinner when loading', () => {
		const { useGetMultiProjectDashboardQuery } = jest.requireMock('@/store/services/project');
		(useGetMultiProjectDashboardQuery as jest.Mock).mockReturnValue({
			data: undefined,
			isLoading: true,
		});

		render(
			<Provider store={store}>
				<ProjectDashboardClient session={mockSession} />
			</Provider>,
		);

		expect(screen.getByRole('progressbar')).toBeInTheDocument();
	});

	it('renders charts when data is available', () => {
		const { useGetMultiProjectDashboardQuery } = jest.requireMock('@/store/services/project');
		(useGetMultiProjectDashboardQuery as jest.Mock).mockReturnValue({
			data: {
				total_projects: 2,
				total_budget: '100000',
				total_revenue: '80000',
				total_expenses: '50000',
				total_profit: '30000',
				total_margin: 37.5,
				budget_utilisation: 50.0,
				projects: [
					{
						id: 1,
						nom: 'Projet A',
						status: 'en_cours',
						budget_total: '60000',
						revenue: '50000',
						expenses: '30000',
						profit: '20000',
					},
					{
						id: 2,
						nom: 'Projet B',
						status: 'complete',
						budget_total: '40000',
						revenue: '30000',
						expenses: '20000',
						profit: '10000',
					},
				],
			},
			isLoading: false,
		});

		render(
			<Provider store={store}>
				<ProjectDashboardClient session={mockSession} />
			</Provider>,
		);

		expect(screen.getAllByTestId('bar-chart').length).toBeGreaterThan(0);
	});

	it('renders protected wrapper', () => {
		render(
			<Provider store={store}>
				<ProjectDashboardClient session={mockSession} />
			</Provider>,
		);
		expect(screen.getByTestId('protected')).toBeInTheDocument();
	});
});
