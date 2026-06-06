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
import type { ClientType } from '@/types/projectTypes';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import { Protected } from '@/components/layouts/protected/protected';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import { extractApiErrorMessage } from '@/utils/helpers';
import { CLIENTS_ADD, CLIENTS_EDIT, CLIENTS_VIEW } from '@/utils/routes';
import { useLanguage, useToast } from '@/utils/hooks';
import { useBulkDeleteClientsMutation, useDeleteClientMutation, useGetClientsQuery } from '@/store/services/project';
import { useInitAccessToken } from '@/contexts/InitContext';

const ClientsListClient: React.FC<SessionProps> = ({ session }) => {
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

	const { data = [], isLoading } = useGetClientsQuery({}, { skip: !token });
	const [deleteClient] = useDeleteClientMutation();
	const [bulkDeleteClients] = useBulkDeleteClientsMutation();

	const filteredRows = useMemo(() => {
		if (!searchTerm.trim()) return data;
		const term = searchTerm.toLowerCase();
		return data.filter(
			(row) =>
				row.nom.toLowerCase().includes(term) ||
				(row.telephone ?? '').toLowerCase().includes(term) ||
				(row.email ?? '').toLowerCase().includes(term) ||
				(row.adresse ?? '').toLowerCase().includes(term),
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
			await deleteClient({ id: selectedId! }).unwrap();
			onSuccess(t.clients.clientDeletedSuccess);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.clients.clientDeleteError));
		} finally {
			setShowDeleteModal(false);
		}
	};

	const bulkDeleteHandler = async () => {
		try {
			await bulkDeleteClients({ ids: selectedIds }).unwrap();
			onSuccess(t.clients.bulkClientsDeletedSuccess(selectedIds.length));
			setSelectedIds([]);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.clients.bulkClientsDeleteError));
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
			renderCell: (params: GridRenderCellParams<ClientType>) => (
				<DarkTooltip title={params.row.nom}>
					<Typography variant="body2" noWrap>
						{params.row.nom}
					</Typography>
				</DarkTooltip>
			),
		},
		{ field: 'telephone', headerName: t.common.phone, flex: 0.9, minWidth: 120 },
		{ field: 'email', headerName: t.common.email, flex: 1.2, minWidth: 180 },
		{
			field: 'total_encaisse',
			headerName: t.clients.totalReceived,
			flex: 0.9,
			minWidth: 120,
			renderCell: (params: GridRenderCellParams<ClientType>) => (
				<Typography variant="body2" noWrap>
					{Number(params.row.total_encaisse).toLocaleString('fr-MA')} MAD
				</Typography>
			),
		},
		{ field: 'projects_count', headerName: t.clients.projectsCount, flex: 0.7, minWidth: 110 },
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
						{ label: t.common.view, icon: <VisibilityIcon />, onClick: () => router.push(CLIENTS_VIEW(params.row.id)), color: 'info' },
						{ label: t.common.edit, icon: <EditIcon />, onClick: () => router.push(CLIENTS_EDIT(params.row.id)), color: 'primary' },
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
			<NavigationBar title={t.clients.clientsList}>
				<Protected permission="can_view">
					<>
						<Box sx={{ display: 'flex', gap: 2, px: { xs: 1, sm: 2, md: 3 }, my: { xs: 1, sm: 2, md: 3 }, flexWrap: 'wrap' }}>
							<Button variant="contained" onClick={() => router.push(CLIENTS_ADD)} startIcon={<AddIcon fontSize="small" />}>
								{t.clients.newClient}
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
						{showDeleteModal && <ActionModals title={t.clients.deleteClient} body={t.clients.deleteClientConfirm} actions={deleteModalActions} />}
						{showBulkDeleteModal && (
							<ActionModals
								title={t.clients.bulkDeleteClients(selectedIds.length)}
								body={t.clients.bulkDeleteClientsConfirm}
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

export default ClientsListClient;
