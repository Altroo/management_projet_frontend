import React from 'react';
import { render, screen, cleanup, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
	useRouter: () => ({
		push: mockPush,
		back: jest.fn(),
		forward: jest.fn(),
		refresh: jest.fn(),
		replace: jest.fn(),
		prefetch: jest.fn(),
	}),
}));

// Mock toast hook
const mockOnSuccess = jest.fn();
const mockOnError = jest.fn();
jest.mock('@/utils/hooks', () => {
	const { translations } = jest.requireActual('@/translations');
	return {
		useToast: () => ({ onSuccess: mockOnSuccess, onError: mockOnError }),
		useLanguage: () => ({ t: translations.fr }),
	};
});

// Mock InitContext
jest.mock('@/contexts/InitContext', () => ({
	useInitAccessToken: jest.fn(() => 'mock-token'),
}));

// Mock RTK Query hooks
const mockRefetch = jest.fn();
const mockDeleteProject = jest.fn(() => ({ unwrap: () => Promise.resolve() }));

const mockUseGetProjectsListQuery = jest.fn(() => ({
	data: {
		results: [
			{
				id: 1,
				nom: 'Projet Alpha',
				status: 'En cours',
				budget_total: '50000',
				date_debut: '2025-01-01',
				date_fin: '2025-12-31',
				chef_de_projet: 'Jean Dupont',
				created_by_user_name: 'Admin',
			},
			{
				id: 2,
				nom: 'Projet Beta',
				status: 'Complété',
				budget_total: '100000',
				date_debut: '2024-06-01',
				date_fin: '2025-06-30',
				chef_de_projet: 'Marie Martin',
				created_by_user_name: 'Admin',
			},
		],
		count: 2,
		next: null,
		previous: null,
	},
	isLoading: false,
	refetch: mockRefetch,
}));

jest.mock('@/store/services/project', () => ({
	useGetProjectsListQuery: () => mockUseGetProjectsListQuery(),
	useDeleteProjectMutation: jest.fn(() => [mockDeleteProject, { isLoading: false }]),
	useBulkDeleteProjectsMutation: jest.fn(() => [jest.fn(), { isLoading: false }]),
}));

// Mock Protected
jest.mock('@/components/layouts/protected/protected', () => ({
	Protected: ({ children }: { children: React.ReactNode }) => <div data-testid="protected">{children}</div>,
}));

// Mock NavigationBar
jest.mock('@/components/layouts/navigationBar/navigationBar', () => {
	const Mock = ({ children }: { children: React.ReactNode }) => <div data-testid="navigation-bar">{children}</div>;
	Mock.displayName = 'NavigationBar';
	return { __esModule: true, default: Mock };
});

