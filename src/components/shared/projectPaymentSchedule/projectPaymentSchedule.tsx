'use client';

import React, { useMemo, useState } from 'react';
import {
	Button,
	Card,
	CardContent,
	Divider,
	IconButton,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Tooltip,
	Typography,
} from '@mui/material';
import {
	Add as AddIcon,
	Delete as DeleteIcon,
	EventAvailable as EventAvailableIcon,
} from '@mui/icons-material';
import {
	useCreatePaymentScheduleMutation,
	useDeletePaymentScheduleMutation,
	useGetPaymentSchedulesQuery,
} from '@/store/services/project';
import { extractApiErrorMessage, formatDate } from '@/utils/helpers';
import { useLanguage, useToast } from '@/utils/hooks';

const formatMoney = (value: string | number) => `${Number(value || 0).toLocaleString('fr-MA')} MAD`;

const ProjectPaymentScheduleCard: React.FC<{ projectId: number }> = ({ projectId }) => {
	const { t } = useLanguage();
	const { onSuccess, onError } = useToast();
	const { data = [], isLoading } = useGetPaymentSchedulesQuery({ project: projectId });
	const [createSchedule] = useCreatePaymentScheduleMutation();
	const [deleteSchedule] = useDeletePaymentScheduleMutation();
	const [dueDate, setDueDate] = useState('');
	const [expectedAmount, setExpectedAmount] = useState('');
	const [description, setDescription] = useState('');
	const [isPending, setIsPending] = useState(false);

	const sortedRows = useMemo(
		() => [...data].sort((a, b) => a.due_date.localeCompare(b.due_date) || a.id - b.id),
		[data],
	);

	const canSubmit = dueDate && expectedAmount && description.trim();

	const handleAdd = async () => {
		if (!canSubmit) return;
		setIsPending(true);
		try {
			await createSchedule({
				data: {
					project: projectId,
					due_date: dueDate,
					expected_amount: expectedAmount,
					description: description.trim(),
					notes: '',
				},
			}).unwrap();
			setDueDate('');
			setExpectedAmount('');
			setDescription('');
			onSuccess(t.paymentSchedules.scheduleAddedSuccess);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.paymentSchedules.scheduleAddError));
		} finally {
			setIsPending(false);
		}
	};

	const handleDelete = async (id: number) => {
		setIsPending(true);
		try {
			await deleteSchedule({ id }).unwrap();
			onSuccess(t.paymentSchedules.scheduleDeletedSuccess);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.paymentSchedules.scheduleDeleteError));
		} finally {
			setIsPending(false);
		}
	};

	return (
		<Card elevation={2} sx={{ borderRadius: 2 }}>
			<CardContent sx={{ p: 3 }}>
				<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
					<EventAvailableIcon color="primary" />
					<Typography variant="h6" sx={{ fontWeight: 700 }}>
						{t.paymentSchedules.title}
					</Typography>
				</Stack>
				<Divider sx={{ mb: 3 }} />

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
						sx={{ whiteSpace: 'nowrap' }}
					>
						{t.paymentSchedules.addSchedule}
					</Button>
				</Stack>

				{sortedRows.length === 0 ? (
					<Typography color="text.secondary" sx={{ py: 2 }}>
						{t.paymentSchedules.noSchedules}
					</Typography>
				) : (
					<TableContainer>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>{t.common.dueDate}</TableCell>
									<TableCell>{t.common.description}</TableCell>
									<TableCell align="right">{t.common.expectedAmount}</TableCell>
									<TableCell align="right">{t.common.actualAmount}</TableCell>
									<TableCell align="right">{t.paymentSchedules.expectedCumulative}</TableCell>
									<TableCell align="right">{t.paymentSchedules.actualCumulative}</TableCell>
									<TableCell align="right">{t.common.variance}</TableCell>
									<TableCell align="right">{t.common.actions}</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{sortedRows.map((row) => (
									<TableRow key={row.id}>
										<TableCell>{formatDate(row.due_date)}</TableCell>
										<TableCell>{row.description}</TableCell>
										<TableCell align="right">{formatMoney(row.expected_amount)}</TableCell>
										<TableCell align="right">{formatMoney(row.actual_amount)}</TableCell>
										<TableCell align="right">{formatMoney(row.expected_cumulative)}</TableCell>
										<TableCell align="right">{formatMoney(row.actual_cumulative)}</TableCell>
										<TableCell align="right">
											<Typography
												component="span"
												color={Number(row.variance) < 0 ? 'error.main' : 'success.main'}
												sx={{ fontWeight: 600 }}
											>
												{formatMoney(row.variance)}
											</Typography>
										</TableCell>
										<TableCell align="right">
											<Tooltip title={t.common.delete}>
												<IconButton
													size="small"
													color="error"
													disabled={isPending}
													onClick={() => handleDelete(row.id)}
												>
													<DeleteIcon fontSize="small" />
												</IconButton>
											</Tooltip>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				)}
			</CardContent>
		</Card>
	);
};

export default ProjectPaymentScheduleCard;
