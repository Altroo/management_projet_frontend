import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import ProjectViewClient from './project-view';
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
	useGetProjectQuery: jest.fn(() => ({ data: undefined, isLoading: false, error: undefined })),
	useDeleteProjectMutation: jest.fn(() => [jest.fn(), { isLoading: false }]),
}));

jest.mock('@/utils/routes', () => ({
	PROJECTS_LIST: '/dashboard/projects',
	PROJECTS_EDIT: (id: number) => `/dashboard/projects/${id}/edit`,
}));

jest.mock('@/utils/rawData', () => ({
	STATUS_CHIP_COLORS: { en_cours: 'info', complete: 'success', en_attente: 'warning' },
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

describe('ProjectViewClient', () => {
	it('shows warning when project not found', () => {
		render(
			<Provider store={store}>
				<ProjectViewClient session={mockSession} id={99} />
			</Provider>,
		);
		expect(screen.getByText(/projet introuvable/i)).toBeInTheDocument();
	});

	it('renders project details when data is loaded', () => {
		const { useGetProjectQuery } = jest.requireMock('@/store/services/project');
		(useGetProjectQuery as jest.Mock).mockReturnValue({
			data: {
				id: 1,
				nom: 'Projet Alpha',
				description: 'Description test',
				budget_total: '100000',
				date_debut: '2025-01-01',
				date_fin: '2025-12-31',
				status: 'en_cours',
				chef_de_projet: 'Chef Test',
				nom_client: 'Client Test',
				telephone_client: '+212600000000',
				email_client: 'client@test.com',
				notes: 'Some notes',
				revenue_total: '60000',
				depenses_totales: '40000',
				benefice: '20000',
				marge: '33.3',
				jours_restants: 180,
				created_by_user_name: 'Admin',
			},
			isLoading: false,
			error: undefined,
		});

		render(
			<Provider store={store}>
				<ProjectViewClient session={mockSession} id={1} />
			</Provider>,
		);

		expect(screen.getByText('Projet Alpha')).toBeInTheDocument();
		expect(screen.getByText('Chef Test')).toBeInTheDocument();
		expect(screen.getByText('Client Test')).toBeInTheDocument();
	});

	it('renders edit and delete buttons when data is loaded', () => {
		const { useGetProjectQuery } = jest.requireMock('@/store/services/project');
		(useGetProjectQuery as jest.Mock).mockReturnValue({
			data: {
				id: 1,
				nom: 'Projet Alpha',
				budget_total: '100000',
				status: 'en_cours',
				revenue_total: '0',
				depenses_totales: '0',
				benefice: '0',
				marge: '0',
				jours_restants: 0,
			},
			isLoading: false,
			error: undefined,
		});

		render(
			<Provider store={store}>
				<ProjectViewClient session={mockSession} id={1} />
			</Provider>,
		);

		expect(screen.getByRole('button', { name: /modifier/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /supprimer/i })).toBeInTheDocument();
	});

	it('renders back button to projects list', () => {
		render(
			<Provider store={store}>
				<ProjectViewClient session={mockSession} id={99} />
			</Provider>,
		);
		expect(screen.getByText('Liste des projets')).toBeInTheDocument();
	});
});
