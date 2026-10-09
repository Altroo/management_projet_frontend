import { ReadableStream } from 'node:stream/web';
import { TextDecoder } from 'node:util';
import { consumeChatStream, safeNavigation, chatRequest, downloadProjectPDF } from './api';
import { getSession } from 'next-auth/react';
import { handleUnauthorized } from '@/utils/helpers';
import type { NavigationTarget } from './types';
jest.mock('@/utils/helpers', () => ({ handleUnauthorized: jest.fn() }));
jest.mock('next-auth/react', () => ({ getSession: jest.fn() }));
Object.assign(globalThis, { TextDecoder });
const target: NavigationTarget = {
	application: 'management_projet',
	resource: 'project',
	identifier: 12,
	company_id: 1,
	path: '/dashboard/projects/12',
};
const stream = (...chunks: string[]) =>
	({
		body: new ReadableStream({
			start(controller) {
				for (const c of chunks) controller.enqueue(new TextEncoder().encode(c));
				controller.close();
			},
		}),
	}) as unknown as Response;
it.each(['project', 'client', 'supplier', 'quote', 'expense', 'revenue'])(
	'validates native %s detail and edit paths',
	(resource) => {
		const paths: Record<string, string> = {
			project: 'projects',
			client: 'clients',
			supplier: 'suppliers',
			quote: 'quotes',
			expense: 'expenses',
			revenue: 'revenues',
		};
		const path = '/dashboard/' + paths[resource] + '/12';
		expect(safeNavigation({ ...target, resource, path }, 1)).toBe(path);
		expect(safeNavigation({ ...target, resource: resource + '_edit', path: path + '/edit' }, 1)).toBe(path + '/edit');
	},
);
it.each([
	'javascript:alert(1)',
	'//evil.test',
	'https://evil.test',
	'/dashboard/projects/99',
	'/dashboard/projects/12?company_id=1',
])('rejects unsafe or substituted destinations %s', (path) =>
	expect(safeNavigation({ ...target, path }, 1)).toBeNull(),
);
it.each([0, -1, 1.5, 2147483648])('rejects invalid ID %s', (identifier) =>
	expect(safeNavigation({ ...target, identifier }, 1)).toBeNull(),
);
it('rejects other workspaces and nonexistent category pages', () => {
	expect(safeNavigation(target, 2)).toBeNull();
	expect(
		safeNavigation({ ...target, resource: 'categories', identifier: null, path: '/dashboard/categories' }, 1),
	).toBeNull();
});
it('streams fragmented French content and final completion', async () => {
	const receive = jest.fn();
	await consumeChatStream(
		stream('event: message.delta\ndata: {"text":"Dépenses"}', '\n\nevent: message.completed\ndata: {"id":"done"}\n\n'),
		receive,
	);
	expect(receive).toHaveBeenNthCalledWith(1, 'message.delta', { text: 'Dépenses' });
	expect(receive).toHaveBeenNthCalledWith(2, 'message.completed', { id: 'done' });
});
it('rejects an incomplete response', async () => {
	await expect(
		consumeChatStream(stream('event: message.delta\ndata: {"text":"partial"}\n\n'), jest.fn()),
	).rejects.toMatchObject({ code: 'INCOMPLETE_RESPONSE' });
});
it('propagates permission revocation', async () => {
	await expect(
		consumeChatStream(stream('event: error\ndata: {"code":"PERMISSION_DENIED"}\n\n'), jest.fn()),
	).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
});
it('bounds untrusted buffered data', async () => {
	await expect(consumeChatStream(stream('x'.repeat(100001)), jest.fn())).rejects.toMatchObject({
		code: 'INVALID_MODEL_OUTPUT',
	});
});
describe('native JWT expiry', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		global.fetch = jest.fn();
		process.env.NEXT_PUBLIC_ROOT_API_URL = 'http://localhost:8003/api';
	});
	it('refreshes the existing session once for chat requests', async () => {
		jest
			.mocked(fetch)
			.mockResolvedValueOnce({ status: 401 } as Response)
			.mockResolvedValueOnce({ status: 200, ok: true } as Response);
		jest.mocked(getSession).mockResolvedValue({ accessToken: 'fresh' } as never);
		await chatRequest('capabilities/', 'expired');
		expect(fetch).toHaveBeenCalledTimes(2);
		expect(jest.mocked(fetch).mock.calls[1][1]?.headers).toMatchObject({ Authorization: 'Bearer fresh' });
	});
	it('expires the UI after an unrecoverable authentication failure', async () => {
		jest.mocked(fetch).mockResolvedValue({ status: 401 } as Response);
		jest.mocked(getSession).mockResolvedValue(null);
		await expect(chatRequest('capabilities/', 'expired')).rejects.toMatchObject({ code: 'NOT_AUTHENTICATED' });
		expect(handleUnauthorized).toHaveBeenCalledTimes(1);
	});
	it('PDF requests reuse session refresh before downloading', async () => {
		jest
			.mocked(fetch)
			.mockResolvedValueOnce({ status: 401 } as Response)
			.mockResolvedValueOnce({ status: 403, ok: false } as Response);
		jest.mocked(getSession).mockResolvedValue({ accessToken: 'fresh' } as never);
		await expect(downloadProjectPDF(12, 1, 'expired')).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
		expect(jest.mocked(fetch).mock.calls[1][1]?.headers).toEqual({ Authorization: 'Bearer fresh' });
	});
	it('does not call PDF endpoints for invalid resources', async () => {
		await expect(downloadProjectPDF(12, 1, 'fixture', 'quote')).rejects.toMatchObject({ code: 'INVALID_ARGUMENTS' });
		expect(fetch).not.toHaveBeenCalled();
	});
});
