'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Divider,
	IconButton,
	LinearProgress,
	Stack,
	TextField,
	ThemeProvider,
	Tooltip,
	Typography,
} from '@mui/material';
import {
	AccountBalanceWallet as BudgetIcon,
	Add as AddIcon,
	Delete as DeleteIcon,
	Savings as ProfitIcon,
	TrendingDown as CostIcon,
	TrendingUp as RevenueIcon,
} from '@mui/icons-material';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { DataGrid } from '@mui/x-data-grid';
import { frFR } from '@mui/x-data-grid/locales';
import {
	useCreateRealBudgetEntryMutation,
	useDeleteRealBudgetEntryMutation,
	useGetRealBudgetEntriesQuery,
} from '@/store/services/project';
import type { RealBudgetEntryFormValues } from '@/types/projectTypes';
import { extractApiErrorMessage, formatDate } from '@/utils/helpers';
import { getDefaultTheme } from '@/utils/themes';
import { useLanguage, useToast } from '@/utils/hooks';

const DEFAULT_STAGES = ['Design', 'Construction', 'Électricité', 'Plomberie'];

export type QueuedRealBudgetEntry = {
	id: string;
	date: string;
	stage: string;
	description: string;
	montant_client: string;
	montant_fournisseur: string;
	notes: string;
};

type ProjectRealBudgetCardProps = {
	projectId?: number;
	budgetInitial?: string | number;
	editable?: boolean;
	queuedEntries?: QueuedRealBudgetEntry[];
	setQueuedEntries?: React.Dispatch<React.SetStateAction<QueuedRealBudgetEntry[]>>;
};

type RealBudgetGridRow = {
	id: number | string;
	savedId?: number;
	date: string;
	stage: string;
	description: string;
	montant_client: string;
	montant_fournisseur: string;
	benefice: string;
	marge: string | number;
	isQueued?: boolean;
};

const today = () => new Date().toISOString().slice(0, 10);

const makeQueuedEntryId = () => {
	if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
		return crypto.randomUUID();
	}
	return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const toNumber = (value: string | number | null | undefined) => {
	if (value === null || value === undefined || value === '') return 0;
	const parsed = Number(String(value).replace(',', '.'));
	return Number.isFinite(parsed) ? parsed : 0;
};

const toDecimalPayload = (value: string) => value.replace(',', '.');

const formatMoney = (value: string | number | null | undefined) =>
	`${toNumber(value).toLocaleString('fr-MA', { maximumFractionDigits: 2 })} MAD`;

const formatPercent = (value: string | number | null | undefined) => `${toNumber(value).toFixed(2)}%`;

export const buildRealBudgetEntryPayload = (
	projectId: number,
	entry: Pick<QueuedRealBudgetEntry, 'date' | 'stage' | 'description' | 'montant_client' | 'montant_fournisseur' | 'notes'>,
): Omit<RealBudgetEntryFormValues, 'globalError'> => ({
	project: projectId,
	date: entry.date,
	stage: entry.stage.trim(),
	description: entry.description.trim(),
	montant_client: toDecimalPayload(entry.montant_client),
	montant_fournisseur: toDecimalPayload(entry.montant_fournisseur),
	notes: entry.notes ?? '',
});

const SummaryBox: React.FC<{ icon: React.ReactNode; label: string; value: string; tone: string }> = ({ icon, label, value, tone }) => (
	<Box
		sx={{
			border: '1px solid',
			borderColor: 'divider',
			borderLeft: `4px solid ${tone}`,
			px: 1.5,
			py: 1.25,
			minHeight: 86,
			display: 'flex',
			flexDirection: 'column',
			justifyContent: 'space-between',
		}}
	>
		<Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: tone }}>
			{icon}
			<Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.6 }}>
				{label}
			</Typography>
		</Stack>
		<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
			{value}
		</Typography>
	</Box>
);

