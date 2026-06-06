'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Stack, Typography } from '@mui/material';
import {
	Add as AddIcon,
	Close as CloseIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { GridColDef, GridFilterModel, GridLogicOperator, GridRenderCellParams } from '@mui/x-data-grid';
import type { SessionProps } from '@/types/_initTypes';
import type { SupplierType } from '@/types/projectTypes';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import { Protected } from '@/components/layouts/protected/protected';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import { extractApiErrorMessage } from '@/utils/helpers';
import { SUPPLIERS_ADD, SUPPLIERS_EDIT, SUPPLIERS_VIEW } from '@/utils/routes';
import { useLanguage, useToast } from '@/utils/hooks';
import { useBulkDeleteSuppliersMutation, useDeleteSupplierMutation, useGetSuppliersQuery } from '@/store/services/project';
import { useInitAccessToken } from '@/contexts/InitContext';

const SuppliersListClient: React.FC<SessionProps> = ({ session }) => {
	const router = useRouter();
	const { t } = useLanguage();
	const { onSuccess, onError } = useToast();
	const token = useInitAccessToken(session);
	const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
	const [searchTerm, setSearchTerm] = useState('');
	const [filterModel, setFilterModel] = useState<GridFilterModel>({
		items: [],
		logicOperator: GridLogicOperator.And,
	});
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

	const { data = [], isLoading } = useGetSuppliersQuery({}, { skip: !token });
	const [deleteSupplier] = useDeleteSupplierMutation();
	const [bulkDeleteSuppliers] = useBulkDeleteSuppliersMutation();

	const filteredRows = useMemo(() => {
		if (!searchTerm.trim()) return data;
		const term = searchTerm.toLowerCase();
		return data.filter(
			(row) =>
				row.nom.toLowerCase().includes(term) ||
				(row.contact ?? '').toLowerCase().includes(term) ||
				(row.specialite ?? '').toLowerCase().includes(term),
		);
	}, [data, searchTerm]);

	const paginatedData = useMemo(() => {
		const start = paginationModel.page * paginationModel.pageSize;
		return {
			count: filteredRows.length,
			results: filteredRows.slice(start, start + paginationModel.pageSize),
		};
	}, [filteredRows, paginationModel]);

	const deleteHandler = async () => {
		try {
			await deleteSupplier({ id: selectedId! }).unwrap();
			onSuccess(t.suppliers.supplierDeletedSuccess);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.suppliers.supplierDeleteError));
		} finally {
			setShowDeleteModal(false);
		}
	};

	const bulkDeleteHandler = async () => {
		try {
			await bulkDeleteSuppliers({ ids: selectedIds }).unwrap();
			onSuccess(t.suppliers.bulkSuppliersDeletedSuccess(selectedIds.length));
			setSelectedIds([]);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.suppliers.bulkSuppliersDeleteError));
		} finally {
			setShowBulkDeleteModal(false);
		}
	};

	const deleteModalActions = [
		{ text: t.common.cancel, active: false, onClick: () => setShowDeleteModal(false), icon: <CloseIcon />, color: '#6B6B6B' },
		{ text: t.common.delete, active: true, onClick: deleteHandler, icon: <DeleteIcon />, color: '#D32F2F' },
	];

	const bulkDeleteModalActions = [
		{ text: t.common.cancel, active: false, onClick: () => setShowBulkDeleteModal(false), icon: <CloseIcon />, color: '#6B6B6B' },
		{ text: `${t.common.delete} (${selectedIds.length})`, active: true, onClick: bulkDeleteHandler, icon: <DeleteIcon />, color: '#D32F2F' },
	];

	const columns: GridColDef[] = [
		{
			field: 'nom',
			headerName: t.common.name,
			flex: 1.2,
			minWidth: 160,
			renderCell: (params: GridRenderCellParams<SupplierType>) => (
				<DarkTooltip title={params.row.nom}>
					<Typography variant="body2" noWrap>
						{params.row.nom}
					</Typography>
				</DarkTooltip>
			),
		},
		{ field: 'contact', headerName: t.suppliers.contact, flex: 1, minWidth: 150 },
		{ field: 'specialite', headerName: t.suppliers.speciality, flex: 1, minWidth: 150 },
		{
			field: 'total_paid',
			headerName: t.suppliers.totalPaid,
			flex: 0.9,
			minWidth: 120,
			renderCell: (params: GridRenderCellParams<SupplierType>) => (
				<Typography variant="body2" noWrap>
					{Number(params.row.total_paid).toLocaleString('fr-MA')} MAD
				</Typography>
			),
		},
		{ field: 'payments_count', headerName: t.suppliers.paymentsCount, flex: 0.7, minWidth: 120 },
		{
			field: 'actions',
			headerName: t.common.actions,
			flex: 1,
			minWidth: 130,
			sortable: false,
			filterable: false,
			renderCell: (params) => (
				<MobileActionsMenu
					actions={[
						{ label: t.common.view, icon: <VisibilityIcon />, onClick: () => router.push(SUPPLIERS_VIEW(params.row.id)), color: 'info' },
						{ label: t.common.edit, icon: <EditIcon />, onClick: () => router.push(SUPPLIERS_EDIT(params.row.id)), color: 'primary' },
						{
							label: t.common.delete,
							icon: <DeleteIcon />,
							onClick: () => {
								setSelectedId(params.row.id);
								setShowDeleteModal(true);
							},
							color: 'error',
						},
					]}
				/>
			),
		},
	];

	return (
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} sx={{ mt: '48px', overflowX: 'auto' }}>
			<NavigationBar title={t.suppliers.suppliersList}>
				<Protected permission="can_view">
					<>
						<Box sx={{ display: 'flex', gap: 2, px: { xs: 1, sm: 2, md: 3 }, my: { xs: 1, sm: 2, md: 3 }, flexWrap: 'wrap' }}>
							<Button variant="contained" onClick={() => router.push(SUPPLIERS_ADD)} startIcon={<AddIcon fontSize="small" />}>
								{t.suppliers.newSupplier}
							</Button>
							{selectedIds.length > 0 && (
								<Button variant="outlined" color="error" onClick={() => setShowBulkDeleteModal(true)} startIcon={<DeleteIcon fontSize="small" />}>
									{t.common.delete} ({selectedIds.length})
								</Button>
							)}
						</Box>
						<PaginatedDataGrid
							data={paginatedData}
							isLoading={isLoading}
							columns={columns}
							paginationModel={paginationModel}
							setPaginationModel={setPaginationModel}
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
							filterModel={filterModel}
							onFilterModelChange={setFilterModel}
							checkboxSelection
							onSelectionChange={setSelectedIds}
							selectedIds={selectedIds}
						/>
						{showDeleteModal && <ActionModals title={t.suppliers.deleteSupplier} body={t.suppliers.deleteSupplierConfirm} actions={deleteModalActions} />}
						{showBulkDeleteModal && (
							<ActionModals
								title={t.suppliers.bulkDeleteSuppliers(selectedIds.length)}
								body={t.suppliers.bulkDeleteSuppliersConfirm}
								actions={bulkDeleteModalActions}
								onClose={() => setShowBulkDeleteModal(false)}
							/>
						)}
					</>
				</Protected>
			</NavigationBar>
		</Stack>
	);
};

export default SuppliersListClient;
