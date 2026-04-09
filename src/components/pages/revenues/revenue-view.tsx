'use client';

import React, { isValidElement, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useDeleteRevenueMutation, useGetRevenueQuery } from '@/store/services/project';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Divider,
	Stack,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import {
	ArrowBack as ArrowBackIcon,
	Assignment as AssignmentIcon,
	AttachMoney as AttachMoneyIcon,
	CalendarToday as CalendarTodayIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	Notes as NotesIcon,
	Person as PersonIcon,
} from '@mui/icons-material';
import { REVENUES_EDIT, REVENUES_LIST } from '@/utils/routes';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import { Protected } from '@/components/layouts/protected/protected';
import { extractApiErrorMessage, formatDate } from '@/utils/helpers';
import { useLanguage, useToast } from '@/utils/hooks';

interface InfoRowProps {
	icon: React.ReactNode;
	label: string;
	value: string | number | null | undefined | React.ReactNode;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const displayValue =
		isValidElement(value) || (value !== null && value !== undefined && value.toString().length > 0) ? value : '-';

	return (
		<Stack
			direction="row"
			spacing={2}
			sx={{
				alignItems: 'flex-start',
				py: 1.5,
				flexWrap: 'wrap',
			}}
		>
			<Box
				sx={{
					color: 'primary.main',
					display: 'flex',
					alignItems: 'center',
					minWidth: 40,
				}}
			>
				{icon}
			</Box>
			<Stack
				direction="row"
				spacing={isMobile ? 0 : 2}
				sx={{
					alignItems: 'center',
					flex: 1,
					flexWrap: 'wrap',
				}}
			>
				<Typography
					sx={{
						fontWeight: 600,
						color: 'text.secondary',
						minWidth: { xs: '100%', sm: 200 },
						wordBreak: 'break-word',
					}}
				>
					{label}
				</Typography>

				<Box sx={{ flex: 1 }}>
					{isValidElement(displayValue) ? (
						displayValue
					) : (
						<Typography sx={{ color: 'text.primary' }}>{displayValue}</Typography>
					)}
				</Box>
			</Stack>
		</Stack>
	);
};

interface Props extends SessionProps {
	id: number;
}

