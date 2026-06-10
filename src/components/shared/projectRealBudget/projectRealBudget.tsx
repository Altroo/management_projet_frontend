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
	InputAdornment,
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
	Assignment as AssignmentIcon,
	AttachMoney as AttachMoneyIcon,
	CalendarMonth as CalendarMonthIcon,
	Delete as DeleteIcon,
	Notes as NotesIcon,
	Savings as ProfitIcon,
	TrendingDown as CostIcon,
	TrendingUp as RevenueIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { DataGrid } from '@mui/x-data-grid';
import { frFR } from '@mui/x-data-grid/locales';
import { format, parseISO } from 'date-fns';
import {
	useCreateRealBudgetEntryMutation,
	useDeleteRealBudgetEntryMutation,
	useGetRealBudgetEntriesQuery,
} from '@/store/services/project';
import type { RealBudgetEntryFormValues } from '@/types/projectTypes';
import { extractApiErrorMessage, formatDate } from '@/utils/helpers';
import { getDefaultTheme, textInputTheme } from '@/utils/themes';
import { useLanguage, useToast } from '@/utils/hooks';

const inputTheme = textInputTheme();

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
	validationAttempted?: boolean;
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
	isDraft?: boolean;
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
	validationAttempted = false,
	queuedEntries = [],
	setQueuedEntries,
}) => {
	const { t } = useLanguage();
	const { onSuccess, onError } = useToast();
	const { data = [], isLoading, refetch } = useGetRealBudgetEntriesQuery(
		{ project: projectId },
		{ skip: !projectId, refetchOnMountOrArgChange: true },
	);
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

	const canSubmit = Boolean(date && stage.trim() && montantClient && montantFournisseur);
	const draftErrors = useMemo(
		() => ({
			date: validationAttempted && !date,
			stage: validationAttempted && !stage.trim(),
			montantClient: validationAttempted && !montantClient,
			montantFournisseur: validationAttempted && !montantFournisseur,
		}),
		[date, montantClient, montantFournisseur, stage, validationAttempted],
	);

	const savedAndQueuedRows = useMemo<RealBudgetGridRow[]>(() => {
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

	const gridRows = useMemo<RealBudgetGridRow[]>(() => {
		if (!editable) return savedAndQueuedRows;

		const draftBenefice = toNumber(montantClient) - toNumber(montantFournisseur);
		const draftMarge = toNumber(montantClient) ? (draftBenefice / toNumber(montantClient)) * 100 : 0;
		return [
			{
				id: 'draft-real-budget-entry',
				date,
				stage,
				description,
				montant_client: montantClient,
				montant_fournisseur: montantFournisseur,
				benefice: String(draftBenefice),
				marge: draftMarge,
				isDraft: true,
			},
			...savedAndQueuedRows,
		];
	}, [date, description, editable, montantClient, montantFournisseur, savedAndQueuedRows, stage]);

	const hasRows = gridRows.length > 0;

	const summary = useMemo(() => {
		const totalRevenue = savedAndQueuedRows.reduce((sum, row) => sum + toNumber(row.montant_client), 0);
		const totalCost = savedAndQueuedRows.reduce((sum, row) => sum + toNumber(row.montant_fournisseur), 0);
		const profit = totalRevenue - totalCost;
		const margin = totalRevenue ? (profit / totalRevenue) * 100 : 0;
		const gap = toNumber(budgetInitial) - totalCost;
		return { totalRevenue, totalCost, profit, margin, gap };
	}, [budgetInitial, savedAndQueuedRows]);

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
			setPaginationModel((current) => ({ ...current, page: 0 }));
			resetFields();
			return;
		}

		setIsPending(true);
		try {
			await createEntry({ data: buildRealBudgetEntryPayload(projectId, entry) }).unwrap();
			await refetch();
			setPaginationModel((current) => ({ ...current, page: 0 }));
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
			await refetch();
			onSuccess(t.realBudget.entryDeletedSuccess);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.realBudget.entryDeleteError));
		} finally {
			setIsPending(false);
		}
	}, [deleteEntry, editable, onError, onSuccess, refetch, t.realBudget.entryDeleteError, t.realBudget.entryDeletedSuccess]);

	const handleRemoveQueued = useCallback((id: string) => {
		setQueuedEntries?.((current) => current.filter((row) => row.id !== id));
	}, [setQueuedEntries]);

	const amountInput = useCallback((setter: React.Dispatch<React.SetStateAction<string>>) => (event: React.ChangeEvent<HTMLInputElement>) => {
		if (/^(0|[1-9]\d*)?([.,]\d*)?$/.test(event.target.value)) setter(event.target.value);
	}, []);

	const columns = useMemo<GridColDef<RealBudgetGridRow>[]>(
		() => {
			const gridPlainInputSx = {
				'& .MuiInputBase-root': {
					fontFamily: 'Poppins',
					fontSize: '14px',
				},
				'& .MuiInputBase-input': {
					py: 0,
				},
				'& .MuiInputBase-input::placeholder': {
					opacity: 0.7,
				},
			};

			const stopGridClick = (event: React.MouseEvent) => event.stopPropagation();

			const draftTextInput = ({
				value,
				onChange,
				placeholder,
				icon,
				inputMode,
				align = 'left',
				error = false,
			}: {
				value: string;
				onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
				placeholder: string;
				icon: React.ReactNode;
				inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
				align?: 'left' | 'right';
				error?: boolean;
			}) => (
				<TextField
					variant="standard"
					value={value}
					onChange={onChange}
					placeholder={placeholder}
					error={error}
					disabled={isPending || isLoading}
					slotProps={{
						input: {
							disableUnderline: true,
							startAdornment: (
								<InputAdornment position="start" sx={{ color: error ? 'error.main' : 'text.secondary' }}>
									{icon}
								</InputAdornment>
							),
						},
						htmlInput: { inputMode, style: { textAlign: align } },
					}}
					fullWidth
					onClick={stopGridClick}
					sx={{
						...gridPlainInputSx,
						'& .MuiInputBase-input': {
							py: 0,
							color: error ? 'error.main' : 'text.primary',
						},
						'& .MuiInputBase-input::placeholder': {
							color: error ? 'error.main' : 'text.secondary',
							opacity: error ? 0.65 : 0.7,
						},
					}}
				/>
			);

			return [
				{
					field: 'date',
					headerName: t.common.date,
					minWidth: 150,
					flex: 0.8,
					sortable: false,
					filterable: false,
					renderCell: (params: GridRenderCellParams<RealBudgetGridRow, string>) =>
						params.row.isDraft ? (
							<Box sx={{ width: '100%' }} onClick={stopGridClick}>
								<ThemeProvider theme={inputTheme}>
									<DatePicker
										label={`${t.common.date} *`}
										value={date ? parseISO(date) : null}
										onChange={(nextDate) => setDate(nextDate ? format(nextDate, 'yyyy-MM-dd') : '')}
										disabled={isPending || isLoading}
										slotProps={{
											textField: {
												variant: 'standard',
												fullWidth: true,
												error: draftErrors.date,
												slotProps: {
													input: {
														disableUnderline: true,
														startAdornment: (
															<InputAdornment position="start" sx={{ color: draftErrors.date ? 'error.main' : 'text.secondary' }}>
																<CalendarMonthIcon fontSize="small" />
															</InputAdornment>
														),
													},
												},
												sx: {
													...gridPlainInputSx,
													'& .MuiFormLabel-root': {
														color: draftErrors.date ? 'error.main' : 'text.secondary',
													},
													'& .MuiInputBase-input': {
														py: 0,
														color: draftErrors.date ? 'error.main' : 'text.primary',
													},
												},
											},
										}}
									/>
								</ThemeProvider>
							</Box>
						) : (
							formatDate(params.value ?? null)
						),
				},
				{
					field: 'stage',
					headerName: t.realBudget.stage,
					minWidth: 180,
					flex: 0.95,
					sortable: false,
					filterable: false,
					renderCell: (params: GridRenderCellParams<RealBudgetGridRow, string>) =>
						params.row.isDraft ? (
							draftTextInput({
								value: stage,
								onChange: (event) => setStage(event.target.value),
								placeholder: `${t.realBudget.stage} *`,
								icon: <AssignmentIcon fontSize="small" />,
								error: draftErrors.stage,
							})
						) : (
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
					sortable: false,
					filterable: false,
					renderCell: (params: GridRenderCellParams<RealBudgetGridRow, string>) =>
						params.row.isDraft ? (
							draftTextInput({
								value: description,
								onChange: (event) => setDescription(event.target.value),
								placeholder: t.common.description,
								icon: <NotesIcon fontSize="small" />,
							})
						) : (
							<Typography variant="body2" noWrap>
								{params.value || '-'}
							</Typography>
						),
				},
				{
					field: 'montant_client',
					headerName: t.realBudget.clientAmount,
					minWidth: 170,
					flex: 0.9,
					align: 'right',
					headerAlign: 'right',
					sortable: false,
					filterable: false,
					renderCell: (params: GridRenderCellParams<RealBudgetGridRow, string>) =>
						params.row.isDraft
							? draftTextInput({
									value: montantClient,
									onChange: amountInput(setMontantClient),
									placeholder: `${t.realBudget.clientAmount} *`,
									icon: <AttachMoneyIcon fontSize="small" />,
									inputMode: 'decimal',
									align: 'right',
									error: draftErrors.montantClient,
								})
							: formatMoney(params.value),
				},
				{
					field: 'montant_fournisseur',
					headerName: t.realBudget.supplierAmount,
					minWidth: 180,
					flex: 0.95,
					align: 'right',
					headerAlign: 'right',
					sortable: false,
					filterable: false,
					renderCell: (params: GridRenderCellParams<RealBudgetGridRow, string>) =>
						params.row.isDraft
							? draftTextInput({
									value: montantFournisseur,
									onChange: amountInput(setMontantFournisseur),
									placeholder: `${t.realBudget.supplierAmount} *`,
									icon: <AttachMoneyIcon fontSize="small" />,
									inputMode: 'decimal',
									align: 'right',
									error: draftErrors.montantFournisseur,
								})
							: formatMoney(params.value),
				},
				{
					field: 'benefice',
					headerName: t.realBudget.operationProfit,
					minWidth: 145,
					flex: 0.85,
					align: 'right',
					headerAlign: 'right',
					sortable: false,
					filterable: false,
					renderCell: (params: GridRenderCellParams<RealBudgetGridRow, string>) =>
						params.row.isDraft && (!montantClient || !montantFournisseur) ? (
							<Typography variant="body2" color="text.secondary">
								-
							</Typography>
						) : (
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
					sortable: false,
					filterable: false,
					renderCell: (params: GridRenderCellParams<RealBudgetGridRow, string | number>) =>
						params.row.isDraft && (!montantClient || !montantFournisseur) ? '-' : formatPercent(params.value),
				},
				...(editable
					? [
							{
								field: 'actions',
								headerName: t.common.actions,
								minWidth: 90,
								sortable: false,
								filterable: false,
								disableColumnMenu: true,
								align: 'right' as const,
								headerAlign: 'right' as const,
								renderCell: (params: GridRenderCellParams<RealBudgetGridRow>) => (
									<Tooltip title={t.common.delete}>
										<IconButton
											size="small"
											color="error"
											disabled={isPending}
											onClick={() => {
												if (params.row.isDraft) {
													resetFields();
													return;
												}
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
			];
		},
		[
			amountInput,
			date,
			description,
			draftErrors,
			editable,
			handleDelete,
			handleRemoveQueued,
			isLoading,
			isPending,
			montantClient,
			montantFournisseur,
			stage,
			t,
		],
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
					{editable ? (
						<Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
							{sortedQueuedRows.length > 0 ? (
								<Chip size="small" color="warning" variant="outlined" label={`${sortedQueuedRows.length} ${t.realBudget.pendingSave}`} />
							) : null}
							<Button
								variant="outlined"
								size="small"
								startIcon={<AddIcon />}
								disabled={!canSubmit || isPending || isLoading}
								onClick={handleAdd}
							>
								{t.common.add}
							</Button>
						</Stack>
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
							slotProps={{
								toolbar: {
									showQuickFilter: true,
									quickFilterProps: { debounceMs: 500 },
								},
							}}
							getRowHeight={() => 64}
							slots={{
								noRowsOverlay: () => (
									<Stack sx={{ height: '100%', alignItems: 'center', justifyContent: 'center' }}>
										<Typography color="text.secondary">{t.realBudget.noEntries}</Typography>
									</Stack>
								),
							}}
							sx={{
								border: 'none',
								'& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700 },
								'& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center' },
								'& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus': { outline: 'none' },
								'& .MuiDataGrid-toolbarContainer': { px: 0, pt: 0, pb: 1 },
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
