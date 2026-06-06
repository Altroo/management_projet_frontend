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
import { Add as AddIcon, Delete as DeleteIcon, EventAvailable as EventAvailableIcon } from '@mui/icons-material';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { DataGrid } from '@mui/x-data-grid';
import { frFR } from '@mui/x-data-grid/locales';
import {
	useCreatePaymentScheduleMutation,
	useDeletePaymentScheduleMutation,
	useGetPaymentSchedulesQuery,
} from '@/store/services/project';
import type { PaymentScheduleFormValues } from '@/types/projectTypes';
import { extractApiErrorMessage, formatDate } from '@/utils/helpers';
import { getDefaultTheme } from '@/utils/themes';
import { useLanguage, useToast } from '@/utils/hooks';

export type QueuedPaymentSchedule = {
	id: string;
	due_date: string;
	expected_amount: string;
	description: string;
	notes: string;
};

type ProjectPaymentScheduleCardProps = {
	projectId?: number;
	editable?: boolean;
	queuedSchedules?: QueuedPaymentSchedule[];
	setQueuedSchedules?: React.Dispatch<React.SetStateAction<QueuedPaymentSchedule[]>>;
};

type ScheduleGridRow = {
	id: number | string;
	savedId?: number;
	due_date: string;
	description: string;
	expected_amount: string;
	actual_amount: string;
	expected_cumulative: string;
	actual_cumulative: string;
	variance: string;
	isQueued?: boolean;
};

const formatMoney = (value: string | number | null | undefined) => `${Number(value || 0).toLocaleString('fr-MA')} MAD`;

const makeQueuedScheduleId = () => {
	if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
		return crypto.randomUUID();
	}
	return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const buildPaymentSchedulePayload = (
	projectId: number,
	schedule: Pick<QueuedPaymentSchedule, 'due_date' | 'expected_amount' | 'description' | 'notes'>,
): Omit<PaymentScheduleFormValues, 'globalError'> => ({
	project: projectId,
	due_date: schedule.due_date,
	expected_amount: schedule.expected_amount,
	description: schedule.description.trim(),
	notes: schedule.notes ?? '',
});

