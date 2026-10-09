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
	Build as BuildIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	Person as PersonIcon,
} from '@mui/icons-material';
import type { ApiErrorResponseType, ResponseDataInterface, SessionProps } from '@/types/_initTypes';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useDeleteSupplierMutation, useGetSupplierQuery } from '@/store/services/project';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import ApiAlert from '@/components/formikElements/apiLoading/apiAlert/apiAlert';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import { Protected } from '@/components/layouts/protected/protected';
import { PROJECTS_VIEW, SUPPLIERS_EDIT, SUPPLIERS_LIST } from '@/utils/routes';
import { extractApiErrorMessage, formatDate } from '@/utils/helpers';
import { useLanguage, useToast } from '@/utils/hooks';

import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { frFR, enUS } from '@mui/x-data-grid/locales';
import type { SupplierPaymentHistoryType } from '@/types/projectTypes';
import { getDefaultTheme } from '@/utils/themes';
import { useDataGridPagination } from '@/components/shared/paginatedDataGrid/useDataGridPagination';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import InfoRow from '@/components/shared/infoRow/infoRow';

const money = (value: string | number) => `${Number(value || 0).toLocaleString('fr-MA')} MAD`;

const SupplierViewClient: FC<SessionProps & { id: number }> = ({ session, id }) => {
	const { t, language } = useLanguage();
	const router = useRouter();
	const token = useInitAccessToken(session);
	const { data: supplier, isLoading, error } = useGetSupplierQuery({ id }, { skip: !token });
	const axiosError = error ? (error as ResponseDataInterface<ApiErrorResponseType>) : undefined;
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const [deleteSupplier] = useDeleteSupplierMutation();
	const { onSuccess, onError } = useToast();
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [paginationModel, setPaginationModel] = useDataGridPagination(10, 'supplier_payments');

	const columns: GridColDef<SupplierPaymentHistoryType>[] = [
		{
			field: 'date',
			headerName: t.common.date,
			type: 'date',
			minWidth: 175,
			valueGetter: (value) => (value ? new Date(value) : null),
			valueFormatter: (value: Date | null) => (value ? formatDate(value.toISOString()) : '—'),
		},
		{ field: 'project_name', headerName: t.common.project, flex: 1, minWidth: 200 },
		{ field: 'description', headerName: t.common.description, flex: 1.5, minWidth: 240 },
		{
			field: 'montant',
			headerName: t.common.amount,
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
							onClick: () => router.push(PROJECTS_VIEW(params.row.project)),
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
					await deleteSupplier({ id }).unwrap();
					onSuccess(t.suppliers.supplierDeletedSuccess);
					router.push(SUPPLIERS_LIST);
				} catch (err) {
					onError(extractApiErrorMessage(err, t.suppliers.supplierDeleteError));
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
			<NavigationBar title={t.suppliers.supplierDetails}>
				<Protected permission="can_view">
					<Stack spacing={3} sx={{ p: { xs: 2, md: 3 }, mt: 2 }}>
						<Stack direction={isMobile ? 'column' : 'row'} spacing={2} sx={{ justifyContent: 'space-between' }}>
							<Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(SUPPLIERS_LIST)}>
								{t.suppliers.suppliersList}
							</Button>
							{supplier && (
								<Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
									<Protected permission="can_edit">
										<Button
											variant="outlined"
											size="small"
											startIcon={<EditIcon />}
											onClick={() => router.push(SUPPLIERS_EDIT(id))}
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
						) : !supplier ? (
							<Alert severity="warning">{t.suppliers.supplierNotFound}</Alert>
						) : (
							<Stack spacing={3}>
								<Card elevation={2} sx={{ borderRadius: 2 }}>
									<CardContent sx={{ p: 3 }}>
										<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
											<BuildIcon color="primary" />
											<Typography variant="h6" sx={{ fontWeight: 700 }}>
												{supplier.nom}
											</Typography>
										</Stack>
										<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />
										<Stack spacing={0}>
											<InfoRow icon={<PersonIcon />} label={t.suppliers.contact} value={supplier.contact} />
											<Divider />
											<InfoRow icon={<BuildIcon />} label={t.suppliers.speciality} value={supplier.specialite} />
											<Divider />
											<InfoRow
												icon={<AttachMoneyIcon />}
												label={t.suppliers.totalPaid}
												value={
													<Typography color="primary" sx={{ fontWeight: 600 }}>
														{money(supplier.total_paid)}
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
												{t.suppliers.paymentsHistory}
											</Typography>
										</Stack>
										<Divider sx={{ mb: 3 }} />
										<ThemeProvider theme={getDefaultTheme()}>
											<Box sx={{ width: '100%', height: supplier.payments.length ? 430 : 320 }}>
												<DataGrid<SupplierPaymentHistoryType>
													rows={supplier.payments}
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
													}}
													disableRowSelectionOnClick
													onRowClick={(params) => router.push(PROJECTS_VIEW(params.row.project))}
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
					title={t.suppliers.deleteSupplier}
					body={t.suppliers.deleteSupplierConfirm}
					actions={deleteModalActions}
					titleIcon={<DeleteIcon />}
					titleIconColor="#D32F2F"
				/>
			)}
		</Stack>
	);
};

export default SupplierViewClient;
