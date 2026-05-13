import { jest } from '@jest/globals';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';

type Session = { user: { pk: number; email: string } } | null;

const mockAuth = jest.fn() as jest.MockedFunction<() => Promise<Session>>;
jest.mock('@/auth', () => ({
	__esModule: true,
	auth: mockAuth,
}));

const mockRedirect = jest.fn((url: string | URL) => ({ redirectedTo: String(url) }));
jest.mock('next/navigation', () => ({
	__esModule: true,
	redirect: mockRedirect,
}));

jest.mock('@/components/pages/settings/notifications', () => ({
	__esModule: true,
	default: () => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const React = require('react');
		return React.createElement('div', null, 'NOTIFICATIONS_MARKER');
	},
}));

const AUTH_LOGIN = '/login';
jest.mock('@/utils/routes', () => ({
	__esModule: true,
	AUTH_LOGIN,
}));

jest.mock('@/utils/serverTranslations', () => ({
	__esModule: true,
	getServerTranslations: async () => ({
		metadata: {
			notificationsTitle: 'Notifications',
			notificationsDescription: 'Notification preferences',
		},
	}),
}));

beforeEach(() => {
	jest.resetModules();
	jest.clearAllMocks();
});

describe('NotificationsPage server component', () => {
	it('redirects to login without a session', async () => {
		mockAuth.mockResolvedValueOnce(null);

		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const Page = require('./page').default as () => Promise<unknown>;

		await Page();
		expect(mockRedirect).toHaveBeenCalledWith(AUTH_LOGIN);
	});

	it('renders notifications with a session', async () => {
		mockAuth.mockResolvedValueOnce({ user: { pk: 1, email: 'admin@example.com' } });

		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const Page = require('./page').default as () => Promise<unknown>;

		const result = await Page();
		expect(renderToStaticMarkup(result as React.ReactElement)).toContain('NOTIFICATIONS_MARKER');
	});
});
