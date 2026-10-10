import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ChatAIComposer } from './ChatAIComposer';

const commands = [
	{ command: '/voir', title: 'Rechercher', help: 'Décrivez votre recherche.', example: '/voir client Demo' },
	{ command: '/pdf', title: 'PDF', help: 'Choisissez un document autorisé.', example: '/pdf dernier document' },
];
const send = jest.fn(),
	cancel = jest.fn();
const Harness = ({
	language = 'fr',
	busy = false,
	historyOpen = false,
}: {
	language?: 'fr' | 'en';
	busy?: boolean;
	historyOpen?: boolean;
}) => {
	const [draft, setDraft] = useState('');
	return (
		<ChatAIComposer
			draft={draft}
			setDraft={setDraft}
			language={language}
			busy={busy}
			historyOpen={historyOpen}
			shortcuts={commands}
			send={() => send(draft)}
			cancel={cancel}
		/>
	);
};
beforeEach(() => jest.clearAllMocks());
it('opens permitted slash choices and selects with arrows and Enter without sending', () => {
	render(<Harness />);
	fireEvent.click(screen.getByRole('button', { name: '/ Raccourcis' }));
	const input = screen.getByRole('textbox');
	expect(input).toHaveFocus();
	expect(input).toHaveValue('/');
	expect(screen.getAllByRole('option')).toHaveLength(2);
	expect(screen.queryByText('/supprimer')).not.toBeInTheDocument();
	expect(input).toHaveAttribute('aria-controls', screen.getByRole('listbox').id);
	fireEvent.keyDown(input, { key: 'ArrowUp' });
	expect(screen.getByRole('option', { name: /PDF/ })).toHaveAttribute('aria-selected', 'true');
	expect(input).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: /PDF/ }).id);
	fireEvent.keyDown(input, { key: 'ArrowDown' });
	fireEvent.keyDown(input, { key: 'Enter' });
	expect(input).toHaveValue('/voir ');
	expect(input).toHaveFocus();
	expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
	expect(send).not.toHaveBeenCalled();
	fireEvent.keyDown(input, { key: 'Enter' });
	expect(send).toHaveBeenCalledWith('/voir ');
});
it('resets the selection on filtering and supports Tab completion', () => {
	render(<Harness />);
	const input = screen.getByRole('textbox');
	fireEvent.change(input, { target: { value: '/' } });
	fireEvent.keyDown(input, { key: 'ArrowDown' });
	fireEvent.change(input, { target: { value: '/V' } });
	expect(screen.getAllByRole('option')).toHaveLength(1);
	fireEvent.keyDown(input, { key: 'Tab' });
	expect(input).toHaveValue('/voir ');
	expect(send).not.toHaveBeenCalled();
});
it('Escape dismisses only the picker first and never discards the draft', () => {
	const outerEscape = jest.fn();
	render(
		<div onKeyDown={outerEscape}>
			<Harness />
		</div>,
	);
	const input = screen.getByRole('textbox');
	fireEvent.change(input, { target: { value: '/voir' } });
	fireEvent.keyDown(input, { key: 'Escape' });
	expect(outerEscape).not.toHaveBeenCalled();
	expect(input).toHaveValue('/voir');
	expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
	fireEvent.keyDown(input, { key: 'Escape' });
	expect(outerEscape).toHaveBeenCalledTimes(1);
});
it('explains an unknown command without inventing options', () => {
	render(<Harness language="en" />);
	fireEvent.change(screen.getByRole('textbox', { name: 'Your message' }), { target: { value: '/unknown' } });
	expect(screen.queryByRole('option')).not.toBeInTheDocument();
	expect(screen.getByRole('status')).toHaveTextContent('No matching shortcut');
	expect(screen.getByRole('button', { name: '/ Shortcuts' })).toBeVisible();
});
it('preserves IME and Shift+Enter input and allows explicit sending of a bare command', () => {
	render(<Harness />);
	const input = screen.getByRole('textbox');
	fireEvent.change(input, { target: { value: '/voir' } });
	fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
	fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
	expect(send).not.toHaveBeenCalled();
	expect(input).toHaveValue('/voir');
	fireEvent.click(screen.getByRole('button', { name: 'Envoyer' }));
	expect(send).toHaveBeenCalledWith('/voir');
});
it('hides composer during history and offers cancellation while busy', () => {
	const { rerender } = render(<Harness historyOpen />);
	expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
	rerender(<Harness busy />);
	expect(screen.getByRole('textbox')).toBeDisabled();
	expect(screen.getByRole('button', { name: '/ Raccourcis' })).toBeDisabled();
	fireEvent.click(screen.getByRole('button', { name: 'Annuler la réponse' }));
	expect(cancel).toHaveBeenCalledTimes(1);
});

it('opens shortcut help without erasing an unsent question, then prefixes the chosen command', () => {
	render(<Harness />);
	const input = screen.getByRole('textbox');
	fireEvent.change(input, { target: { value: 'client Demo' } });
	fireEvent.click(screen.getByRole('button', { name: '/ Raccourcis' }));
	expect(input).toHaveValue('client Demo');
	expect(screen.getAllByRole('option')).toHaveLength(2);
	fireEvent.keyDown(input, { key: 'Escape' });
	expect(input).toHaveValue('client Demo');
	fireEvent.click(screen.getByRole('button', { name: '/ Raccourcis' }));
	fireEvent.click(screen.getByRole('option', { name: /Rechercher/ }));
	expect(input).toHaveValue('/voir client Demo');
	expect(send).not.toHaveBeenCalled();
});

it('keeps the description when switching an existing slash command', () => {
	render(<Harness />);
	const input = screen.getByRole('textbox');
	fireEvent.change(input, { target: { value: '/voir client Demo' } });
	fireEvent.click(screen.getByRole('button', { name: '/ Raccourcis' }));
	fireEvent.click(screen.getByRole('option', { name: /PDF/ }));
	expect(input).toHaveValue('/pdf client Demo');
	expect(send).not.toHaveBeenCalled();
});

it('enables Send for bare slash and closes the picker on explicit send', () => {
	render(<Harness />);
	fireEvent.click(screen.getByRole('button', { name: '/ Raccourcis' }));
	const button = screen.getByRole('button', { name: 'Envoyer' });
	expect(button).toBeEnabled();
	fireEvent.click(button);
	expect(send).toHaveBeenCalledWith('/');
	expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
});
