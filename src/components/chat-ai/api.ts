import { getSession } from 'next-auth/react';
import { handleUnauthorized } from '@/utils/helpers';
import type { NavigationTarget } from './types';

export class ChatAPIError extends Error {
	constructor(public code: string) {
		super(code);
	}
}

export const chatRequest = async (path: string, token: string, init: RequestInit = {}) => {
	const request = (access: string) =>
		fetch(`${process.env.NEXT_PUBLIC_ROOT_API_URL}/ai/v1/${path}`, {
			...init,
			cache: 'no-store',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access}`, ...init.headers },
		});
	let response = await request(token);
	if (response.status === 401) {
		const fresh = await getSession();
		if (fresh?.accessToken && fresh.accessToken !== token) response = await request(fresh.accessToken);
		if (response.status === 401) {
			await handleUnauthorized();
			throw new ChatAPIError('NOT_AUTHENTICATED');
		}
	}
	if (!response.ok) {
		const data = await response.json().catch(() => ({}));
		throw new ChatAPIError(
			data.error?.code || (response.status === 403 ? 'PERMISSION_DENIED' : 'APPLICATION_UNAVAILABLE'),
		);
	}
	return response;
};

export const consumeChatStream = async (response: Response, receive: (event: string, data: unknown) => void) => {
	if (!response.body) throw new ChatAPIError('INCOMPLETE_RESPONSE');
	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';
	let completed = false;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			buffer += decoder.decode(value, { stream: true });
			if (buffer.length > 100000) throw new ChatAPIError('INVALID_MODEL_OUTPUT');
			let boundary: number;
			while ((boundary = buffer.indexOf('\n\n')) !== -1) {
				const block = buffer.slice(0, boundary);
				buffer = buffer.slice(boundary + 2);
				const event = block
					.split('\n')
					.find((line) => line.startsWith('event: '))
					?.slice(7);
				const data = block
					.split('\n')
					.filter((line) => line.startsWith('data: '))
					.map((line) => line.slice(6))
					.join('\n');
				if (!event || !data) continue;
				const payload = JSON.parse(data);
				if (event === 'error') throw new ChatAPIError(payload.code || 'INTERNAL_ERROR');
				receive(event, payload);
				if (event === 'message.completed') completed = true;
			}
		}
		if (!completed) throw new ChatAPIError('INCOMPLETE_RESPONSE');
	} finally {
		reader.releaseLock();
	}
};

export const safeNavigation = (target: NavigationTarget, companyId: number) => {
	if (target.application !== 'management_projet' || companyId !== 1 || target.company_id !== companyId) return null;
	const lists: Record<string, string> = {
		projects: 'projects',
		clients: 'clients',
		suppliers: 'suppliers',
		quotes: 'quotes',
		expenses: 'expenses',
		revenues: 'revenues',
		dashboard: '',
	};
	const details: Record<string, string> = {
		project: 'projects',
		client: 'clients',
		supplier: 'suppliers',
		quote: 'quotes',
		expense: 'expenses',
		revenue: 'revenues',
	};
	const resource = target.resource;
	let expected: string;
	if (Object.hasOwn(lists, resource) && target.identifier === null) expected = '/dashboard/' + lists[resource];
	else if (resource.endsWith('_new') && Object.hasOwn(details, resource.slice(0, -4)) && target.identifier === null)
		expected = '/dashboard/' + details[resource.slice(0, -4)] + '/new';
	else {
		const edit = resource.endsWith('_edit');
		const base = edit ? resource.slice(0, -5) : resource;
		if (
			!Object.hasOwn(details, base) ||
			!Number.isSafeInteger(target.identifier) ||
			target.identifier! < 1 ||
			target.identifier! > 2147483647
		)
			return null;
		expected = '/dashboard/' + details[base] + '/' + target.identifier + (edit ? '/edit' : '');
	}
	return target.path === expected ? expected : null;
};
export const downloadProjectPDF = async (id: number, companyId: number, token: string, resource = 'project') => {
	if (resource !== 'project' || companyId !== 1 || !Number.isSafeInteger(id) || id < 1)
		throw new ChatAPIError('INVALID_ARGUMENTS');
	const request = (access: string) =>
		fetch(`${process.env.NEXT_PUBLIC_ROOT_API_URL}/project/${id}/report.pdf`, {
			cache: 'no-store',
			headers: { Authorization: `Bearer ${access}` },
		});
	let response = await request(token);
	if (response.status === 401) {
		const fresh = await getSession();
		if (fresh?.accessToken && fresh.accessToken !== token) response = await request(fresh.accessToken);
		if (response.status === 401) {
			await handleUnauthorized();
			throw new ChatAPIError('NOT_AUTHENTICATED');
		}
	}
	if (!response.ok) throw new ChatAPIError(response.status === 403 ? 'PERMISSION_DENIED' : 'APPLICATION_UNAVAILABLE');
	const content = await response.blob();
	const url = URL.createObjectURL(content);
	const link = document.createElement('a');
	link.href = url;
	link.download = `rapport-projet-${id}.pdf`;
	link.click();
	URL.revokeObjectURL(url);
};
