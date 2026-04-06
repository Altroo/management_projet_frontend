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
const CATEGORIES_LIST = '/dashboard/categories';
jest.mock('@/utils/routes', () => ({
	__esModule: true,
	AUTH_LOGIN,
	CATEGORIES_LIST,
}));

beforeEach(() => {
	jest.resetModules();
	jest.clearAllMocks();
});

afterEach(() => {
	jest.clearAllMocks();
});

type PageProps = { params: Promise<{ id: string }> };

describe('CategoryEditPage server component', () => {
	it('redirects to AUTH_LOGIN when no session', async () => {
		mockAuth.mockResolvedValueOnce(null);

		let Page: (props: PageProps) => Promise<unknown>;
		jest.isolateModules(() => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const mod = require('./page');
			Page = mod.default as (props: PageProps) => Promise<unknown>;
		});

		await Page!({ params: Promise.resolve({ id: '5' }) });
		expect(mockRedirect).toHaveBeenCalledWith(AUTH_LOGIN);
	});

	it('redirects to CATEGORIES_LIST when id is not a valid number', async () => {
		const sessionValue: Session = { user: { pk: 1, email: 'admin@site.com' } };
		mockAuth.mockResolvedValueOnce(sessionValue);

		let Page: (props: PageProps) => Promise<unknown>;
		jest.isolateModules(() => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const mod = require('./page');
			Page = mod.default as (props: PageProps) => Promise<unknown>;
		});

		await Page!({ params: Promise.resolve({ id: 'abc' }) });
		expect(mockRedirect).toHaveBeenCalledWith(CATEGORIES_LIST);
	});

	it('renders CategoryFormClient with session and numeric id when valid', async () => {
		const sessionValue: Session = { user: { pk: 2, email: 'editor@site.com' } };
		mockAuth.mockResolvedValueOnce(sessionValue);

		let Page: (props: PageProps) => Promise<unknown>;
		jest.isolateModules(() => {
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const mod = require('./page');
			Page = mod.default as (props: PageProps) => Promise<unknown>;
		});

		const result = await Page!({ params: Promise.resolve({ id: '15' }) });
		const html = renderToStaticMarkup(result as unknown as React.ReactElement);
		const decoded = html.replace(/&quot;/g, '"');

		expect(decoded).toContain('"pk":2');
		expect(decoded).toContain('"email":"editor@site.com"');
		expect(decoded).toContain('"id":15');
		expect(mockRedirect).not.toHaveBeenCalled();
	});
});
