import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import type { AppSession } from '@/types/_initTypes';

// Minimal mock store
const mockStore = configureStore({
	reducer: {
		_init: () => ({}),
		project: () => ({}),
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({ serializableCheck: false }),
});

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
	__esModule: true,
	useRouter: () => ({
		push: mockPush,
		back: jest.fn(),
		replace: jest.fn(),
		refresh: jest.fn(),
		forward: jest.fn(),
		prefetch: jest.fn(),
	}),
}));

// Mock hooks
jest.mock('@/utils/hooks', () => ({
	__esModule: true,
	useToast: () => ({ onSuccess: jest.fn(), onError: jest.fn() }),
	useLanguage: () => ({ t: require('@/translations/fr').fr }),
}));

jest.mock('@/contexts/InitContext', () => ({
	useInitAccessToken: jest.fn(() => 'mock-token'),
}));

// Mock project service hooks
const mockUseGetProjectQuery = jest.fn();
const mockCreateProject = jest.fn();
const mockUpdateProject = jest.fn();

jest.mock('@/store/services/project', () => ({
	__esModule: true,
	useGetProjectQuery: (params: { id: number }, options: { skip: boolean }) =>
		mockUseGetProjectQuery(params, options),
	useCreateProjectMutation: () => [mockCreateProject, { isLoading: false, error: undefined }],
	useUpdateProjectMutation: () => [mockUpdateProject, { isLoading: false, error: undefined }],
}));

// Mock Protected
jest.mock('@/components/layouts/protected/protected', () => ({
	Protected: ({ children }: { children: React.ReactNode }) => <div data-testid="protected">{children}</div>,
}));

// Mock NavigationBar
jest.mock('@/components/layouts/navigationBar/navigationBar', () => {
	const Mock = ({ children }: { children: React.ReactNode }) => <div data-testid="navigation-bar">{children}</div>;
	Mock.displayName = 'NavigationBar';
	return { __esModule: true, default: Mock };
});

// Mock form sub-components
jest.mock('@/components/formikElements/customTextInput/customTextInput', () => ({
	__esModule: true,
	default: ({ id, label }: { id: string; label: string }) => (
		<div data-testid={`input-${id}`}>
			<label>{label}</label>
		</div>
	),
}));

jest.mock('@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect', () => ({
	__esModule: true,
	default: ({ id, label }: { id: string; label: string }) => (
		<div data-testid={`autocomplete-${id}`}>
			<label>{label}</label>
		</div>
	),
}));

jest.mock('@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton', () => ({
	__esModule: true,
	default: ({ buttonText, type }: { buttonText: string; type?: string }) => (
		<button data-testid="submit-button" type={type as 'submit' | 'button'}>
			{buttonText}
		</button>
	),
}));

jest.mock('@/components/formikElements/apiLoading/apiProgress/apiProgress', () => ({
	__esModule: true,
	default: () => <div data-testid="api-loader">Loading...</div>,
}));

jest.mock('@/components/formikElements/apiLoading/apiAlert/apiAlert', () => ({
	__esModule: true,
	default: () => <div data-testid="api-alert">Error</div>,
}));

jest.mock('@/utils/themes', () => ({
	textInputTheme: jest.fn(() => ({})),
}));

jest.mock('@/utils/helpers', () => ({
	getLabelForKey: jest.fn((labels: Record<string, string>, key: string) => labels[key] || key),
	setFormikAutoErrors: jest.fn(),
}));

jest.mock('@/utils/rawData', () => ({
	projectStatusItemsList: jest.fn(() => [
		{ code: 'en_cours', value: 'En cours' },
		{ code: 'complete', value: 'Complété' },
	]),
}));

jest.mock('@/utils/formValidationSchemas', () => ({
	projectSchema: { parse: jest.fn() },
}));

jest.mock('zod-formik-adapter', () => ({
	toFormikValidationSchema: jest.fn(() => undefined),
}));

