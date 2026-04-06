import { jest } from '@jest/globals';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';

type SessionUser = { pk: number; email: string };
type Session = { user: SessionUser } | null;

const mockAuth = jest.fn() as jest.MockedFunction<() => Promise<Session>>;
jest.mock('@/auth', () => ({
	__esModule: true,
	auth: mockAuth,
}));

const REDIRECT_SENTINEL = (to: string) => ({ redirectedTo: to });
const mockRedirect = jest.fn((url: string | URL) => REDIRECT_SENTINEL(String(url)));
jest.mock('next/navigation', () => ({
	__esModule: true,
	redirect: mockRedirect,
}));

jest.mock('@/components/pages/categories/category-form', () => ({
	__esModule: true,
	default: (props: { session?: Session; id?: number }) => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const React = require('react');
		return React.createElement(
			'div',
			null,
			`CATEGORY_FORM_CLIENT_MARKER:${JSON.stringify({ session: props?.session ?? null, id: props?.id ?? null })}`,
		);
	},
}));

const AUTH_LOGIN = '/login';
jest.mock('@/utils/routes', () => ({
	__esModule: true,
	AUTH_LOGIN,
}));

beforeEach(() => {
	jest.resetModules();
	jest.clearAllMocks();
});

afterEach(() => {
	jest.clearAllMocks();
});

describe('CategoryAddPage server component', () => {
	it('redirects to AUTH_LOGIN when no session', async () => {
		mockAuth.mockResolvedValueOnce(null);

		let Page: () => Promise<unknown>;
		jest.isolateModules(() => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const mod = require('./page');
			Page = mod.default as () => Promise<unknown>;
		});

		await Page!();
		expect(mockRedirect).toHaveBeenCalledWith(AUTH_LOGIN);
	});

	it('renders CategoryFormClient with session and no id when session exists', async () => {
		const sessionValue: Session = { user: { pk: 8, email: 'manager@site.com' } };
		mockAuth.mockResolvedValueOnce(sessionValue);

		let Page: () => Promise<unknown>;
		jest.isolateModules(() => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const mod = require('./page');
			Page = mod.default as () => Promise<unknown>;
		});

		const result = await Page!();
		const html = renderToStaticMarkup(result as unknown as React.ReactElement);
		const decoded = html.replace(/&quot;/g, '"');

		expect(decoded).toContain('"pk":8');
		expect(decoded).toContain('"email":"manager@site.com"');
		expect(decoded).toContain('"id":null');
		expect(mockRedirect).not.toHaveBeenCalled();
	});
});
