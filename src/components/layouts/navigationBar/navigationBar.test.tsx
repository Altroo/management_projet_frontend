import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NavigationBar from './navigationBar';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import React from 'react';

jest.mock('@/utils/clientHelpers', () => ({
	Desktop: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
	TabletAndMobile: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

let mockPathname = '/dashboard';
jest.mock('next/navigation', () => ({
	usePathname: () => mockPathname,
}));

let mockIsMobile = false;
jest.mock('@mui/material', () => {
	const actual = jest.requireActual('@mui/material');
	return {
		...actual,
		useMediaQuery: () => mockIsMobile,
	};
});

const mockCookiesDeleter = jest.fn();
jest.mock('@/utils/apiHelpers', () => ({
	cookiesDeleter: (...args: unknown[]) => mockCookiesDeleter(...(args as unknown[])),
}));

const mockSignOut = jest.fn().mockResolvedValue(undefined);
const mockUseSession = jest.fn();
jest.mock('next-auth/react', () => ({
	signOut: (...args: unknown[]) => mockSignOut(...(args as unknown[])),
	useSession: () => mockUseSession(),
}));

const mockUseIsClient = jest.fn(() => true);
const mockUseAppSelector = jest.fn();
const mockDispatch = jest.fn();
jest.mock('@/utils/hooks', () => ({
	useAppSelector: (fn: unknown) => mockUseAppSelector(fn),
	useAppDispatch: () => mockDispatch,
	useIsClient: () => mockUseIsClient(),
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	useLanguage: () => ({ t: require('@/translations/fr').fr, language: 'fr', setLanguage: jest.fn() }),
}));

const mockProfileData = {
	avatar_cropped: undefined as string | undefined,
	first_name: 'John',
	last_name: 'Doe',
	gender: 'Homme',
	is_staff: false,
};

describe('NavigationBar', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockPathname = '/dashboard';
		mockProfileData.avatar_cropped = undefined;
		mockProfileData.first_name = 'John';
		mockProfileData.last_name = 'Doe';
		mockProfileData.gender = 'Homme';
		mockProfileData.is_staff = false;
		mockUseAppSelector.mockImplementation((selector: (...args: unknown[]) => unknown) => {
			if (typeof selector === 'function' && selector.name === 'getUnreadNotificationCount') {
				return 0;
			}
			return mockProfileData;
		});
		mockUseSession.mockImplementation(() => ({ data: {}, status: 'authenticated' }));
		mockIsMobile = false;
	});

	it('renders the title passed as prop', () => {
		render(
			<Provider store={store}>
				<NavigationBar title="Mon Contrat">
					<div>Content</div>
				</NavigationBar>
			</Provider>,
		);
		expect(screen.getByText('Mon Contrat')).toBeInTheDocument();
	});

	it('calls cookiesDeleter and signOut when logout clicked', async () => {
		render(
			<Provider store={store}>
				<NavigationBar title="Dashboard">
					<div>Content</div>
				</NavigationBar>
			</Provider>,
		);

		const logoutBtn = screen.getByRole('button', { name: /Se déconnecter/i });
		await userEvent.click(logoutBtn);

		expect(mockCookiesDeleter).toHaveBeenCalledTimes(1);
		expect(mockSignOut).toHaveBeenCalledTimes(1);
		expect(mockSignOut.mock.calls[0][0]).toMatchObject({ redirect: true });
	});

	it('shows Bienvenu greeting for Homme gender', () => {
		render(
			<Provider store={store}>
				<NavigationBar title="t1">
					<div />
				</NavigationBar>
			</Provider>,
		);
		expect(screen.getByText(/Bienvenu/i)).toBeInTheDocument();
	});

	it('shows Bienvenue greeting for Femme gender', () => {
		mockProfileData.avatar_cropped = undefined;
		mockProfileData.first_name = 'Marie';
		mockProfileData.last_name = 'C';
		mockProfileData.gender = 'Femme';
		mockProfileData.is_staff = false;
		render(
			<Provider store={store}>
				<NavigationBar title="t2">
					<div />
				</NavigationBar>
			</Provider>,
		);
		expect(
			screen.getAllByText(/Bienvenue|Bienvenu/i).some((el) => /Bienvenue/.test(el.textContent || '')),
		).toBeTruthy();
	});

	it('shows Utilisateurs section for staff users', () => {
		mockProfileData.avatar_cropped = undefined;
		mockProfileData.first_name = 'Admin';
		mockProfileData.last_name = 'User';
		mockProfileData.gender = 'Homme';
		mockProfileData.is_staff = true;
		render(
			<Provider store={store}>
				<NavigationBar title="Admin">
					<div />
				</NavigationBar>
			</Provider>,
		);
		expect(screen.getByText('Utilisateurs')).toBeInTheDocument();
	});

	it('does not show Utilisateurs section for non-staff users', () => {
		render(
			<Provider store={store}>
				<NavigationBar title="User">
					<div />
				</NavigationBar>
			</Provider>,
		);
		expect(screen.queryByText('Utilisateurs')).not.toBeInTheDocument();
	});

	it('drawer toggle button only appears on mobile', async () => {
		mockIsMobile = false;
		const { rerender } = render(
			<Provider store={store}>
				<NavigationBar title="D">
					<div />
				</NavigationBar>
			</Provider>,
		);
		expect(screen.queryByLabelText('Basculer le tiroir de navigation')).not.toBeInTheDocument();

		mockIsMobile = true;
		rerender(
			<Provider store={store}>
				<NavigationBar title="D2">
					<div />
				</NavigationBar>
			</Provider>,
		);
		const toggleBtn = screen.getByLabelText('Basculer le tiroir de navigation');
		expect(toggleBtn).toBeInTheDocument();
		await userEvent.click(toggleBtn);
	});

	it('handles pathname with no matching menu item without error', () => {
		mockPathname = '/some/random/path';
		render(
			<Provider store={store}>
				<NavigationBar title="Random">
					<div />
				</NavigationBar>
			</Provider>,
		);
		expect(screen.getByText('Random')).toBeInTheDocument();
	});
});
