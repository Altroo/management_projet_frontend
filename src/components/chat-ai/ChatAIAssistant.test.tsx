import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ChatAIAssistant, ChatAIFloatingButton, ChatAIPanel } from './ChatAIAssistant';
import { ChatAIResults, validConfirmation } from './ChatAIResults';
import { chatRequest, consumeChatStream, ChatAPIError } from './api';
import { getAccessToken } from '@/store/selectors';
import type { ChatCapabilities, ChatCard } from './types';
let mockToken = 'fixture-token',
	mockProfile = { id: 1, can_view: true, is_staff: false },
	mockPath = '/dashboard',
	mockLanguage: 'en' | 'fr' = 'fr';
const mockPush = jest.fn(),
	mockDispatch = jest.fn();
jest.mock('next/navigation', () => ({ usePathname: () => mockPath, useRouter: () => ({ push: mockPush }) }));
jest.mock('@/utils/hooks', () => ({
	useAppSelector: (selector: unknown) => (selector === getAccessToken ? mockToken : mockProfile),
	useAppDispatch: () => mockDispatch,
	useLanguage: () => ({ language: mockLanguage, t: jest.requireActual('@/translations').translations[mockLanguage] }),
}));
jest.mock('@/store/selectors', () => ({ getAccessToken: jest.fn(), getProfilState: jest.fn() }));
jest.mock('@/utils/helpers', () => ({ handleUnauthorized: jest.fn() }));
jest.mock('@/store/services/project', () => ({
	projectApi: { util: { invalidateTags: (tags: string[]) => ({ type: 'project/invalidateTags', payload: tags }) } },
}));
jest.mock('./api', () => ({ ...jest.requireActual('./api'), chatRequest: jest.fn(), consumeChatStream: jest.fn() }));
const theme = createTheme({ palette: { primary: { main: '#0274D7' } } });
const themed = (node: React.ReactNode) => <ThemeProvider theme={theme}>{node}</ThemeProvider>;
const capabilities: ChatCapabilities = {
	application: 'management_projet',
	languages: ['fr', 'en'],
	companies: [
		{
			id: 1,
			name: 'Demo Company',
			can_create: true,
			can_update: true,
			can_delete: true,
			can_print: true,
			suggestions: ['Affiche les projets en cours.'],
			shortcuts: [
				{
					command: '/voir',
					title: 'Rechercher',
					help: 'Décrivez le projet ou le client.',
					example: '/voir projet du client Demo',
				},
			],
		},
	],
};
const response = (data: unknown) => ({ json: async () => data }) as Response;
const reply = (text: string, cards: ChatCard[] = []) => ({ id: 'reply-' + text, role: 'assistant', text, cards });
const deferred = <T,>() => {
	let resolve!: (v: T) => void;
	const promise = new Promise<T>((done) => {
		resolve = done;
	});
	return { promise, resolve };
};
let handlers: Record<string, (init?: RequestInit) => Response | Promise<Response>>;
beforeEach(() => {
	jest.clearAllMocks();
	mockToken = 'fixture-token';
	mockProfile = { id: 1, can_view: true, is_staff: false };
	mockPath = '/dashboard';
	mockLanguage = 'fr';
	handlers = {};
	jest.mocked(chatRequest).mockImplementation(async (path, _token, init) => {
		if (handlers[path]) return handlers[path](init);
		if (path.startsWith('capabilities/')) return response(capabilities);
		if (path === 'conversations/') return response({ id: 'conversation-1' });
		throw new Error('Unexpected request ' + path);
	});
	jest
		.mocked(consumeChatStream)
		.mockImplementation(async (res, receive) => receive('message.completed', await res.json()));
});
const open = async () => {
	const result = render(themed(<ChatAIAssistant />));
	fireEvent.click(await screen.findByRole('button', { name: 'Ask AI Assistant' }));
	await screen.findByRole('textbox', { name: 'Votre message' });
	return result;
};
const send = (text: string) => {
	fireEvent.change(screen.getByRole('textbox', { name: 'Votre message' }), { target: { value: text } });
	fireEvent.click(screen.getByRole('button', { name: 'Envoyer' }));
};
it('places one accessible floating button in the viewport', () => {
	const toggle = jest.fn();
	render(themed(<ChatAIFloatingButton open={false} toggle={toggle} />));
	const button = screen.getByRole('button', { name: 'Ask AI Assistant' });
	expect(button).toHaveStyle({ position: 'fixed', width: '56px', height: '56px' });
	fireEvent.click(button);
	expect(toggle).toHaveBeenCalledTimes(1);
});
it('retains drafts while minimized and supports Escape', () => {
	const close = jest.fn();
	const { rerender } = render(
		themed(
			<ChatAIPanel minimized={false} close={close}>
				<input aria-label="draft" defaultValue="Demo" />
			</ChatAIPanel>,
		),
	);
	expect(screen.getByRole('dialog')).toHaveFocus();
	fireEvent.keyDown(document, { key: 'Escape' });
	expect(close).toHaveBeenCalledTimes(1);
	rerender(
		themed(
			<ChatAIPanel minimized close={close}>
				<input aria-label="draft" defaultValue="Demo" />
			</ChatAIPanel>,
		),
	);
	expect(screen.getByLabelText('draft')).toHaveValue('Demo');
	expect(screen.getByRole('dialog', { hidden: true })).not.toBeVisible();
});
it.each(['anonymous', 'no-read', 'public'])('hides the assistant for %s context', async (mode) => {
	if (mode === 'anonymous') mockToken = '';
	if (mode === 'no-read') mockProfile.can_view = false;
	if (mode === 'public') mockPath = '/login';
	render(themed(<ChatAIAssistant />));
	await act(async () => {});
	expect(screen.queryByRole('button', { name: 'Ask AI Assistant' })).not.toBeInTheDocument();
});
it('uses Management Projet identity and sends suggestions once on click', async () => {
	handlers['conversations/conversation-1/messages/'] = () => response(reply('Projets trouvés'));
	await open();
	expect(screen.getByText('Management Projet')).toBeVisible();
	expect(screen.queryByText('Facturation')).not.toBeInTheDocument();
	fireEvent.click(screen.getByRole('button', { name: 'Affiche les projets en cours.' }));
	await screen.findByText('Projets trouvés');
	const calls = jest.mocked(chatRequest).mock.calls.filter(([p]) => p.endsWith('/messages/'));
	expect(calls).toHaveLength(1);
	expect(JSON.parse(calls[0][2]!.body as string)).toMatchObject({
		text: 'Affiche les projets en cours.',
		context: { interface_language: 'fr' },
	});
});
it('a slash selection fills the draft without sending', async () => {
	await open();
	fireEvent.change(screen.getByRole('textbox', { name: 'Votre message' }), { target: { value: '/' } });
	expect(screen.getByText(/sans raccourci/)).toBeVisible();
	fireEvent.click(screen.getByRole('button', { name: /\/voir Rechercher/ }));
	expect(screen.getByRole('textbox', { name: 'Votre message' })).toHaveValue('/voir ');
	expect(jest.mocked(chatRequest).mock.calls.some(([p]) => p.endsWith('/messages/'))).toBe(false);
});
it('submits a bare slash command and displays the backend usage message', async () => {
	handlers['conversations/conversation-1/messages/'] = () =>
		response(reply('Décrivez votre recherche : /voir projet du client Demo'));
	await open();
	send('/voir');
	expect(await screen.findByText('Décrivez votre recherche : /voir projet du client Demo')).toBeVisible();
});
it('keeps replies across routes and sends the new current page context', async () => {
	handlers['conversations/conversation-1/messages/'] = () => response(reply('Réponse conservée'));
	const { rerender } = await open();
	send('Trouve un projet');
	await screen.findByText('Réponse conservée');
	mockPath = '/dashboard/projects/42';
	rerender(themed(<ChatAIAssistant />));
	expect(screen.getByText('Réponse conservée')).toBeVisible();
	send('Explique ce projet');
	await waitFor(() =>
		expect(jest.mocked(chatRequest).mock.calls.filter(([p]) => p.endsWith('/messages/'))).toHaveLength(2),
	);
	const call = jest
		.mocked(chatRequest)
		.mock.calls.filter(([p]) => p.endsWith('/messages/'))
		.at(-1)!;
	expect(JSON.parse(call[2]!.body as string).context).toEqual({
		interface_language: 'fr',
		resource: 'project',
		identifier: 42,
	});
	expect(screen.getAllByRole('button', { name: 'Ask AI Assistant' })).toHaveLength(1);
});
it('drops private chat state on session expiration', async () => {
	handlers['conversations/conversation-1/messages/'] = () => response(reply('Private fixture response'));
	await open();
	send('Search');
	await screen.findByText('Private fixture response');
	act(() => window.dispatchEvent(new Event('session-expired')));
	expect(screen.queryByText('Private fixture response')).not.toBeInTheDocument();
	expect(screen.queryByRole('button', { name: 'Ask AI Assistant' })).not.toBeInTheDocument();
});
it('older history detail cannot replace a newer conversation', async () => {
	const old = deferred<unknown>();
	handlers['conversations/?company_id=1'] = () =>
		response([{ id: 'older', title: 'Demo older', updated_at: '2026-10-09' }]);
	handlers['conversations/older/'] = () => ({ json: () => old.promise }) as Response;
	handlers['conversations/conversation-1/messages/'] = () => response(reply('New reply'));
	await open();
	fireEvent.click(screen.getByRole('button', { name: 'Historique' }));
	fireEvent.click(await screen.findByRole('button', { name: 'Ouvrir la conversation : Demo older' }));
	fireEvent.click(screen.getByRole('button', { name: 'Nouvelle conversation' }));
	send('New message');
	await screen.findByText('New reply');
	await act(async () => old.resolve({ company_id: 1, messages: [reply('Old private reply')] }));
	expect(screen.queryByText('Old private reply')).not.toBeInTheDocument();
	expect(screen.getByText('New reply')).toBeVisible();
});
it('cancellation discards a late model completion', async () => {
	const old = deferred<unknown>();
	handlers['conversations/conversation-1/messages/'] = () => ({ json: () => old.promise }) as Response;
	await open();
	send('Long query');
	await screen.findByRole('button', { name: 'Annuler la réponse' });
	fireEvent.click(screen.getByRole('button', { name: 'Annuler la réponse' }));
	await act(async () => old.resolve(reply('Late response')));
	expect(screen.queryByText('Late response')).not.toBeInTheDocument();
	expect(screen.getByRole('textbox', { name: 'Votre message' })).toBeEnabled();
});
it('uses English controls automatically with the native interface language', async () => {
	mockLanguage = 'en';
	render(themed(<ChatAIAssistant />));
	fireEvent.click(await screen.findByRole('button', { name: 'Ask AI Assistant' }));
	expect(await screen.findByRole('textbox', { name: 'Your message' })).toBeVisible();
	expect(screen.getByRole('button', { name: 'New conversation' })).toBeVisible();
	expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
});
it('renders untrusted record descriptions as plain text', () => {
	const { container } = render(
		themed(
			<ChatAIResults
				cards={[{ type: 'record_list', resource: 'project', items: [{ id: 4, name: '<img src=x onerror=alert(1)>' }] }]}
				navigate={jest.fn()}
			/>,
		),
	);
	expect(container.querySelector('img')).toBeNull();
	expect(container.textContent).toContain('<img src=x onerror=alert(1)>');
});
it('read-only cards do not offer edits, deletion, or printing', () => {
	render(
		themed(
			<ChatAIResults
				cards={[{ type: 'record_list', resource: 'project', items: [{ id: 4, name: 'Demo Project' }] }]}
				navigate={jest.fn()}
				select={jest.fn()}
				pdf={jest.fn()}
				permissions={{ can_update: false, can_delete: false, can_print: false }}
			/>,
		),
	);
	expect(screen.queryByRole('button', { name: 'Modifier' })).not.toBeInTheDocument();
	expect(screen.queryByRole('button', { name: 'Supprimer' })).not.toBeInTheDocument();
	expect(screen.queryByRole('button', { name: 'PDF' })).not.toBeInTheDocument();
});
const proposal: ChatCard = {
	type: 'confirmation',
	resource: 'project',
	operation: 'delete',
	action_id: 'test-action',
	company_id: 1,
	record_id: 4,
	label: 'Demo Project',
	warning: 'Suppression définitive',
	changes: {},
};
it('requires a separate native confirmation dialog before deleting', async () => {
	const confirm = jest.fn().mockResolvedValue(undefined);
	render(themed(<ChatAIResults cards={[proposal]} navigate={jest.fn()} confirm={confirm} />));
	expect(confirm).not.toHaveBeenCalled();
	fireEvent.click(screen.getByRole('button', { name: 'Vérifier cette action' }));
	expect(confirm).not.toHaveBeenCalled();
	expect(screen.getByRole('dialog')).toHaveTextContent('Demo Project');
	fireEvent.click(screen.getByRole('button', { name: 'Confirmer cette action' }));
	await waitFor(() => expect(confirm).toHaveBeenCalledWith(proposal));
});
it('allows only supported human-labelled change fields', () => {
	expect(validConfirmation({ ...proposal, operation: 'update', changes: { nom: 'Changed' } })).toBe(true);
	expect(validConfirmation({ ...proposal, operation: 'update', changes: { is_staff: 'true' } })).toBe(false);
	expect(validConfirmation({ ...proposal, company_id: 2 })).toBe(false);
	render(
		themed(
			<ChatAIResults
				cards={[
					{ ...proposal, operation: 'update', changes: { budget_total: '500' }, before: { budget_total: '100' } },
				]}
				navigate={jest.fn()}
			/>,
		),
	);
	expect(screen.getByText(/Budget total/)).toBeVisible();
	expect(screen.queryByText(/budget_total/)).not.toBeInTheDocument();
});
it('successful confirmation refreshes native project and real budget caches', async () => {
	handlers['conversations/conversation-1/messages/'] = () => response(reply('Review project', [proposal]));
	handlers['actions/test-action/confirm/'] = () => response({ success: true });
	await open();
	send('Delete Demo Project');
	await screen.findByText('Review project');
	fireEvent.click(screen.getByRole('button', { name: 'Vérifier cette action' }));
	fireEvent.click(screen.getByRole('button', { name: 'Confirmer cette action' }));
	await waitFor(() =>
		expect(mockDispatch).toHaveBeenCalledWith(
			expect.objectContaining({ payload: expect.arrayContaining(['Project', 'RealBudget', 'MultiProjectDashboard']) }),
		),
	);
	expect(mockPush).toHaveBeenCalledWith('/dashboard/projects');
});

