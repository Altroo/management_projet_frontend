import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import type { AppSession } from '@/types/_initTypes';

const mockStore = configureStore({
	reducer: {
		_init: () => ({}),
		project: () => ({}),
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({ serializableCheck: false }),
});

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

jest.mock('@/utils/hooks', () => ({
	__esModule: true,
	useToast: () => ({ onSuccess: jest.fn(), onError: jest.fn() }),
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	useLanguage: () => ({ t: require('@/translations/fr').fr }),
}));

jest.mock('@/contexts/InitContext', () => ({
	useInitAccessToken: jest.fn(() => 'mock-token'),
}));

const mockUseGetExpenseQuery = jest.fn();
const mockCreateExpense = jest.fn();
const mockUpdateExpense = jest.fn();

jest.mock('@/store/services/project', () => ({
	__esModule: true,
	useGetExpenseQuery: (params: { id: number }, options: { skip: boolean }) =>
		mockUseGetExpenseQuery(params, options),
	useCreateExpenseMutation: () => [mockCreateExpense, { isLoading: false, error: undefined }],
	useUpdateExpenseMutation: () => [mockUpdateExpense, { isLoading: false, error: undefined }],
	useGetProjectsListQuery: () => ({ data: [], isLoading: false }),
	useGetCategoriesQuery: () => ({ data: [], isLoading: false }),
	useGetSubCategoriesQuery: () => ({ data: [], isLoading: false }),
}));

jest.mock('@/components/layouts/protected/protected', () => ({
	Protected: ({ children }: { children: React.ReactNode }) => <div data-testid="protected">{children}</div>,
}));

jest.mock('@/components/layouts/navigationBar/navigationBar', () => {
	const Mock = ({ children }: { children: React.ReactNode }) => <div data-testid="navigation-bar">{children}</div>;
	Mock.displayName = 'NavigationBar';
	return { __esModule: true, default: Mock };
});

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

jest.mock('@/utils/themes', () => ({
	textInputTheme: jest.fn(() => ({})),
}));

jest.mock('@/utils/helpers', () => ({
	getLabelForKey: jest.fn((labels: Record<string, string>, key: string) => labels[key] || key),
	setFormikAutoErrors: jest.fn(),
}));

jest.mock('@/utils/formValidationSchemas', () => ({
	expenseSchema: { parse: jest.fn() },
}));

jest.mock('zod-formik-adapter', () => ({
	toFormikValidationSchema: jest.fn(() => undefined),
}));

jest.mock('@/utils/routes', () => ({
	EXPENSES_LIST: '/dashboard/expenses',
}));

jest.mock('@mui/x-date-pickers/DatePicker', () => ({
	DatePicker: ({ label }: { label: string }) => <div data-testid="date-picker">{label}</div>,
}));

jest.mock('@mui/x-date-pickers/LocalizationProvider', () => ({
	LocalizationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@mui/x-date-pickers/AdapterDateFns', () => ({
	AdapterDateFns: jest.fn(),
}));

jest.mock('date-fns', () => ({
	format: jest.fn(),
	parseISO: jest.fn(),
}));

jest.mock('date-fns/locale', () => ({
	fr: {},
}));

import ExpenseFormClient from './expense-form';

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

describe('ExpenseFormClient', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUseGetExpenseQuery.mockReturnValue({
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
			renderWithProviders(<ExpenseFormClient session={mockSession} />);
			expect(screen.getByTestId('autocomplete-project')).toBeInTheDocument();
			expect(screen.getByTestId('input-description')).toBeInTheDocument();
			expect(screen.getByTestId('input-montant')).toBeInTheDocument();
			expect(screen.getByTestId('autocomplete-category')).toBeInTheDocument();
			expect(screen.getByTestId('autocomplete-sous_categorie')).toBeInTheDocument();
			expect(screen.getByTestId('input-element')).toBeInTheDocument();
			expect(screen.getByTestId('input-fournisseur')).toBeInTheDocument();
			expect(screen.getByTestId('input-notes')).toBeInTheDocument();
		});

		it('renders submit button with add text', () => {
			renderWithProviders(<ExpenseFormClient session={mockSession} />);
			expect(screen.getByTestId('submit-button')).toHaveTextContent('Nouvelle dépense');
		});

		it('renders back button', () => {
			renderWithProviders(<ExpenseFormClient session={mockSession} />);
			expect(screen.getByText('Liste des dépenses')).toBeInTheDocument();
		});

		it('renders section headers', () => {
			renderWithProviders(<ExpenseFormClient session={mockSession} />);
			expect(screen.getByText('Détails de la dépense')).toBeInTheDocument();
			expect(screen.getByText('Informations de catégorie')).toBeInTheDocument();
		});

		it('renders protected wrapper', () => {
			renderWithProviders(<ExpenseFormClient session={mockSession} />);
			expect(screen.getByTestId('protected')).toBeInTheDocument();
		});
	});

	describe('Edit Mode (with id)', () => {
		it('renders submit button with update text', () => {
			mockUseGetExpenseQuery.mockReturnValue({
				data: {
					id: 20,
					project: 1,
					date: '2025-02-01',
					category: 2,
					sous_categorie: 3,
					element: 'Paint',
					description: 'Expense test',
					montant: '3000',
					fournisseur: 'Supplier A',
					notes: '',
				},
				isLoading: false,
				error: undefined,
			});

			renderWithProviders(<ExpenseFormClient session={mockSession} id={20} />);
			expect(screen.getByTestId('submit-button')).toHaveTextContent('Mettre à jour');
		});
	});

	describe('Hook calls', () => {
		it('calls useGetExpenseQuery when in edit mode', () => {
			renderWithProviders(<ExpenseFormClient session={mockSession} id={456} />);
			expect(mockUseGetExpenseQuery).toHaveBeenCalledWith({ id: 456 }, expect.any(Object));
		});
	});
});