const ProjectPaymentScheduleCard: React.FC<ProjectPaymentScheduleCardProps> = ({
	projectId,
	editable = false,
	queuedSchedules = [],
	setQueuedSchedules,
}) => {
	const { t } = useLanguage();
	const { onSuccess, onError } = useToast();
	const { data = [], isLoading } = useGetPaymentSchedulesQuery({ project: projectId }, { skip: !projectId });
	const [createSchedule] = useCreatePaymentScheduleMutation();
	const [deleteSchedule] = useDeletePaymentScheduleMutation();
	const [dueDate, setDueDate] = useState('');
	const [expectedAmount, setExpectedAmount] = useState('');
	const [description, setDescription] = useState('');
	const [isPending, setIsPending] = useState(false);
	const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 5 });

	const sortedRows = useMemo(
		() => [...data].sort((a, b) => a.due_date.localeCompare(b.due_date) || a.id - b.id),
		[data],
	);

	const sortedQueuedRows = useMemo(
		() => [...queuedSchedules].sort((a, b) => a.due_date.localeCompare(b.due_date) || a.id.localeCompare(b.id)),
		[queuedSchedules],
	);

	const canSubmit = dueDate && expectedAmount && description.trim();
	const hasRows = sortedRows.length > 0 || sortedQueuedRows.length > 0;

	const gridRows = useMemo<ScheduleGridRow[]>(() => {
		const queuedRows = sortedQueuedRows.map((row) => ({
			id: `queued-${row.id}`,
			due_date: row.due_date,
			description: row.description,
			expected_amount: row.expected_amount,
			actual_amount: '',
			expected_cumulative: '',
			actual_cumulative: '',
			variance: '',
			isQueued: true,
		}));
		const savedRows = sortedRows.map((row) => ({
			id: row.id,
			savedId: row.id,
			due_date: row.due_date,
			description: row.description,
			expected_amount: row.expected_amount,
			actual_amount: row.actual_amount,
			expected_cumulative: row.expected_cumulative,
			actual_cumulative: row.actual_cumulative,
			variance: row.variance,
		}));
		return [...queuedRows, ...savedRows];
	}, [sortedQueuedRows, sortedRows]);

	const resetFields = () => {
		setDueDate('');
		setExpectedAmount('');
		setDescription('');
	};

	const handleAdd = async () => {
		if (!canSubmit || !editable) return;

		if (!projectId) {
			setQueuedSchedules?.((current) => [
				...current,
				{
					id: makeQueuedScheduleId(),
					due_date: dueDate,
					expected_amount: expectedAmount,
					description: description.trim(),
					notes: '',
				},
			]);
			resetFields();
			return;
		}

		setIsPending(true);
		try {
			await createSchedule({
				data: buildPaymentSchedulePayload(projectId, {
					due_date: dueDate,
					expected_amount: expectedAmount,
					description,
					notes: '',
				}),
			}).unwrap();
			resetFields();
			onSuccess(t.paymentSchedules.scheduleAddedSuccess);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.paymentSchedules.scheduleAddError));
		} finally {
			setIsPending(false);
		}
	};

	const handleDelete = useCallback(async (id: number) => {
		if (!editable) return;
		setIsPending(true);
		try {
			await deleteSchedule({ id }).unwrap();
			onSuccess(t.paymentSchedules.scheduleDeletedSuccess);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.paymentSchedules.scheduleDeleteError));
		} finally {
			setIsPending(false);
		}
	}, [deleteSchedule, editable, onError, onSuccess, t.paymentSchedules.scheduleDeleteError, t.paymentSchedules.scheduleDeletedSuccess]);

	const handleRemoveQueued = useCallback((id: string) => {
		setQueuedSchedules?.((current) => current.filter((row) => row.id !== id));
	}, [setQueuedSchedules]);

	const columns = useMemo<GridColDef<ScheduleGridRow>[]>(
		() => [
			{
				field: 'due_date',
				headerName: t.common.dueDate,
				minWidth: 130,
				flex: 0.8,
				renderCell: (params: GridRenderCellParams<ScheduleGridRow, string>) => formatDate(params.value ?? null),
			},
			{
				field: 'description',
				headerName: t.common.description,
				minWidth: 220,
				flex: 1.4,
				renderCell: (params: GridRenderCellParams<ScheduleGridRow, string>) => (
					<Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
						<Typography variant="body2" noWrap>
							{params.value}
						</Typography>
						{params.row.isQueued ? (
							<Chip size="small" color="warning" variant="outlined" label={t.paymentSchedules.pendingSave} />
						) : null}
					</Stack>
				),
			},
			{
				field: 'expected_amount',
				headerName: t.common.expectedAmount,
				minWidth: 150,
				flex: 0.9,
				align: 'right',
				headerAlign: 'right',
				renderCell: (params: GridRenderCellParams<ScheduleGridRow, string>) => formatMoney(params.value),
			},
			{
				field: 'actual_amount',
				headerName: t.common.actualAmount,
				minWidth: 140,
				flex: 0.85,
				align: 'right',
				headerAlign: 'right',
				renderCell: (params: GridRenderCellParams<ScheduleGridRow, string>) =>
					params.row.isQueued ? '-' : formatMoney(params.value),
			},
			{
				field: 'expected_cumulative',
				headerName: t.paymentSchedules.expectedCumulative,
				minWidth: 150,
				flex: 0.9,
				align: 'right',
				headerAlign: 'right',
				renderCell: (params: GridRenderCellParams<ScheduleGridRow, string>) =>
					params.row.isQueued ? '-' : formatMoney(params.value),
			},
			{
				field: 'actual_cumulative',
				headerName: t.paymentSchedules.actualCumulative,
				minWidth: 145,
				flex: 0.9,
				align: 'right',
				headerAlign: 'right',
				renderCell: (params: GridRenderCellParams<ScheduleGridRow, string>) =>
					params.row.isQueued ? '-' : formatMoney(params.value),
			},
			{
				field: 'variance',
				headerName: t.common.variance,
				minWidth: 130,
				flex: 0.8,
				align: 'right',
				headerAlign: 'right',
				renderCell: (params: GridRenderCellParams<ScheduleGridRow, string>) =>
					params.row.isQueued ? (
						'-'
					) : (
						<Typography
							component="span"
							variant="body2"
							color={Number(params.value) < 0 ? 'error.main' : 'success.main'}
							sx={{ fontWeight: 700 }}
						>
							{formatMoney(params.value)}
						</Typography>
					),
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
							renderCell: (params: GridRenderCellParams<ScheduleGridRow>) => (
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
						<EventAvailableIcon color="primary" />
						<Typography variant="h6" sx={{ fontWeight: 700 }}>
							{t.paymentSchedules.title}
						</Typography>
					</Stack>
					{editable && sortedQueuedRows.length > 0 ? (
						<Chip size="small" color="warning" variant="outlined" label={`${sortedQueuedRows.length} ${t.paymentSchedules.pendingSave}`} />
					) : null}
				</Stack>
				<Divider sx={{ mb: 3 }} />

				{editable ? (
					<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
						<TextField
							size="small"
							type="date"
							label={t.common.dueDate}
							value={dueDate}
							onChange={(event) => setDueDate(event.target.value)}
							slotProps={{ inputLabel: { shrink: true } }}
							fullWidth
						/>
						<TextField
							size="small"
							label={t.common.expectedAmount}
							value={expectedAmount}
							onChange={(event) => {
								if (/^(0|[1-9]\d*)?([.,]\d*)?$/.test(event.target.value)) setExpectedAmount(event.target.value);
							}}
							slotProps={{ htmlInput: { inputMode: 'decimal' } }}
							fullWidth
						/>
						<TextField
							size="small"
							label={t.common.description}
							value={description}
							onChange={(event) => setDescription(event.target.value)}
							fullWidth
						/>
						<Button
							variant="contained"
							startIcon={<AddIcon />}
							disabled={!canSubmit || isPending || isLoading}
							onClick={handleAdd}
							sx={{ whiteSpace: 'nowrap', minWidth: { xs: '100%', md: 190 } }}
						>
							{t.paymentSchedules.addSchedule}
						</Button>
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
										<Typography color="text.secondary">{t.paymentSchedules.noSchedules}</Typography>
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

export default ProjectPaymentScheduleCard;