it('hides the previous user context while resolving the next authenticated user capabilities', async () => {
	handlers['conversations/conversation-1/messages/'] = () => response(reply('Private writer response'));
	const { rerender } = await open();
	send('Search');
	await screen.findByText('Private writer response');
	const next = deferred<unknown>();
	handlers['capabilities/?language=fr'] = () => ({ json: () => next.promise }) as Response;
	mockProfile = { id: 2, can_view: true, is_staff: false };
	mockToken = 'next-user-token';
	rerender(themed(<ChatAIAssistant />));
	expect(screen.queryByText('Private writer response')).not.toBeInTheDocument();
	expect(screen.queryByRole('button', { name: 'Ask AI Assistant' })).not.toBeInTheDocument();
	await act(async () =>
		next.resolve({
			...capabilities,
			companies: capabilities.companies.map((company) => ({
				...company,
				can_update: false,
				can_delete: false,
				can_print: false,
			})),
		}),
	);
	expect(await screen.findByRole('button', { name: 'Ask AI Assistant' })).toBeVisible();
	expect(screen.queryByText('Private writer response')).not.toBeInTheDocument();
	expect(await screen.findByRole('textbox', { name: 'Votre message' })).toHaveValue('');
});
it('yields to a native overlay then restores the existing draft', async () => {
	await open();
	const input = screen.getByRole('textbox', { name: 'Votre message' });
	fireEvent.change(input, { target: { value: 'Keep this draft' } });
	const modal = document.createElement('div');
	modal.className = 'MuiModal-root';
	try {
		await act(async () => {
			document.body.appendChild(modal);
		});
		await waitFor(() => expect(screen.queryByRole('dialog', { name: 'AI Assistant' })).not.toBeInTheDocument());
		expect(screen.queryByRole('button', { name: 'Ask AI Assistant' })).not.toBeInTheDocument();
		await act(async () => {
			modal.remove();
		});
		expect(await screen.findByRole('textbox', { name: 'Votre message' })).toHaveValue('Keep this draft');
	} finally {
		await act(async () => {
			modal.remove();
		});
	}
});

it('uses English error feedback when the native interface is English', async () => {
	mockLanguage = 'en';
	handlers['conversations/conversation-1/messages/'] = () => {
		throw new ChatAPIError('PERMISSION_DENIED');
	};
	render(themed(<ChatAIAssistant />));
	fireEvent.click(await screen.findByRole('button', { name: 'Ask AI Assistant' }));
	fireEvent.change(await screen.findByRole('textbox', { name: 'Your message' }), {
		target: { value: 'Find a project' },
	});
	fireEvent.click(screen.getByRole('button', { name: 'Send' }));
	expect(await screen.findByText('You do not have permission to access this information.')).toBeVisible();
});