const RevenueViewClient: React.FC<Props> = ({ session, id }) => {
	const { t } = useLanguage();
	const router = useRouter();
	const token = useInitAccessToken(session);
	const { data: revenue, isLoading, error } = useGetRevenueQuery({ id }, { skip: !token });
	const axiosError = useMemo(
		() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined),
		[error],
	);
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	const [deleteRevenue] = useDeleteRevenueMutation();
	const { onSuccess, onError } = useToast();
	const [showDeleteModal, setShowDeleteModal] = useState(false);

	const handleDelete = async () => {
		try {
			await deleteRevenue({ id }).unwrap();
			onSuccess(t.revenues.revenueDeletedSuccess);
			router.push(REVENUES_LIST);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.revenues.revenueDeleteError));
		} finally {
			setShowDeleteModal(false);
		}
	};

	const deleteModalActions = [
		{
			text: t.common.cancel,
			active: false,
			onClick: () => setShowDeleteModal(false),
			icon: <ArrowBackIcon />,
			color: '#6B6B6B',
		},
		{
			text: t.common.delete,
			active: true,
			onClick: handleDelete,
			icon: <DeleteIcon />,
			color: '#D32F2F',
		},
	];

	return (
		<Stack
			direction="column"
			spacing={2}
			className={Styles.flexRootStack}
			sx={{
				mt: '32px',
			}}
		>
			<NavigationBar title={t.revenues.revenueDetails}>
				<Protected permission="can_view">
					<Stack spacing={3} sx={{ p: { xs: 2, md: 3 }, mt: 2 }}>
						<Stack
							direction={isMobile ? 'column' : 'row'}
							spacing={2}
							sx={{
								justifyContent: 'space-between',
								alignItems: isMobile ? 'stretch' : 'center',
							}}
						>
							<Button
								variant="outlined"
								startIcon={<ArrowBackIcon />}
								onClick={() => router.push(REVENUES_LIST)}
								sx={{ width: isMobile ? '100%' : 'auto' }}
							>
								{t.revenues.revenuesList}
							</Button>
							{!isLoading && !error && revenue && (
								<Stack
									direction="row"
									sx={{
										gap: 1,
										flexWrap: 'wrap',
									}}
								>
									<Protected permission="can_edit">
										<Button
											variant="outlined"
											size="small"
											startIcon={<EditIcon />}
											onClick={() => router.push(REVENUES_EDIT(id))}
										>
											{t.common.edit}
										</Button>
									</Protected>
									<Protected permission="can_delete">
										<Button
											variant="outlined"
											color="error"
											size="small"
											startIcon={<DeleteIcon />}
											onClick={() => setShowDeleteModal(true)}
										>
											{t.common.delete}
										</Button>
									</Protected>
								</Stack>
							)}
						</Stack>

						{isLoading ? (
							<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
						) : (axiosError?.status as number) > 400 ? (
							<ApiAlert
								errorDetails={axiosError?.data.details}
								cssStyle={{
									position: 'absolute',
									top: '50%',
									left: '50%',
									transform: 'translate(-50%, -50%)',
								}}
							/>
						) : !revenue ? (
							<Alert severity="warning">{t.revenues.revenueNotFound}</Alert>
						) : (
							<Stack spacing={3}>
								{/* Revenue Info */}
								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Stack
											direction="row"
											spacing={3}
											sx={{
												alignItems: 'center',
											}}
										>
											<AttachMoneyIcon color="primary" />
											<Typography
												variant="h6"
												sx={{
													fontWeight: 700,
												}}
											>
												{t.revenues.revenueNumber}
												{revenue.id}
											</Typography>
										</Stack>
										<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
										<Stack spacing={0}>
											<InfoRow icon={<AssignmentIcon />} label={t.common.project} value={revenue.project_name} />
											<Divider />
											<InfoRow
												icon={<AttachMoneyIcon />}
												label={t.common.amount}
												value={
													<Typography
														color="primary"
														sx={{
															fontWeight: 600,
														}}
													>
														{Number(revenue.montant).toLocaleString('fr-MA')} MAD
													</Typography>
												}
											/>
											<Divider />
											<InfoRow icon={<CalendarTodayIcon />} label={t.common.date} value={formatDate(revenue.date)} />
										</Stack>
									</CardContent>
								</Card>

								{/* Details */}
								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Stack
											direction="row"
											spacing={2}
											sx={{
												alignItems: 'center',
												mb: 2,
											}}
										>
											<NotesIcon color="primary" />
											<Typography
												variant="h6"
												sx={{
													fontWeight: 700,
												}}
											>
												{t.revenues.revenueDetails}
											</Typography>
										</Stack>
										<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
										<Stack spacing={0}>
											<InfoRow icon={<NotesIcon />} label={t.common.description} value={revenue.description} />
											<Divider />
											<InfoRow icon={<NotesIcon />} label={t.common.notes} value={revenue.notes} />
											<Divider />
											<InfoRow
												icon={<PersonIcon />}
												label={t.common.createdBy}
												value={revenue.created_by_user_name ?? '—'}
											/>
										</Stack>
									</CardContent>
								</Card>
							</Stack>
						)}
					</Stack>
				</Protected>
			</NavigationBar>
			{showDeleteModal && (
				<ActionModals
					title={t.revenues.deleteRevenue}
					body={t.revenues.deleteRevenueConfirm}
					actions={deleteModalActions}
					titleIcon={<DeleteIcon />}
					titleIconColor="#D32F2F"
				/>
			)}
		</Stack>
	);
};

export default RevenueViewClient;
