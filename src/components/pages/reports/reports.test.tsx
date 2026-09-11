import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ReportsClient from './reports';
import { fetchFileBlob } from '@/utils/apiHelpers';

jest.mock('@mui/x-date-pickers/DatePicker', () => ({
	DatePicker: ({ label, value, onChange }: { label: string; value: Date | null; onChange: (value: Date | null) => void }) => (
		<input
			aria-label={label}
			type="date"
			value={value ? value.toISOString().slice(0, 10) : ''}
			onChange={(event) => onChange(event.target.value ? new Date(`${event.target.value}T00:00:00`) : null)}
		/>
	),
}));
jest.mock('@mui/x-date-pickers/LocalizationProvider', () => ({
	LocalizationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock('@/components/layouts/navigationBar/navigationBar', () => ({
	__esModule: true,
	default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock('@/components/layouts/protected/protected', () => ({
	Protected: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock('@/components/shared/pdfLanguageModal/pdfLanguageModal', () => ({
	__esModule: true,
	default: ({ onSelectLanguage }: { onSelectLanguage: (language: 'fr') => void }) => (
		<button onClick={() => onSelectLanguage('fr')}>Français</button>
	),
}));
jest.mock('@/contexts/InitContext', () => ({ useInitAccessToken: () => 'token' }));
jest.mock('@/store/services/project', () => ({
	useGetProjectsListQuery: () => ({ data: [{ id: 7, nom: 'Projet Sept' }], isLoading: false }),
}));
jest.mock('@/utils/apiHelpers', () => ({ fetchFileBlob: jest.fn() }));
jest.mock('@/utils/routes', () => ({
	REPORTS_PDF: (language: string, filters: { dateFrom: string; dateTo: string; projectId?: number }) =>
		`/pdf/${language}?from=${filters.dateFrom}&to=${filters.dateTo}&project=${filters.projectId ?? ''}`,
}));
jest.mock('@/utils/hooks', () => ({
	useToast: () => ({ onError: jest.fn() }),
	useLanguage: () => ({
		t: {
			projects: { noProjectFound: 'Aucun projet trouvé' },
			reports: {
				title: 'Rapports', description: 'Description', configuration: 'Configuration du rapport', periodHelp: 'Aide', startDate: 'Date de début',
				endDate: 'Date de fin', scope: 'Périmètre', allProjects: 'Tous les projets', generate: 'Générer le PDF',
				invalidPeriod: 'Période invalide', generationError: 'Erreur',
			},
		},
	}),
}));

describe('ReportsClient', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(fetchFileBlob as jest.Mock).mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' }));
		Object.defineProperty(window.URL, 'createObjectURL', { configurable: true, value: jest.fn(() => 'blob:report') });
		Object.defineProperty(window.URL, 'revokeObjectURL', { configurable: true, value: jest.fn() });
		window.open = jest.fn();
	});

	it('validates dates and uses the Facturation language step before downloading', async () => {
		render(<ReportsClient />);
		fireEvent.change(screen.getByLabelText('Date de début'), { target: { value: '2026-03-01' } });
		fireEvent.change(screen.getByLabelText('Date de fin'), { target: { value: '2026-03-31' } });
		fireEvent.click(screen.getByRole('button', { name: 'Générer le PDF' }));
		await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Français' })));

		await waitFor(() => expect(fetchFileBlob).toHaveBeenCalledWith('/pdf/fr?from=2026-03-01&to=2026-03-31&project=', 'token'));
		expect(window.open).toHaveBeenCalledWith('blob:report', '_blank');
	});

	it('blocks generation when the start date is after the end date', () => {
		render(<ReportsClient />);
		fireEvent.change(screen.getByLabelText('Date de début'), { target: { value: '2026-04-02' } });
		fireEvent.change(screen.getByLabelText('Date de fin'), { target: { value: '2026-04-01' } });

		expect(screen.getByText('Période invalide')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Générer le PDF' })).toBeDisabled();
	});
});