jest.mock('@/utils/routes', () => ({
	PROJECTS_LIST: '/dashboard/projects',
}));

// Import after mocks
import ProjectFormClient from './project-form';

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

const renderWithProviders = (ui: React.ReactElement) => {
	return render(<Provider store={mockStore}>{ui}</Provider>);
};

describe('ProjectFormClient', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUseGetProjectQuery.mockReturnValue({
			data: undefined,
			isLoading: false,
			error: undefined,
		});
	});

	afterEach(() => {
		cleanup();
	});

	describe('Add Mode (no id)', () => {
		it('renders form fields', () => {
			renderWithProviders(<ProjectFormClient session={mockSession} />);
			expect(screen.getByTestId('input-nom')).toBeInTheDocument();
			expect(screen.getByTestId('input-description')).toBeInTheDocument();
			expect(screen.getByTestId('input-budget_total')).toBeInTheDocument();
			expect(screen.getByTestId('input-chef_de_projet')).toBeInTheDocument();
		});

		it('renders submit button with add text', () => {
			renderWithProviders(<ProjectFormClient session={mockSession} />);
			expect(screen.getByTestId('submit-button')).toHaveTextContent('Nouveau projet');
		});

		it('renders back button text', () => {
			renderWithProviders(<ProjectFormClient session={mockSession} />);
			expect(screen.getByText('Liste des projets')).toBeInTheDocument();
		});

		it('renders section headers', () => {
			renderWithProviders(<ProjectFormClient session={mockSession} />);
			expect(screen.getByText('Informations du projet')).toBeInTheDocument();
			expect(screen.getByText('Informations du client')).toBeInTheDocument();
			expect(screen.getAllByText('Notes').length).toBeGreaterThanOrEqual(1);
		});

		it('renders protected wrapper', () => {
			renderWithProviders(<ProjectFormClient session={mockSession} />);
			expect(screen.getByTestId('protected')).toBeInTheDocument();
		});

		it('renders client fields', () => {
			renderWithProviders(<ProjectFormClient session={mockSession} />);
			expect(screen.getByTestId('input-nom_client')).toBeInTheDocument();
			expect(screen.getByTestId('input-telephone_client')).toBeInTheDocument();
			expect(screen.getByTestId('input-email_client')).toBeInTheDocument();
		});

		it('renders status autocomplete', () => {
			renderWithProviders(<ProjectFormClient session={mockSession} />);
			expect(screen.getByTestId('autocomplete-status')).toBeInTheDocument();
		});
	});

	describe('Edit Mode (with id)', () => {
		it('renders submit button with update text', () => {
			mockUseGetProjectQuery.mockReturnValue({
				data: {
					id: 10,
					nom: 'Test Project',
					description: 'A test',
					budget_total: '50000',
					date_debut: '2025-01-01',
					date_fin: '2025-12-31',
					status: 'en_cours',
					chef_de_projet: 'Chef',
					nom_client: 'Client',
					telephone_client: '',
					email_client: '',
					notes: '',
				},
				isLoading: false,
				error: undefined,
			});

			renderWithProviders(<ProjectFormClient session={mockSession} id={10} />);
			expect(screen.getByTestId('submit-button')).toHaveTextContent('Mettre à jour');
		});

		it('still renders back button in edit mode', () => {
			mockUseGetProjectQuery.mockReturnValue({
				data: { id: 10, nom: 'Test', budget_total: '1000', status: 'en_cours' },
				isLoading: false,
				error: undefined,
			});

			renderWithProviders(<ProjectFormClient session={mockSession} id={10} />);
			expect(screen.getByText('Liste des projets')).toBeInTheDocument();
		});
	});

	describe('Hook calls', () => {
		it('calls useGetProjectQuery when in edit mode', () => {
			renderWithProviders(<ProjectFormClient session={mockSession} id={456} />);
			expect(mockUseGetProjectQuery).toHaveBeenCalledWith({ id: 456 }, expect.any(Object));
		});
	});
});
