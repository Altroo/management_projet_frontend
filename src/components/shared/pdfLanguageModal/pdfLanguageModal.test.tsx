import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import PdfLanguageModal from './pdfLanguageModal';

jest.mock('@/components/htmlElements/modals/actionModal/actionModals', () => ({
	__esModule: true,
	default: ({ title, body, actions }: { title: string; body: string; actions: Array<{ text: string; active: boolean; onClick: () => void }> }) => (
		<div>
			<h1>{title}</h1>
			<p>{body}</p>
			{actions.map((action) => (
				<button key={action.text} aria-pressed={action.active} onClick={action.onClick}>{action.text}</button>
			))}
		</div>
	),
}));

jest.mock('@/components/shared/languageSwitcher/languageSwitcher', () => ({
	LanguageFlag: () => <span data-testid="language-flag" />,
}));

jest.mock('@/utils/hooks', () => ({
	useLanguage: () => ({
		t: {
			common: { cancel: 'Annuler' },
			pdf: {
				generatePdf: 'Génération du PDF',
				chooseLanguage: 'Choisissez la langue dans laquelle vous souhaitez générer le document PDF.',
				french: 'Français',
				english: 'English',
			},
		},
	}),
}));

describe('PdfLanguageModal', () => {
	it('matches the Facturation language choice and callbacks', () => {
		const onClose = jest.fn();
		const onSelectLanguage = jest.fn();
		render(<PdfLanguageModal onClose={onClose} onSelectLanguage={onSelectLanguage} />);

		expect(screen.getByText('Génération du PDF')).toBeInTheDocument();
		expect(screen.getByText('Choisissez la langue dans laquelle vous souhaitez générer le document PDF.')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
		fireEvent.click(screen.getByRole('button', { name: 'Français' }));
		fireEvent.click(screen.getByRole('button', { name: 'English' }));

		expect(onClose).toHaveBeenCalledTimes(1);
		expect(onSelectLanguage).toHaveBeenNthCalledWith(1, 'fr');
		expect(onSelectLanguage).toHaveBeenNthCalledWith(2, 'en');
		expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true');
	});
});
