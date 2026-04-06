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
	useLanguage: () => ({ t: require('@/translations/fr').fr }),
}));

jest.mock('@/contexts/InitContext', () => ({
	useInitAccessToken: jest.fn(() => 'mock-token'),
}));

const mockUseGetCategoryQuery = jest.fn();
const mockCreateCategory = jest.fn();
const mockUpdateCategory = jest.fn();

jest.mock('@/store/services/project', () => ({
	__esModule: true,
	useGetCategoryQuery: (params: { id: number }, options: { skip: boolean }) =>
		mockUseGetCategoryQuery(params, options),
	useCreateCategoryMutation: () => [mockCreateCategory, { isLoading: false, error: undefined }],
	useUpdateCategoryMutation: () => [mockUpdateCategory, { isLoading: false, error: undefined }],
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
	categorySchema: { parse: jest.fn() },
}));

jest.mock('zod-formik-adapter', () => ({
	toFormikValidationSchema: jest.fn(() => undefined),
}));

jest.mock('@/utils/routes', () => ({
	CATEGORIES_LIST: '/dashboard/categories',
}));

import CategoryFormClient from './category-form';

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

describe('CategoryFormClient', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUseGetCategoryQuery.mockReturnValue({
			data: undefined,
			isLoading: false,
			error: undefined,
		});
	});

	afterEach(() => {
		cleanup();
	});

	describe('Add Mode (no id)', () => {
		it('renders name input field', () => {
			renderWithProviders(<CategoryFormClient session={mockSession} />);
			expect(screen.getByTestId('input-name')).toBeInTheDocument();
		});

		it('renders submit button with add text', () => {
			renderWithProviders(<CategoryFormClient session={mockSession} />);
			expect(screen.getByTestId('submit-button')).toHaveTextContent('Nouvelle catégorie');
		});

		it('renders back button', () => {
			renderWithProviders(<CategoryFormClient session={mockSession} />);
			expect(screen.getByText('Liste des catégories')).toBeInTheDocument();
		});

		it('renders protected wrapper', () => {
			renderWithProviders(<CategoryFormClient session={mockSession} />);
			expect(screen.getByTestId('protected')).toBeInTheDocument();
		});
	});

	describe('Edit Mode (with id)', () => {
		it('renders submit button with update text', () => {
			mockUseGetCategoryQuery.mockReturnValue({
				data: { id: 5, name: 'Test Category' },
				isLoading: false,
				error: undefined,
			});

			renderWithProviders(<CategoryFormClient session={mockSession} id={5} />);
			expect(screen.getByTestId('submit-button')).toHaveTextContent('Mettre à jour');
		});
	});

	describe('Hook calls', () => {
		it('calls useGetCategoryQuery when in edit mode', () => {
			renderWithProviders(<CategoryFormClient session={mockSession} id={123} />);
			expect(mockUseGetCategoryQuery).toHaveBeenCalledWith({ id: 123 }, expect.any(Object));
		});
	});
});
