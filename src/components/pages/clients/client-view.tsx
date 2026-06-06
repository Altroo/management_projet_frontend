'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Alert,
	Button,
	Card,
	CardContent,
	Divider,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import {
	ArrowBack as ArrowBackIcon,
	AttachMoney as AttachMoneyIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	Email as EmailIcon,
	Home as HomeIcon,
	Person as PersonIcon,
	Phone as PhoneIcon,
} from '@mui/icons-material';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useDeleteClientMutation, useGetClientQuery } from '@/store/services/project';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import { Protected } from '@/components/layouts/protected/protected';
import { CLIENTS_EDIT, CLIENTS_LIST, PROJECTS_VIEW } from '@/utils/routes';
import { extractApiErrorMessage, formatDate } from '@/utils/helpers';
import { useLanguage, useToast } from '@/utils/hooks';

const money = (value: string | number) => `${Number(value || 0).toLocaleString('fr-MA')} MAD`;

const ClientViewClient: React.FC<SessionProps & { id: number }> = ({ session, id }) => {
	const { t } = useLanguage();
	const router = useRouter();
	const token = useInitAccessToken(session);
	const { data: client, isLoading, error } = useGetClientQuery({ id }, { skip: !token });
	const axiosError = useMemo(() => (error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined), [error]);
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const [deleteClient] = useDeleteClientMutation();
	const { onSuccess, onError } = useToast();
	const [showDeleteModal, setShowDeleteModal] = useState(false);

	const handleDelete = async () => {
		try {
			await deleteClient({ id }).unwrap();
			onSuccess(t.clients.clientDeletedSuccess);
			router.push(CLIENTS_LIST);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.clients.clientDeleteError));
		} finally {
			setShowDeleteModal(false);
		}
	};

	const deleteModalActions = [
		{ text: t.common.cancel, active: false, onClick: () => setShowDeleteModal(false), icon: <ArrowBackIcon />, color: '#6B6B6B' },
		{ text: t.common.delete, active: true, onClick: handleDelete, icon: <DeleteIcon />, color: '#D32F2F' },
	];

	return (
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} sx={{ mt: '32px' }}>
			<NavigationBar title={t.clients.clientDetails}>
				<Protected permission="can_view">
					<Stack spacing={3} sx={{ p: { xs: 2, md: 3 }, mt: 2 }}>
						<Stack direction={isMobile ? 'column' : 'row'} spacing={2} sx={{ justifyContent: 'space-between' }}>
							<Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(CLIENTS_LIST)}>
								{t.clients.clientsList}
							</Button>
							{client && (
								<Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
									<Protected permission="can_edit">
										<Button variant="outlined" size="small" startIcon={<EditIcon />} onClick={() => router.push(CLIENTS_EDIT(id))}>
											{t.common.edit}
										</Button>
									</Protected>
									<Protected permission="can_delete">
										<Button variant="outlined" color="error" size="small" startIcon={<DeleteIcon />} onClick={() => setShowDeleteModal(true)}>
											{t.common.delete}
										</Button>
									</Protected>
								</Stack>
							)}
						</Stack>
						{isLoading ? (
							<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
						) : (axiosError?.status as number) > 400 ? (
							<ApiAlert errorDetails={axiosError?.data.details} />
						) : !client ? (
							<Alert severity="warning">{t.clients.clientNotFound}</Alert>
						) : (
							<Stack spacing={3}>
								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
											<PersonIcon color="primary" />
											<Typography variant="h6" sx={{ fontWeight: 700 }}>
												{client.nom}
											</Typography>
										</Stack>
										<Divider sx={{ mb: 2 }} />
										<Stack spacing={1.5}>
											<Typography><PhoneIcon fontSize="small" /> {client.telephone || '-'}</Typography>
											<Typography><EmailIcon fontSize="small" /> {client.email || '-'}</Typography>
											<Typography><HomeIcon fontSize="small" /> {client.adresse || '-'}</Typography>
											<Typography sx={{ fontWeight: 700 }}><AttachMoneyIcon fontSize="small" /> {t.clients.totalReceived}: {money(client.total_encaisse)}</Typography>
										</Stack>
									</CardContent>
								</Card>
								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
											{t.clients.projectsHistory}
										</Typography>
										<TableContainer>
											<Table size="small">
												<TableHead>
													<TableRow>
														<TableCell>{t.projects.projectName}</TableCell>
														<TableCell>{t.common.status}</TableCell>
														<TableCell>{t.projects.dateDebut}</TableCell>
														<TableCell align="right">{t.projects.totalRevenue}</TableCell>
														<TableCell align="right">{t.projects.totalExpenses}</TableCell>
														<TableCell align="right">{t.projects.profit}</TableCell>
													</TableRow>
												</TableHead>
												<TableBody>
													{client.projects.length === 0 ? (
														<TableRow>
															<TableCell colSpan={6}>{t.projects.noProjectFound}</TableCell>
														</TableRow>
													) : (
														client.projects.map((project) => (
															<TableRow key={project.id} hover sx={{ cursor: 'pointer' }} onClick={() => router.push(PROJECTS_VIEW(project.id))}>
																<TableCell>{project.nom}</TableCell>
																<TableCell>{project.status}</TableCell>
																<TableCell>{formatDate(project.date_debut)}</TableCell>
																<TableCell align="right">{money(project.revenue_total)}</TableCell>
																<TableCell align="right">{money(project.depenses_totales)}</TableCell>
																<TableCell align="right">{money(project.benefice)}</TableCell>
															</TableRow>
														))
													)}
												</TableBody>
											</Table>
										</TableContainer>
									</CardContent>
								</Card>
							</Stack>
						)}
					</Stack>
				</Protected>
			</NavigationBar>
			{showDeleteModal && (
				<ActionModals title={t.clients.deleteClient} body={t.clients.deleteClientConfirm} actions={deleteModalActions} titleIcon={<DeleteIcon />} titleIconColor="#D32F2F" />
			)}
		</Stack>
	);
};

export default ClientViewClient;
