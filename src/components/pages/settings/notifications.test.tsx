import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

const mockStore = configureStore({
	reducer: {
		_init: () => ({}),
		account: () => ({}),
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: false,
		}),
});

const mockOnSuccess = jest.fn();
const mockOnError = jest.fn();
const mockUpdatePreferences = jest.fn().mockReturnValue({ unwrap: () => Promise.resolve({}) });

jest.mock('@/utils/hooks', () => ({
	__esModule: true,
	useToast: () => ({
		onSuccess: mockOnSuccess,
		onError: mockOnError,
	}),
	useAppSelector: jest.fn(() => null),
	useLanguage: () => ({ language: 'fr' as const, setLanguage: jest.fn(), t: jest.requireActual('@/translations').translations.fr }),
}));

jest.mock('@/store/selectors', () => ({
	__esModule: true,
	getProfilState: jest.fn(),
}));

jest.mock('@/components/layouts/navigationBar/navigationBar', () => ({
	__esModule: true,
	default: ({ children, title }: { children: React.ReactNode; title: string }) => (
		<div data-testid="navigation-bar">
			<h1 data-testid="nav-title">{title}</h1>
			{children}
		</div>
	),
}));

jest.mock('@/store/services/notification', () => ({
	__esModule: true,
	useGetNotificationPreferencesQuery: () => ({
		data: {
			notify_budget_overrun: true,
			notify_budget_threshold: false,
			notify_deadline_approaching: true,
			notify_project_overdue: true,
			notify_status_change: false,
			budget_threshold_percent: 80,
			deadline_alert_days: 7,
		},
		isLoading: false,
	}),
	useUpdateNotificationPreferencesMutation: () => [mockUpdatePreferences, { isLoading: false }],
}));

jest.mock('@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton', () => ({
	__esModule: true,
	default: ({ buttonText, onClick }: { buttonText: string; onClick: () => void }) => (
		<button data-testid="submit-button" onClick={onClick}>
			{buttonText}
		</button>
	),
}));

jest.mock('@/components/formikElements/apiLoading/apiProgress/apiProgress', () => ({
	__esModule: true,
	default: () => <div data-testid="api-loader">Loading...</div>,
}));

jest.mock('@/components/formikElements/customTextInput/customTextInput', () => ({
	__esModule: true,
	default: ({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (event: React.ChangeEvent<HTMLInputElement>) => void }) => (
		<div data-testid={`custom-input-${id}`}>
			<label htmlFor={id}>{label}</label>
			<input id={id} value={value} onChange={onChange} />
		</div>
	),
}));

jest.mock('@/utils/helpers', () => ({
	setFormikAutoErrors: jest.fn(),
}));

jest.mock('@/utils/themes', () => ({
	__esModule: true,
	textInputTheme: jest.fn(() => ({})),
}));

jest.mock('@/styles/dashboard/settings/settings.module.sass', () => ({
	flexRootStack: 'flexRootStack',
	pageTitle: 'pageTitle',
	form: 'form',
	maxWidth: 'maxWidth',
	mobileButton: 'mobileButton',
	submitButton: 'submitButton',
	main: 'main',
	fixMobile: 'fixMobile',
}));

import NotificationsClient from './notifications';

const renderWithProviders = (ui: React.ReactElement) => render(<Provider store={mockStore}>{ui}</Provider>);

describe('NotificationsClient', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	it('renders the page title', () => {
		renderWithProviders(<NotificationsClient />);
		expect(screen.getAllByText('Préférences de notifications').length).toBeGreaterThan(0);
	});

	it('renders notification switches and threshold inputs', () => {
		renderWithProviders(<NotificationsClient />);
		expect(screen.getByText('Alerter pour les dépassements de budget')).toBeInTheDocument();
		expect(screen.getByText('Alerter au seuil de budget')).toBeInTheDocument();
		expect(screen.getByText('Alerter à l’approche des échéances')).toBeInTheDocument();
		expect(screen.getByText('Alerter pour les projets en retard')).toBeInTheDocument();
		expect(screen.getByLabelText('Seuil d’alerte budget (%)')).toBeInTheDocument();
		expect(screen.getByLabelText('Jours avant échéance pour alerte')).toBeInTheDocument();
	});

	it('populates the form with preferences data', () => {
		renderWithProviders(<NotificationsClient />);
		expect(screen.getByLabelText('Alerter pour les dépassements de budget')).toBeChecked();
		expect(screen.getByLabelText('Alerter au seuil de budget')).not.toBeChecked();
	});

	it('calls updatePreferences on submit', async () => {
		renderWithProviders(<NotificationsClient />);
		fireEvent.click(screen.getByTestId('submit-button'));

		await waitFor(() => {
			expect(mockUpdatePreferences).toHaveBeenCalledWith({
				notify_budget_overrun: true,
				notify_budget_threshold: false,
				notify_deadline_approaching: true,
				notify_project_overdue: true,
				notify_status_change: false,
				budget_threshold_percent: 80,
				deadline_alert_days: 7,
			});
		});
	});

	it('requests browser notification permission on mount', () => {
		const requestPermission = jest.fn().mockResolvedValue('granted');
		Object.defineProperty(window, 'Notification', {
			value: { permission: 'default', requestPermission },
			writable: true,
			configurable: true,
		});

		renderWithProviders(<NotificationsClient />);
		expect(requestPermission).toHaveBeenCalled();
	});
});