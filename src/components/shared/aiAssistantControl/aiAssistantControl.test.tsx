import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AiAssistantControl from './aiAssistantControl';

const assistText = jest.fn();
let mockMutationState = { isLoading: false };

jest.mock('@/store/services/project', () => ({
	useAssistTextMutation: () => [assistText, mockMutationState],
}));

jest.mock('@/utils/hooks', () => ({
	useLanguage: () => ({
		t: {
			aiAssistant: {
				translate: 'Translate',
				fixGrammar: 'Fix grammar',
				professionalize: 'Make professional',
				translateToFrench: 'Translate to French',
				translateToEnglish: 'Translate to English',
				previewTitle: 'AI assistant suggestion',
				original: 'Original text',
				suggestion: 'Suggestion',
				useSuggestion: 'Use suggestion',
				tryAgain: 'Try again',
				cancel: 'Cancel',
				emptyText: 'Enter text first.',
				requestError: 'Request failed.',
			},
		},
	}),
}));

const response = {
	original_text: 'texte source',
	suggested_text: 'source text',
	detected_language: 'fr' as const,
	model: 'qwen3.8-27b-q5_k_m',
	cached: false,
	processing_ms: 120,
};

describe('AiAssistantControl', () => {
	const originalFlag = process.env.NEXT_PUBLIC_AI_ASSISTANT_ENABLED;

	beforeEach(() => {
		jest.clearAllMocks();
		mockMutationState = { isLoading: false };
		process.env.NEXT_PUBLIC_AI_ASSISTANT_ENABLED = 'true';
	});

	afterAll(() => {
		if (originalFlag === undefined) {
			delete process.env.NEXT_PUBLIC_AI_ASSISTANT_ENABLED;
		} else {
			process.env.NEXT_PUBLIC_AI_ASSISTANT_ENABLED = originalFlag;
		}
	});

	it('stays hidden while the rollout flag is disabled', () => {
		process.env.NEXT_PUBLIC_AI_ASSISTANT_ENABLED = 'false';
		render(<AiAssistantControl value="texte" context="project" onApply={jest.fn()} />);
		expect(screen.queryByRole('button')).not.toBeInTheDocument();
	});

	it('offers French/English translation and applies only after confirmation', async () => {
		const onApply = jest.fn();
		assistText.mockReturnValue({ unwrap: () => Promise.resolve(response) });
		render(<AiAssistantControl value="texte source" context="project" onApply={onApply} />);

		fireEvent.click(screen.getByRole('button', { name: 'Translate' }));
		expect(await screen.findByRole('menuitem', { name: 'Translate to French' })).toBeInTheDocument();
		fireEvent.click(await screen.findByRole('menuitem', { name: 'Translate to English' }));

		await screen.findByText('source text');
		expect(onApply).not.toHaveBeenCalled();
		expect(assistText).toHaveBeenCalledWith({
			action: 'translate',
			text: 'texte source',
			source_language: 'auto',
			target_language: 'en',
			context: 'project',
		});

		fireEvent.click(screen.getByRole('button', { name: 'Use suggestion' }));
		expect(onApply).toHaveBeenCalledWith('source text');
	});

	it.each([
		['Fix grammar', 'fix_grammar'],
		['Make professional', 'professionalize'],
	])('runs %s without changing the source language', async (label, action) => {
		assistText.mockReturnValue({ unwrap: () => Promise.resolve(response) });
		render(<AiAssistantControl value="texte source" context="expense" onApply={jest.fn()} />);

		fireEvent.click(screen.getByRole('button', { name: label }));
		await screen.findByText('source text');
		expect(assistText).toHaveBeenCalledWith({
			action,
			text: 'texte source',
			source_language: 'auto',
			target_language: undefined,
			context: 'expense',
		});
	});

	it('preserves the source and supports retry after a failed request', async () => {
		assistText
			.mockReturnValueOnce({ unwrap: () => Promise.reject({ data: { message: 'Model unavailable' } }) })
			.mockReturnValueOnce({ unwrap: () => Promise.resolve(response) });
		render(<AiAssistantControl value="texte source" context="supplier" onApply={jest.fn()} />);

		fireEvent.click(screen.getByRole('button', { name: 'Fix grammar' }));
		await screen.findByText('Model unavailable');
		fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

		await waitFor(() => expect(screen.getByText('source text')).toBeInTheDocument());
		expect(assistText).toHaveBeenCalledTimes(2);
	});

	it('cancels a preview without applying or saving the suggestion', async () => {
		const onApply = jest.fn();
		assistText.mockReturnValue({ unwrap: () => Promise.resolve(response) });
		render(<AiAssistantControl value="texte source" context="project" onApply={onApply} />);

		fireEvent.click(screen.getByRole('button', { name: 'Fix grammar' }));
		await screen.findByText('source text');
		fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

		expect(onApply).not.toHaveBeenCalled();
		expect(screen.queryByText('source text')).not.toBeInTheDocument();
	});

	it('disables actions and shows progress while a request is running', () => {
		mockMutationState = { isLoading: true };
		render(<AiAssistantControl value="texte source" context="project" onApply={jest.fn()} />);

		expect(screen.getByRole('button', { name: 'Translate' })).toBeDisabled();
		expect(screen.getByRole('button', { name: 'Fix grammar' })).toBeDisabled();
		expect(screen.getByRole('progressbar')).toBeInTheDocument();
	});
});