// Enhanced PaginatedDataGrid mock
jest.mock('@/components/shared/paginatedDataGrid/paginatedDataGrid', () => ({
	__esModule: true,
	default: ({
		columns,
		data,
	}: {
		columns: Array<{
			field: string;
			headerName: string;
			renderCell?: (params: { value: unknown; row: Record<string, unknown>; field: string }) => React.ReactNode;
		}>;
		data?: { results?: Array<Record<string, unknown>> };
		isLoading?: boolean;
		onCustomFilterParamsChange?: (params: Record<string, string>) => void;
	}) => {
		const results = data?.results || [];
		return (
			<div data-testid="paginated-data-grid">
				<table>
					<thead>
						<tr>
							{columns.map((col) => (
								<th key={col.field}>{col.headerName}</th>
							))}
						</tr>
					</thead>
					<tbody>
						{results.map((row) => (
							<tr key={row.id as number} data-testid={`row-${row.id}`}>
								{columns.map((col) => (
									<td key={col.field}>
										{col.renderCell
											? col.renderCell({ value: row[col.field], row, field: col.field })
											: String(row[col.field] ?? '')}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		);
	},
}));

// Mock ActionModals
jest.mock('@/components/htmlElements/modals/actionModal/actionModals', () => ({
	__esModule: true,
	default: ({
		title,
		body,
		actions,
	}: {
		title: string;
		body: string;
		actions: Array<{ text: string; onClick: () => void }>;
	}) => (
		<div data-testid="action-modal" role="dialog">
			<h2>{title}</h2>
			<p>{body}</p>
			<div>
				{actions.map((action) => (
					<button key={action.text} onClick={action.onClick}>
						{action.text}
					</button>
				))}
			</div>
		</div>
	),
}));

// Mock MobileActionsMenu
jest.mock('@/components/shared/mobileActionsMenu/mobileActionsMenu', () => ({
	__esModule: true,
	default: ({ actions }: { actions: Array<{ label: string; onClick: () => void }> }) => (
		<div data-testid="mobile-actions-menu">
			{actions.map((a) => (
				<button key={a.label} onClick={a.onClick}>
					{a.label}
				</button>
			))}
		</div>
	),
}));

jest.mock('@/components/htmlElements/tooltip/darkTooltip/darkTooltip', () => ({
	__esModule: true,
	default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/shared/chipSelectFilter/chipSelectFilterBar', () => ({
	__esModule: true,
	default: () => <div data-testid="chip-filter-bar" />,
}));

jest.mock('@/components/shared/dropdownFilter/dropdownFilter', () => ({
	createDropdownFilterOperators: jest.fn(() => []),
}));

jest.mock('@/components/shared/dateRangeFilter/dateRangeFilterOperator', () => ({
	createDateRangeFilterOperator: jest.fn(() => []),
}));

jest.mock('@/components/shared/numericFilter/numericFilterOperator', () => ({
	createNumericFilterOperators: jest.fn(() => []),
}));

jest.mock('@/utils/helpers', () => ({
	formatDate: (date: string | null) => (date ? new Date(date).toLocaleDateString('fr-FR') : '—'),
	extractApiErrorMessage: (error: unknown, fallback: string) => fallback,
}));

jest.mock('@/utils/rawData', () => ({
	projectStatusItemsList: jest.fn(() => [
		{ code: 'en_cours', value: 'En cours' },
		{ code: 'complete', value: 'Complété' },
	]),
	STATUS_CHIP_COLORS: {} as Record<string, string>,
}));

import ProjectsListClient from './projects-list';

describe('ProjectsListClient', () => {
	beforeEach(() => jest.clearAllMocks());
	afterEach(() => cleanup());

	describe('Rendering', () => {
		it('renders protected wrapper', () => {
			render(<ProjectsListClient />);
			expect(screen.getByTestId('protected')).toBeInTheDocument();
		});

		it('renders paginated data grid', () => {
			render(<ProjectsListClient />);
			expect(screen.getByTestId('paginated-data-grid')).toBeInTheDocument();
		});

		it('renders Nouveau projet button', () => {
			render(<ProjectsListClient />);
			expect(screen.getByText('Nouveau projet')).toBeInTheDocument();
		});

		it('renders data rows', () => {
			render(<ProjectsListClient />);
			expect(screen.getByTestId('row-1')).toBeInTheDocument();
			expect(screen.getByTestId('row-2')).toBeInTheDocument();
		});
	});

	describe('Column renderCell', () => {
		it('renders project names', () => {
			render(<ProjectsListClient />);
			expect(screen.getByText('Projet Alpha')).toBeInTheDocument();
			expect(screen.getByText('Projet Beta')).toBeInTheDocument();
		});

		it('renders status chips', () => {
			render(<ProjectsListClient />);
			expect(screen.getByText('En cours')).toBeInTheDocument();
			expect(screen.getByText('Complété')).toBeInTheDocument();
		});

		it('renders budget values', () => {
			render(<ProjectsListClient />);
			expect(screen.getByText(/50.*000.*MAD/)).toBeInTheDocument();
		});

		it('renders action buttons for each row', () => {
			render(<ProjectsListClient />);
			expect(screen.getAllByText('Voir').length).toBeGreaterThanOrEqual(2);
			expect(screen.getAllByText('Modifier').length).toBeGreaterThanOrEqual(2);
			expect(screen.getAllByText('Supprimer').length).toBeGreaterThanOrEqual(2);
		});
	});

	describe('Action handlers', () => {
		it('navigates to add page', () => {
			render(<ProjectsListClient />);
			fireEvent.click(screen.getByText('Nouveau projet'));
			expect(mockPush).toHaveBeenCalled();
		});

		it('navigates to view page', () => {
			render(<ProjectsListClient />);
			fireEvent.click(screen.getAllByText('Voir')[0]);
			expect(mockPush).toHaveBeenCalled();
		});

		it('navigates to edit page', () => {
			render(<ProjectsListClient />);
			fireEvent.click(screen.getAllByText('Modifier')[0]);
			expect(mockPush).toHaveBeenCalled();
		});

		it('opens delete modal', async () => {
			render(<ProjectsListClient />);
			await act(async () => { fireEvent.click(screen.getAllByText('Supprimer')[0]); });
			expect(screen.getByTestId('action-modal')).toBeInTheDocument();
			expect(screen.getByText('Supprimer ce projet ?')).toBeInTheDocument();
		});

		it('closes delete modal on Annuler', async () => {
			render(<ProjectsListClient />);
			await act(async () => { fireEvent.click(screen.getAllByText('Supprimer')[0]); });
			await act(async () => { fireEvent.click(screen.getByText('Annuler')); });
			expect(screen.queryByTestId('action-modal')).not.toBeInTheDocument();
		});

		it('deletes project on confirm', async () => {
			render(<ProjectsListClient />);
			await act(async () => { fireEvent.click(screen.getAllByText('Supprimer')[0]); });
			const btns = screen.getAllByText('Supprimer');
			await act(async () => { fireEvent.click(btns[btns.length - 1]); });
			await waitFor(() => {
				expect(mockDeleteProject).toHaveBeenCalled();
				expect(mockOnSuccess).toHaveBeenCalledWith('Projet supprimé avec succès');
			});
		});

		it('handles delete error', async () => {
			mockDeleteProject.mockReturnValueOnce({ unwrap: () => Promise.reject(new Error('fail')) });
			render(<ProjectsListClient />);
			await act(async () => { fireEvent.click(screen.getAllByText('Supprimer')[0]); });
			const btns = screen.getAllByText('Supprimer');
			await act(async () => { fireEvent.click(btns[btns.length - 1]); });
			await waitFor(() => {
				expect(mockOnError).toHaveBeenCalledWith('Erreur lors de la suppression du projet');
			});
		});
	});

	describe('Column headers', () => {
		it('renders all expected column headers', () => {
			render(<ProjectsListClient />);
			for (const h of ['Nom du projet', 'Statut', 'Budget', 'Date de début', 'Date de fin', 'Chef de projet', 'Créé par', 'Actions']) {
				expect(screen.getByText(h)).toBeInTheDocument();
			}
		});
	});

	describe('Loading and empty states', () => {
		it('renders grid when loading', () => {
			mockUseGetProjectsListQuery.mockReturnValueOnce({ data: { results: [], count: 0, next: null, previous: null }, isLoading: true, refetch: mockRefetch });
			render(<ProjectsListClient />);
			expect(screen.getByTestId('paginated-data-grid')).toBeInTheDocument();
		});

		it('renders grid when empty', () => {
			mockUseGetProjectsListQuery.mockReturnValueOnce({ data: { results: [], count: 0, next: null, previous: null }, isLoading: false, refetch: mockRefetch });
			render(<ProjectsListClient />);
			expect(screen.getByTestId('paginated-data-grid')).toBeInTheDocument();
		});
	});
});
