'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import { Add as AddIcon, Close as CloseIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { GridColDef, GridFilterModel, GridLogicOperator, GridRenderCellParams } from '@mui/x-data-grid';
import type { SessionProps } from '@/types/_initTypes';
import type { ProjectStatusRecordType } from '@/types/projectTypes';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import { Protected } from '@/components/layouts/protected/protected';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import { extractApiErrorMessage } from '@/utils/helpers';
import { PROJECT_STATUSES_ADD, PROJECT_STATUSES_EDIT } from '@/utils/routes';
import { useLanguage, useToast } from '@/utils/hooks';
import { STATUS_CHIP_COLORS, type StatusChipColor } from '@/utils/rawData';
import { useDeleteProjectStatusMutation, useGetProjectStatusesQuery } from '@/store/services/project';
import { useInitAccessToken } from '@/contexts/InitContext';

const ProjectStatusesListClient: React.FC<SessionProps> = ({ session }) => {
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
	const [showDeleteModal, setShowDeleteModal] = useState(false);

	const { data = [], isLoading } = useGetProjectStatusesQuery(undefined, { skip: !token });
	const [deleteProjectStatus] = useDeleteProjectStatusMutation();

	const filteredRows = useMemo(() => {
		if (!searchTerm.trim()) return data;
		const term = searchTerm.toLowerCase();
		return data.filter((row) => row.name.toLowerCase().includes(term) || row.color.toLowerCase().includes(term));
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
			await deleteProjectStatus({ id: selectedId! }).unwrap();
			onSuccess(t.projectStatuses.projectStatusDeletedSuccess);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.projectStatuses.projectStatusDeleteError));
		} finally {
			setShowDeleteModal(false);
		}
	};

	const deleteModalActions = [
		{
			text: t.common.cancel,
			active: false,
			onClick: () => setShowDeleteModal(false),
			icon: <CloseIcon />,
			color: '#6B6B6B',
		},
		{
			text: t.common.delete,
			active: true,
			onClick: deleteHandler,
			icon: <DeleteIcon />,
			color: '#D32F2F',
		},
	];

	const columns: GridColDef[] = [
		{
			field: 'name',
			headerName: t.common.name,
			flex: 1.2,
			minWidth: 150,
			renderCell: (params: GridRenderCellParams<ProjectStatusRecordType>) => (
				<DarkTooltip title={params.row.name}>
					<Chip
						label={params.row.name}
						size="small"
						color={(STATUS_CHIP_COLORS[params.row.name] ?? params.row.color ?? 'default') as StatusChipColor}
						variant="outlined"
					/>
				</DarkTooltip>
			),
		},
		{
			field: 'ordering',
			headerName: t.projectStatuses.ordering,
			flex: 0.5,
			minWidth: 80,
		},
		{
			field: 'is_active',
			headerName: t.projectStatuses.isActive,
			flex: 0.7,
			minWidth: 90,
			renderCell: (params: GridRenderCellParams<ProjectStatusRecordType>) => (
				<Typography variant="body2">{params.row.is_active ? t.common.yes : t.common.no}</Typography>
			),
		},
		{
			field: 'actions',
			headerName: t.common.actions,
			flex: 0.9,
			minWidth: 120,
			sortable: false,
			filterable: false,
			renderCell: (params) => (
				<MobileActionsMenu
					actions={[
						{
							label: t.common.edit,
							icon: <EditIcon />,
							onClick: () => router.push(PROJECT_STATUSES_EDIT(params.row.id)),
							color: 'primary',
						},
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
			<NavigationBar title={t.projectStatuses.projectStatusesList}>
				<Protected permission="can_view">
					<>
						<Box sx={{ display: 'flex', gap: 2, px: { xs: 1, sm: 2, md: 3 }, my: { xs: 1, sm: 2, md: 3 } }}>
							<Button variant="contained" onClick={() => router.push(PROJECT_STATUSES_ADD)} startIcon={<AddIcon fontSize="small" />}>
								{t.projectStatuses.newProjectStatus}
							</Button>
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
						/>
						{showDeleteModal && (
							<ActionModals
								title={t.projectStatuses.deleteProjectStatus}
								body={t.projectStatuses.deleteProjectStatusConfirm}
								actions={deleteModalActions}
								onClose={() => setShowDeleteModal(false)}
							/>
						)}
					</>
				</Protected>
			</NavigationBar>
		</Stack>
	);
};

export default ProjectStatusesListClient;
