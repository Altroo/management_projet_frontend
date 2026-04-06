'use client';

import React, { isValidElement, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useDeleteProjectMutation, useGetProjectQuery } from '@/store/services/project';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
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
	Email as EmailIcon,
	Notes as NotesIcon,
	Person as PersonIcon,
	Phone as PhoneIcon,
	Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { PROJECTS_EDIT, PROJECTS_LIST } from '@/utils/routes';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import { Protected } from '@/components/layouts/protected/protected';
import { extractApiErrorMessage, formatDate } from '@/utils/helpers';
import { useToast, useLanguage } from '@/utils/hooks';
import { STATUS_CHIP_COLORS } from '@/utils/rawData';

interface InfoRowProps {
	icon: React.ReactNode;
	label: string;
	value: string | number | null | undefined | React.ReactNode;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const displayValue =
		isValidElement(value) || (value !== null && value !== undefined && value.toString().length > 0)
			? value
			: '-';

	return (
		<Stack
			direction="row"
			alignItems="flex-start"
			spacing={2}
			sx={{
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
				alignItems="center"
				spacing={isMobile ? 0 : 2}
				sx={{
					flex: 1,
					flexWrap: 'wrap',
				}}
			>
				<Typography
					fontWeight={600}
					color="text.secondary"
					sx={{
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

const ProjectViewClient: React.FC<Props> = ({ session, id }) => {
	const { t } = useLanguage();
	const router = useRouter();
	const token = useInitAccessToken(session);
	const { data: project, isLoading, error } = useGetProjectQuery({ id }, { skip: !token });
	const axiosError = useMemo(
		() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined),
		[error],
	);
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	const [deleteProject] = useDeleteProjectMutation();
	const { onSuccess, onError } = useToast();
	const [showDeleteModal, setShowDeleteModal] = useState(false);

	const handleDelete = async () => {
		try {
			await deleteProject({ id }).unwrap();
			onSuccess(t.projects.projectDeletedSuccess);
			router.push(PROJECTS_LIST);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.projects.projectDeleteError));
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

	const statusColor = STATUS_CHIP_COLORS[project?.status ?? ''] ?? 'default';

	return (
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} mt="32px">
			<NavigationBar title={t.projects.projectDetails}>
				<Protected permission="can_view">
					<Stack spacing={3} sx={{ p: { xs: 2, md: 3 }, mt: 2 }}>
						<Stack
							direction={isMobile ? 'column' : 'row'}
							justifyContent="space-between"
							alignItems={isMobile ? 'stretch' : 'center'}
							spacing={2}
						>
							<Button
								variant="outlined"
								startIcon={<ArrowBackIcon />}
								onClick={() => router.push(PROJECTS_LIST)}
								sx={{ width: isMobile ? '100%' : 'auto' }}
							>
								{t.projects.projectsList}
							</Button>
							{!isLoading && !error && project && (
								<Stack direction="row" gap={1} flexWrap="wrap">
									<Protected permission="can_edit">
										<Button
											variant="outlined"
											size="small"
											startIcon={<EditIcon />}
											onClick={() => router.push(PROJECTS_EDIT(id))}
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
						) : !project ? (
							<Alert severity="warning">{t.projects.projectNotFound}</Alert>
						) : (
							<Stack spacing={3}>
								{/* Identification */}
								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Stack direction="row" spacing={3} alignItems="center">
											<AssignmentIcon color="primary" />
											<Typography variant="h6" fontWeight={700}>
												{project.nom}
											</Typography>
										</Stack>
										<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
										<Stack spacing={0}>
											<InfoRow
												icon={<AssignmentIcon />}
												label={t.common.status}
												value={
													<Chip
														label={project.status}
														size="small"
														color={statusColor}
														variant="outlined"
													/>
												}
											/>
											<Divider />
											<InfoRow
												icon={<AttachMoneyIcon />}
												label={t.projects.budget}
												value={
													<Typography fontWeight={600} color="primary">
														{Number(project.budget_total).toLocaleString('fr-MA')} MAD
													</Typography>
												}
											/>
											<Divider />
											<InfoRow
												icon={<CalendarTodayIcon />}
												label={t.projects.dateDebut}
												value={formatDate(project.date_debut)}
											/>
											<Divider />
											<InfoRow
												icon={<CalendarTodayIcon />}
												label={t.projects.dateFin}
												value={formatDate(project.date_fin)}
											/>
											<Divider />
											<InfoRow
												icon={<ScheduleIcon />}
												label={t.projects.daysRemaining}
												value={project.jours_restants}
											/>
											<Divider />
											<InfoRow
												icon={<PersonIcon />}
												label={t.projects.projectManager}
												value={project.chef_de_projet}
											/>
										</Stack>
									</CardContent>
								</Card>

								{/* Financial Info */}
								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
											<AttachMoneyIcon color="primary" />
											<Typography variant="h6" fontWeight={700}>
												{t.projects.financialInfo}
											</Typography>
										</Stack>
										<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
										<Stack spacing={0}>
											<InfoRow
												icon={<AttachMoneyIcon />}
												label={t.projects.totalRevenue}
												value={`${Number(project.revenue_total).toLocaleString('fr-MA')} MAD`}
											/>
											<Divider />
											<InfoRow
												icon={<AttachMoneyIcon />}
												label={t.projects.totalExpenses}
												value={`${Number(project.depenses_totales).toLocaleString('fr-MA')} MAD`}
											/>
											<Divider />
											<InfoRow
												icon={<AttachMoneyIcon />}
												label={t.projects.profit}
												value={`${Number(project.benefice).toLocaleString('fr-MA')} MAD`}
											/>
											<Divider />
											<InfoRow
												icon={<AttachMoneyIcon />}
												label={t.projects.margin}
												value={`${project.marge}%`}
											/>
										</Stack>
									</CardContent>
								</Card>

								{/* Client Info */}
								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
											<PersonIcon color="primary" />
											<Typography variant="h6" fontWeight={700}>
												{t.projects.clientInfo}
											</Typography>
										</Stack>
										<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
										<Stack spacing={0}>
											<InfoRow
												icon={<PersonIcon />}
												label={t.projects.clientName}
												value={project.nom_client}
											/>
											<Divider />
											<InfoRow
												icon={<PhoneIcon />}
												label={t.projects.clientPhone}
												value={project.telephone_client}
											/>
											<Divider />
											<InfoRow
												icon={<EmailIcon />}
												label={t.projects.clientEmail}
												value={project.email_client}
											/>
										</Stack>
									</CardContent>
								</Card>

								{/* Notes & Details */}
								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
											<NotesIcon color="primary" />
											<Typography variant="h6" fontWeight={700}>
												{t.projects.projectDetails}
											</Typography>
										</Stack>
										<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
										<Stack spacing={0}>
											<InfoRow
												icon={<NotesIcon />}
												label={t.common.description}
												value={project.description}
											/>
											<Divider />
											<InfoRow
												icon={<NotesIcon />}
												label={t.common.notes}
												value={project.notes}
											/>
											<Divider />
											<InfoRow
												icon={<PersonIcon />}
												label={t.common.createdBy}
												value={project.created_by_user_name ?? '—'}
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
					title={t.projects.deleteProject}
					body={t.projects.deleteProjectConfirm}
					actions={deleteModalActions}
					titleIcon={<DeleteIcon />}
					titleIconColor="#D32F2F"
				/>
			)}
		</Stack>
	);
};

export default ProjectViewClient;
