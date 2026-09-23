import { type ChangeEvent, type ReactNode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { format } from 'date-fns';
import ReportsClient from './reports';
import { downloadFileBlob } from '@/utils/fileDownload';

const mockProjects = [
	{ id: 7, nom: 'Projet Sept', date_debut: '2026-05-01' },
	{ id: 8, nom: 'Projet Huit', date_debut: '2026-01-01' },
];

jest.mock('@mui/x-date-pickers/DatePicker', () => ({
	DatePicker: ({
		label,
		value,
		onChange,
	}: {
		label: string;
		value: Date | null;
		onChange: (value: Date | null) => void;
	}) => (
		<input
			aria-label={label}
			type="date"
			value={value ? format(value, 'yyyy-MM-dd') : ''}
			onChange={(event) => onChange(event.target.value ? new Date(`${event.target.value}T00:00:00`) : null)}
		/>
	),
}));
jest.mock('@mui/x-date-pickers/LocalizationProvider', () => ({
	LocalizationProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
jest.mock('@/components/layouts/navigationBar/navigationBar', () => ({
	__esModule: true,
	default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
jest.mock('@/components/layouts/protected/protected', () => ({
	Protected: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
jest.mock('@/components/shared/pdfLanguageModal/pdfLanguageModal', () => ({
	__esModule: true,
	default: ({ onSelectLanguage }: { onSelectLanguage: (language: 'fr' | 'en') => void }) => (
		<>
			<button onClick={() => onSelectLanguage('fr')}>Français</button>
			<button onClick={() => onSelectLanguage('en')}>Anglais</button>
		</>
	),
}));
jest.mock('@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect', () => ({
	__esModule: true,
	default: ({
		label,
		items,
		value,
		onChange,
	}: {
		label: string;
		items: { code: string; value: string }[];
		value: { code: string; value: string };
		onChange: (event: ChangeEvent<HTMLSelectElement>, value: { code: string; value: string } | null) => void;
	}) => (
		<select
			aria-label={label}
			value={value.code}
			onChange={(event) => onChange(event, items.find((item) => item.code === event.target.value) ?? null)}
		>
			{items.map((item) => (
				<option key={item.code} value={item.code}>
					{item.value}
				</option>
			))}
		</select>
	),
}));
jest.mock('@/contexts/InitContext', () => ({ useInitAccessToken: () => 'token' }));
jest.mock('@/store/services/project', () => ({
	useGetProjectsListQuery: () => ({ data: mockProjects, isLoading: false }),
}));
jest.mock('@/utils/fileDownload', () => ({
	...jest.requireActual('@/utils/fileDownload'),
	downloadFileBlob: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/utils/routes', () => ({
	REPORTS_DOWNLOAD: (language: string, filters: { dateFrom: string; dateTo: string; projectId?: number }) =>
		`/api/reports/pdf?language=${language}&from=${filters.dateFrom}&to=${filters.dateTo}&project=${filters.projectId ?? ''}`,
}));
jest.mock('@/utils/hooks', () => ({
	useToast: () => ({ onError: jest.fn() }),
	useLanguage: () => ({
		t: {
			projects: { noProjectFound: 'Aucun projet trouvé' },
			aiAssistant: { translateToFrench: 'Français', translateToEnglish: 'Anglais' },
			reports: {
				title: 'Rapports',
				description: 'Description',
				configuration: 'Configuration du rapport',
				periodHelp: 'Aide',
				startDate: 'Date de début',
				endDate: 'Date de fin',
				scope: 'Périmètre',
				allProjects: 'Tous les projets',
				generate: 'Générer le PDF',
				invalidPeriod: 'Période invalide',
				generationError: 'Erreur',
				preparingReport: 'Préparation du rapport',
				translatingAndGenerating: 'Étape 1 sur 2 · Traduction et génération',
				downloadingFile: 'Étape 2 sur 2 · Téléchargement',
				generationProgress: 'Progression',
				progressHelp: 'Les valeurs protégées restent inchangées.',
			},
		},
	}),
}));

describe('ReportsClient', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(downloadFileBlob as jest.Mock).mockResolvedValue(undefined);
	});

	it('validates dates and uses the Facturation language step before downloading', async () => {
		render(<ReportsClient />);
		fireEvent.change(screen.getByLabelText('Date de début'), { target: { value: '2026-03-01' } });
		fireEvent.change(screen.getByLabelText('Date de fin'), { target: { value: '2026-03-31' } });
		fireEvent.click(screen.getByRole('button', { name: 'Générer le PDF' }));
		await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Français' })));

		await waitFor(() =>
			expect(downloadFileBlob).toHaveBeenCalledWith(
				'/api/reports/pdf?language=fr&from=2026-03-01&to=2026-03-31&project=',
				expect.objectContaining({ onResponseReady: expect.any(Function) }),
			),
		);
	});

	it('shows translation, PDF generation, and download progress explicitly', async () => {
		let resolveDownload: () => void = () => undefined;
		let notifyResponseReady: () => void = () => undefined;
		(downloadFileBlob as jest.Mock).mockImplementation(
			(_url: string, options: { onResponseReady: () => void }) =>
				new Promise<void>((resolve) => {
					resolveDownload = resolve;
					notifyResponseReady = options.onResponseReady;
				}),
		);
		render(<ReportsClient />);

		fireEvent.click(screen.getByRole('button', { name: 'Générer le PDF' }));
		fireEvent.click(screen.getByRole('button', { name: 'Anglais' }));

		expect(await screen.findByText('Préparation du rapport: Anglais')).toBeInTheDocument();
		expect(screen.getByText('Étape 1 sur 2 · Traduction et génération')).toBeInTheDocument();
		expect(screen.getByRole('progressbar', { name: 'Progression' })).toBeInTheDocument();

		act(() => notifyResponseReady());
		expect(await screen.findByText('Étape 2 sur 2 · Téléchargement')).toBeInTheDocument();

		await act(async () => resolveDownload());
		await waitFor(() => expect(screen.queryByRole('progressbar', { name: 'Progression' })).not.toBeInTheDocument());
	});

	it('keeps a generation failure visible on the report page', async () => {
		(downloadFileBlob as jest.Mock).mockRejectedValueOnce({ data: { message: 'Model unavailable' } });
		render(<ReportsClient />);

		fireEvent.click(screen.getByRole('button', { name: 'Générer le PDF' }));
		fireEvent.click(screen.getByRole('button', { name: 'Anglais' }));

		expect(await screen.findByText('Model unavailable')).toBeInTheDocument();
	});

	it('blocks generation when the start date is after the end date', () => {
		render(<ReportsClient />);
		fireEvent.change(screen.getByLabelText('Date de début'), { target: { value: '2026-04-02' } });
		fireEvent.change(screen.getByLabelText('Date de fin'), { target: { value: '2026-04-01' } });

		expect(screen.getByText('Période invalide')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Générer le PDF' })).toBeDisabled();
	});

	it('defaults all projects to the earliest project start date and keeps it editable', async () => {
		render(<ReportsClient />);

		await waitFor(() => expect(screen.getByLabelText('Date de début')).toHaveValue('2026-01-01'));
		fireEvent.change(screen.getByLabelText('Date de début'), { target: { value: '2026-02-15' } });

		expect(screen.getByLabelText('Date de début')).toHaveValue('2026-02-15');
	});

	it('defaults a selected project to its own start date and keeps it editable', async () => {
		render(<ReportsClient />);

		fireEvent.change(screen.getByLabelText('Périmètre'), { target: { value: '7' } });
		await waitFor(() => expect(screen.getByLabelText('Date de début')).toHaveValue('2026-05-01'));
		fireEvent.change(screen.getByLabelText('Date de début'), { target: { value: '2026-05-15' } });

		expect(screen.getByLabelText('Date de début')).toHaveValue('2026-05-15');
	});

	it('restores the earliest project date when switching back to all projects', async () => {
		render(<ReportsClient />);

		fireEvent.change(screen.getByLabelText('Périmètre'), { target: { value: '7' } });
		await waitFor(() => expect(screen.getByLabelText('Date de début')).toHaveValue('2026-05-01'));
		fireEvent.change(screen.getByLabelText('Périmètre'), { target: { value: '' } });

		await waitFor(() => expect(screen.getByLabelText('Date de début')).toHaveValue('2026-01-01'));
	});
});
