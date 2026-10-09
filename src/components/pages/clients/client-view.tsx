'use client';

import { runWithCleanup } from '@/utils/runWithCleanup';
import { useState, type FC } from 'react';
import { useRouter } from 'next/navigation';
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
import { ThemeProvider } from '@/providers/scopedThemeProvider';
import {
	ArrowBack as ArrowBackIcon,
	History as HistoryIcon,
	Visibility as VisibilityIcon,
	AttachMoney as AttachMoneyIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	Email as EmailIcon,
	Home as HomeIcon,
	LocationCity as LocationCityIcon,
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

import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { frFR, enUS } from '@mui/x-data-grid/locales';
import type { ClientProjectHistoryType } from '@/types/projectTypes';
import { getDefaultTheme } from '@/utils/themes';
import { useDataGridPagination } from '@/components/shared/paginatedDataGrid/useDataGridPagination';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import InfoRow from '@/components/shared/infoRow/infoRow';

const money = (value: string | number) => `${Number(value || 0).toLocaleString('fr-MA')} MAD`;

const ClientViewClient: FC<SessionProps & { id: number }> = ({ session, id }) => {
	const { t, language } = useLanguage();
	const router = useRouter();
	const token = useInitAccessToken(session);
	const { data: client, isLoading, error } = useGetClientQuery({ id }, { skip: !token });
	const axiosError = error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined;
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const [deleteClient] = useDeleteClientMutation();
	const { onSuccess, onError } = useToast();
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [paginationModel, setPaginationModel] = useDataGridPagination(10, 'client_projects');

	const columns: GridColDef<ClientProjectHistoryType>[] = [
		{ field: 'nom', headerName: t.projects.projectName, flex: 1.5, minWidth: 200 },
		{
			field: 'status',
			headerName: t.common.status,
			type: 'singleSelect',
			valueOptions: [...new Set((client?.projects ?? []).map((project) => project.status))],
			flex: 1,
			minWidth: 150,
		},
		{
			field: 'date_debut',
			headerName: t.projects.dateDebut,
			type: 'date',
			minWidth: 175,
			valueGetter: (value) => (value ? new Date(value) : null),
			valueFormatter: (value: Date | null) => (value ? formatDate(value.toISOString()) : '—'),
		},
		{
			field: 'revenue_total',
			headerName: t.projects.totalRevenue,
			type: 'number',
			minWidth: 170,
			flex: 1,
			valueGetter: (value) => Number(value ?? 0),
			valueFormatter: (value) => money(value),
		},
		{
			field: 'depenses_totales',
			headerName: t.projects.totalExpenses,
			type: 'number',
			minWidth: 170,
			flex: 1,
			valueGetter: (value) => Number(value ?? 0),
			valueFormatter: (value) => money(value),
		},
		{
			field: 'benefice',
			headerName: t.projects.profit,
			type: 'number',
			minWidth: 160,
			flex: 1,
			valueGetter: (value) => Number(value ?? 0),
			valueFormatter: (value) => money(value),
		},

		{
			field: 'actions',
			headerName: t.common.actions,
			minWidth: 100,
			sortable: false,
			filterable: false,
			disableExport: true,
			renderCell: (params) => (
				<MobileActionsMenu
					actions={[
						{
							label: t.common.view,
							icon: <VisibilityIcon />,
							color: 'info',
							onClick: () => router.push(PROJECTS_VIEW(params.row.id)),
						},
					]}
				/>
			),
		},
	];

	const handleDelete = async () => {
		await runWithCleanup(
			async () => {
				try {
					await deleteClient({ id }).unwrap();
					onSuccess(t.clients.clientDeletedSuccess);
					router.push(CLIENTS_LIST);
				} catch (err) {
					onError(extractApiErrorMessage(err, t.clients.clientDeleteError));
				}
			},
			() => {
				setShowDeleteModal(false);
			},
		);
	};

	const deleteModalActions = [
		{
			text: t.common.cancel,
			active: false,
			onClick: () => setShowDeleteModal(false),
			icon: <ArrowBackIcon />,
			color: '#6B6B6B',
		},
		{ text: t.common.delete, active: true, onClick: handleDelete, icon: <DeleteIcon />, color: '#D32F2F' },
	];

	return (
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} sx={{ mt: '32px' }}>
			<NavigationBar title={t.clients.clientDetails}>
				<Protected permission="can_view">
					<Stack spacing={3} sx={{ p: { xs: 2, md: 3 }, mt: 2 }}>
						<Stack direction={isMobile ? 'column' : 'row'} spacing={2} sx={{ justifyContent: 'space-between' }}>
							<Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.back()}>
								{t.clients.clientsList}
							</Button>
							{client && (
								<Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
									<Protected permission="can_edit">
										<Button
											variant="outlined"
											size="small"
											startIcon={<EditIcon />}
											onClick={() => router.push(CLIENTS_EDIT(id))}
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
										<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
										<Stack spacing={0}>
											<InfoRow icon={<PhoneIcon />} label={t.common.phone} value={client.telephone} />
											<Divider />
											<InfoRow icon={<EmailIcon />} label={t.common.email} value={client.email} />
											<Divider />
											<InfoRow icon={<LocationCityIcon />} label={t.common.city} value={client.ville} />
											<Divider />
											<InfoRow icon={<HomeIcon />} label={t.common.address} value={client.adresse} />
											<Divider />
											<InfoRow
												icon={<AttachMoneyIcon />}
												label={t.clients.totalReceived}
												value={
													<Typography color="primary" sx={{ fontWeight: 600 }}>
														{money(client.total_encaisse)}
													</Typography>
												}
											/>
										</Stack>
									</CardContent>
								</Card>
								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
											<HistoryIcon color="primary" />
											<Typography variant="h6" sx={{ fontWeight: 700 }}>
												{t.clients.projectsHistory}
											</Typography>
										</Stack>
										<Divider sx={{ mb: 3 }} />
										<ThemeProvider theme={getDefaultTheme()}>
											<Box sx={{ width: '100%', height: client.projects.length ? 430 : 320 }}>
												<DataGrid<ClientProjectHistoryType>
													rows={client.projects}
													columns={columns}
													loading={isLoading}
													pagination
													paginationModel={paginationModel}
													onPaginationModelChange={setPaginationModel}
													onFilterModelChange={() =>
														setPaginationModel((current) => (current.page === 0 ? current : { ...current, page: 0 }))
													}
													pageSizeOptions={[5, 10, 25, 50, 100]}
													localeText={{
														...(language === 'fr' ? frFR : enUS).components.MuiDataGrid.defaultProps.localeText,
														noRowsLabel: t.projects.noProjectFound,
													}}
													disableRowSelectionOnClick
													onRowClick={(params) => router.push(PROJECTS_VIEW(params.row.id))}
													showToolbar
													slotProps={{ toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 500 } } }}
													sx={{
														'& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700 },
														'& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center' },
														'& .MuiDataGrid-row:hover': { cursor: 'pointer' },
													}}
												/>
											</Box>
										</ThemeProvider>
									</CardContent>
								</Card>
							</Stack>
						)}
					</Stack>
				</Protected>
			</NavigationBar>
			{showDeleteModal && (
				<ActionModals
					title={t.clients.deleteClient}
					body={t.clients.deleteClientConfirm}
					actions={deleteModalActions}
					titleIcon={<DeleteIcon />}
					titleIconColor="#D32F2F"
				/>
			)}
		</Stack>
	);
};

export default ClientViewClient;