const ProjectRealBudgetCard: React.FC<ProjectRealBudgetCardProps> = ({
	projectId,
	budgetInitial = 0,
	editable = false,
	queuedEntries = [],
	setQueuedEntries,
}) => {
	const { t } = useLanguage();
	const { onSuccess, onError } = useToast();
	const { data = [], isLoading } = useGetRealBudgetEntriesQuery({ project: projectId }, { skip: !projectId });
	const [createEntry] = useCreateRealBudgetEntryMutation();
	const [deleteEntry] = useDeleteRealBudgetEntryMutation();
	const [date, setDate] = useState(today());
	const [stage, setStage] = useState('');
	const [description, setDescription] = useState('');
	const [montantClient, setMontantClient] = useState('');
	const [montantFournisseur, setMontantFournisseur] = useState('');
	const [isPending, setIsPending] = useState(false);
	const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 5 });

	const sortedRows = useMemo(
		() => [...data].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id),
		[data],
	);

	const sortedQueuedRows = useMemo(
		() => [...queuedEntries].sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id)),
		[queuedEntries],
	);

	const canSubmit = date && stage.trim() && montantClient && montantFournisseur;
	const hasRows = sortedRows.length > 0 || sortedQueuedRows.length > 0;

	const gridRows = useMemo<RealBudgetGridRow[]>(() => {
		const queuedRows = sortedQueuedRows.map((row) => {
			const benefice = toNumber(row.montant_client) - toNumber(row.montant_fournisseur);
			const marge = toNumber(row.montant_client) ? (benefice / toNumber(row.montant_client)) * 100 : 0;
			return {
				id: `queued-${row.id}`,
				date: row.date,
				stage: row.stage,
				description: row.description,
				montant_client: row.montant_client,
				montant_fournisseur: row.montant_fournisseur,
				benefice: String(benefice),
				marge,
				isQueued: true,
			};
		});
		const savedRows = sortedRows.map((row) => ({
			id: row.id,
			savedId: row.id,
			date: row.date,
			stage: row.stage,
			description: row.description ?? '',
			montant_client: row.montant_client,
			montant_fournisseur: row.montant_fournisseur,
			benefice: row.benefice,
			marge: row.marge,
		}));
		return [...queuedRows, ...savedRows];
	}, [sortedQueuedRows, sortedRows]);

	const summary = useMemo(() => {
		const totalRevenue = gridRows.reduce((sum, row) => sum + toNumber(row.montant_client), 0);
		const totalCost = gridRows.reduce((sum, row) => sum + toNumber(row.montant_fournisseur), 0);
		const profit = totalRevenue - totalCost;
		const margin = totalRevenue ? (profit / totalRevenue) * 100 : 0;
		const gap = toNumber(budgetInitial) - totalCost;
		return { totalRevenue, totalCost, profit, margin, gap };
	}, [budgetInitial, gridRows]);

	const resetFields = () => {
		setDate(today());
		setStage('');
		setDescription('');
		setMontantClient('');
		setMontantFournisseur('');
	};

	const handleAdd = async () => {
		if (!canSubmit || !editable) return;

		const entry = {
			id: makeQueuedEntryId(),
			date,
			stage: stage.trim(),
			description: description.trim(),
			montant_client: montantClient,
			montant_fournisseur: montantFournisseur,
			notes: '',
		};

		if (!projectId) {
			setQueuedEntries?.((current) => [...current, entry]);
			resetFields();
			return;
		}

		setIsPending(true);
		try {
			await createEntry({ data: buildRealBudgetEntryPayload(projectId, entry) }).unwrap();
			resetFields();
			onSuccess(t.realBudget.entryAddedSuccess);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.realBudget.entryAddError));
		} finally {
			setIsPending(false);
		}
	};

	const handleDelete = useCallback(async (id: number) => {
		if (!editable) return;
		setIsPending(true);
		try {
			await deleteEntry({ id }).unwrap();
			onSuccess(t.realBudget.entryDeletedSuccess);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.realBudget.entryDeleteError));
		} finally {
			setIsPending(false);
		}
	}, [deleteEntry, editable, onError, onSuccess, t.realBudget.entryDeleteError, t.realBudget.entryDeletedSuccess]);

	const handleRemoveQueued = useCallback((id: string) => {
		setQueuedEntries?.((current) => current.filter((row) => row.id !== id));
	}, [setQueuedEntries]);

	const amountInput = (setter: React.Dispatch<React.SetStateAction<string>>) => (event: React.ChangeEvent<HTMLInputElement>) => {
		if (/^(0|[1-9]\d*)?([.,]\d*)?$/.test(event.target.value)) setter(event.target.value);
	};

	const columns = useMemo<GridColDef<RealBudgetGridRow>[]>(
		() => [
			{
				field: 'date',
				headerName: t.common.date,
				minWidth: 130,
				flex: 0.75,
				renderCell: (params: GridRenderCellParams<RealBudgetGridRow, string>) => formatDate(params.value ?? null),
			},
			{
				field: 'stage',
				headerName: t.realBudget.stage,
				minWidth: 160,
				flex: 0.9,
				renderCell: (params: GridRenderCellParams<RealBudgetGridRow, string>) => (
					<Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
						<Typography variant="body2" noWrap>
							{params.value}
						</Typography>
						{params.row.isQueued ? (
							<Chip size="small" color="warning" variant="outlined" label={t.realBudget.pendingSave} />
						) : null}
					</Stack>
				),
			},
			{
				field: 'description',
				headerName: t.common.description,
				minWidth: 220,
				flex: 1.2,
				renderCell: (params: GridRenderCellParams<RealBudgetGridRow, string>) => (
					<Typography variant="body2" noWrap>
						{params.value || '-'}
					</Typography>
				),
			},
			{
				field: 'montant_client',
				headerName: t.realBudget.clientAmount,
				minWidth: 160,
				flex: 0.9,
				align: 'right',
				headerAlign: 'right',
				renderCell: (params: GridRenderCellParams<RealBudgetGridRow, string>) => formatMoney(params.value),
			},
			{
				field: 'montant_fournisseur',
				headerName: t.realBudget.supplierAmount,
				minWidth: 170,
				flex: 0.95,
				align: 'right',
				headerAlign: 'right',
				renderCell: (params: GridRenderCellParams<RealBudgetGridRow, string>) => formatMoney(params.value),
			},
			{
				field: 'benefice',
				headerName: t.realBudget.operationProfit,
				minWidth: 145,
				flex: 0.85,
				align: 'right',
				headerAlign: 'right',
				renderCell: (params: GridRenderCellParams<RealBudgetGridRow, string>) => (
					<Typography
						component="span"
						variant="body2"
						color={toNumber(params.value) < 0 ? 'error.main' : 'success.main'}
						sx={{ fontWeight: 700 }}
					>
						{formatMoney(params.value)}
					</Typography>
				),
			},
			{
				field: 'marge',
				headerName: t.projects.margin,
				minWidth: 105,
				flex: 0.6,
				align: 'right',
				headerAlign: 'right',
				renderCell: (params: GridRenderCellParams<RealBudgetGridRow, string | number>) => formatPercent(params.value),
			},
			...(editable
				? [
						{
							field: 'actions',
							headerName: t.common.actions,
							minWidth: 90,
							sortable: false,
							filterable: false,
							align: 'right' as const,
							headerAlign: 'right' as const,
							renderCell: (params: GridRenderCellParams<RealBudgetGridRow>) => (
								<Tooltip title={t.common.delete}>
									<IconButton
										size="small"
										color="error"
										disabled={isPending}
										onClick={() => {
											if (params.row.isQueued) {
												handleRemoveQueued(String(params.row.id).replace('queued-', ''));
												return;
											}
											if (params.row.savedId) {
												handleDelete(params.row.savedId);
											}
										}}
									>
										<DeleteIcon fontSize="small" />
									</IconButton>
								</Tooltip>
							),
						},
					]
				: []),
		],
		[editable, handleDelete, handleRemoveQueued, isPending, t],
	);

	return (
		<Card elevation={2} sx={{ borderRadius: 2 }}>
			<CardContent sx={{ p: 3 }}>
				<Stack
					direction={{ xs: 'column', sm: 'row' }}
					spacing={1.5}
					sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', mb: 2 }}
				>
					<Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
						<BudgetIcon color="primary" />
						<Typography variant="h6" sx={{ fontWeight: 700 }}>
							{t.realBudget.title}
						</Typography>
					</Stack>
					{editable && sortedQueuedRows.length > 0 ? (
						<Chip size="small" color="warning" variant="outlined" label={`${sortedQueuedRows.length} ${t.realBudget.pendingSave}`} />
					) : null}
				</Stack>
				<Divider sx={{ mb: 3 }} />

				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' },
						gap: 1.5,
						mb: 2.5,
					}}
				>
					<SummaryBox icon={<BudgetIcon fontSize="small" />} label={t.realBudget.initialBudget} value={formatMoney(budgetInitial)} tone="#ed6c02" />
					<SummaryBox icon={<CostIcon fontSize="small" />} label={t.realBudget.realCost} value={formatMoney(summary.totalCost)} tone="#d32f2f" />
					<SummaryBox icon={<RevenueIcon fontSize="small" />} label={t.realBudget.realRevenue} value={formatMoney(summary.totalRevenue)} tone="#2e7d32" />
					<SummaryBox icon={<ProfitIcon fontSize="small" />} label={t.realBudget.globalMargin} value={`${formatMoney(summary.profit)} (${formatPercent(summary.margin)})`} tone={summary.profit >= 0 ? '#2e7d32' : '#d32f2f'} />
					<SummaryBox icon={<BudgetIcon fontSize="small" />} label={t.realBudget.budgetGap} value={formatMoney(summary.gap)} tone={summary.gap >= 0 ? '#0288d1' : '#d32f2f'} />
				</Box>

				{editable ? (
					<Stack spacing={1.5} sx={{ mb: 2 }}>
						<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
							<TextField
								size="small"
								type="date"
								label={t.common.date}
								value={date}
								onChange={(event) => setDate(event.target.value)}
								slotProps={{ inputLabel: { shrink: true } }}
								fullWidth
							/>
							<TextField
								size="small"
								label={t.realBudget.stage}
								value={stage}
								onChange={(event) => setStage(event.target.value)}
								fullWidth
							/>
							<TextField
								size="small"
								label={t.common.description}
								value={description}
								onChange={(event) => setDescription(event.target.value)}
								fullWidth
							/>
						</Stack>
						<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
							<TextField
								size="small"
								label={t.realBudget.clientAmount}
								value={montantClient}
								onChange={amountInput(setMontantClient)}
								slotProps={{ htmlInput: { inputMode: 'decimal' } }}
								fullWidth
							/>
							<TextField
								size="small"
								label={t.realBudget.supplierAmount}
								value={montantFournisseur}
								onChange={amountInput(setMontantFournisseur)}
								slotProps={{ htmlInput: { inputMode: 'decimal' } }}
								fullWidth
							/>
							<Button
								variant="contained"
								startIcon={<AddIcon />}
								disabled={!canSubmit || isPending || isLoading}
								onClick={handleAdd}
								sx={{ whiteSpace: 'nowrap', minWidth: { xs: '100%', md: 190 } }}
							>
								{t.realBudget.addEntry}
							</Button>
						</Stack>
						<Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
							{DEFAULT_STAGES.map((item) => (
								<Chip key={item} size="small" label={item} variant="outlined" onClick={() => setStage(item)} />
							))}
						</Stack>
					</Stack>
				) : null}

				{isPending || isLoading ? <LinearProgress sx={{ mb: 2 }} /> : null}

				<ThemeProvider theme={getDefaultTheme()}>
					<Box sx={{ width: '100%', height: hasRows ? 430 : 320 }}>
						<DataGrid
							rows={gridRows}
							columns={columns}
							loading={isLoading}
							pagination
							paginationModel={paginationModel}
							onPaginationModelChange={setPaginationModel}
							pageSizeOptions={[5, 10, 25]}
							localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
							disableRowSelectionOnClick
							showToolbar
							slots={{
								noRowsOverlay: () => (
									<Stack sx={{ height: '100%', alignItems: 'center', justifyContent: 'center' }}>
										<Typography color="text.secondary">{t.realBudget.noEntries}</Typography>
									</Stack>
								),
							}}
							sx={{
								borderColor: 'divider',
								'& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center' },
								'& .MuiDataGrid-row:hover': { cursor: editable ? 'default' : 'inherit' },
							}}
						/>
					</Box>
				</ThemeProvider>
			</CardContent>
		</Card>
	);
};

export default ProjectRealBudgetCard;
