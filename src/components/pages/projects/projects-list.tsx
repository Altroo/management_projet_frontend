'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import {
	Add as AddIcon,
	Close as CloseIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { GridColDef, GridFilterModel, GridLogicOperator, GridRenderCellParams } from '@mui/x-data-grid';
import type { SessionProps } from '@/types/_initTypes';
import type { ProjectListType } from '@/types/projectTypes';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import { Protected } from '@/components/layouts/protected/protected';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import type { ChipFilterConfig } from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import ChipSelectFilterBar from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import { createDateRangeFilterOperator } from '@/components/shared/dateRangeFilter/dateRangeFilterOperator';
import { createNumericFilterOperators } from '@/components/shared/numericFilter/numericFilterOperator';
import { createDropdownFilterOperators } from '@/components/shared/dropdownFilter/dropdownFilter';
import { extractApiErrorMessage, formatDate } from '@/utils/helpers';
import { PROJECTS_ADD, PROJECTS_EDIT, PROJECTS_VIEW } from '@/utils/routes';
import { useLanguage, useToast } from '@/utils/hooks';
import {
	useBulkDeleteProjectsMutation,
	useDeleteProjectMutation,
	useGetProjectsListQuery,
} from '@/store/services/project';
import { useInitAccessToken } from '@/contexts/InitContext';
import { projectStatusItemsList, STATUS_CHIP_COLORS } from '@/utils/rawData';

const ProjectsListClient: React.FC<SessionProps> = ({ session }) => {
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
	const [chipFilterParams, setChipFilterParams] = useState<Record<string, string>>({});
	const [, setCustomFilterParams] = useState<Record<string, string>>({});

	const { data: projectsData, isLoading } = useGetProjectsListQuery(
		{
			with_pagination: true,
			page: paginationModel.page + 1,
			pageSize: paginationModel.pageSize,
			search: searchTerm || undefined,
			status: chipFilterParams['status'] || undefined,
		},
		{ skip: !token },
	);

	const [deleteProject] = useDeleteProjectMutation();
	const [bulkDeleteProjects] = useBulkDeleteProjectsMutation();

	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

	const paginatedData = useMemo(() => {
		if (!projectsData) return { count: 0, results: [] };
		if ('results' in projectsData) return projectsData;
		return { count: projectsData.length, results: projectsData };
	}, [projectsData]);

	const createdByOptions = useMemo(() => {
		const nameMap = new Map<string, string>();
		(paginatedData.results ?? []).forEach((p) => {
			if (p.created_by_user_name) nameMap.set(p.created_by_user_name, p.created_by_user_name);
		});
		return Array.from(nameMap.values()).map((name) => ({ value: name, label: name }));
	}, [paginatedData.results]);

	const deleteHandler = async () => {
		try {
			await deleteProject({ id: selectedId! }).unwrap();
			onSuccess(t.projects.projectDeletedSuccess);
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

	const bulkDeleteHandler = async () => {
		try {
			await bulkDeleteProjects({ ids: selectedIds }).unwrap();
			onSuccess(t.projects.bulkProjectsDeletedSuccess(selectedIds.length));
			setSelectedIds([]);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.projects.bulkProjectsDeleteError));
		} finally {
			setShowBulkDeleteModal(false);
		}
	};

	const bulkDeleteModalActions = [
		{
			text: t.common.cancel,
			active: false,
			onClick: () => setShowBulkDeleteModal(false),
			icon: <CloseIcon />,
			color: '#6B6B6B',
		},
		{
			text: `${t.common.delete} (${selectedIds.length})`,
			active: true,
			onClick: bulkDeleteHandler,
			icon: <DeleteIcon />,
			color: '#D32F2F',
		},
	];

	const chipFilters = useMemo<ChipFilterConfig[]>(
		() => [
			{
				key: 'status',
				label: t.common.status,
				paramName: 'status',
				options: projectStatusItemsList(t).map((s) => ({ id: s.code, nom: s.value })),
			},
		],
		[t],
	);

	const columns: GridColDef[] = [
		{
			field: 'nom',
			headerName: t.projects.projectName,
			flex: 1.4,
			minWidth: 150,
			renderCell: (params: GridRenderCellParams<ProjectListType>) => (
				<DarkTooltip title={params.value ?? ''}>
					<Typography variant="body2" noWrap>
						{params.value}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'status',
			headerName: t.common.status,
			flex: 0.9,
			minWidth: 120,
			filterable: false,
			renderCell: (params: GridRenderCellParams<ProjectListType>) => {
				const status = params.value as string;
				return (
					<DarkTooltip title={status}>
						<Chip label={status} size="small" color={STATUS_CHIP_COLORS[status] ?? 'default'} variant="outlined" />
					</DarkTooltip>
				);
			},
		},
		{
			field: 'budget_total',
			headerName: t.projects.budget,
			flex: 0.9,
			minWidth: 110,
			filterOperators: createNumericFilterOperators(),
			renderCell: (params: GridRenderCellParams<ProjectListType>) => (
				<DarkTooltip title={`${Number(params.value).toLocaleString('fr-MA')} MAD`}>
					<Typography variant="body2" noWrap>
						{Number(params.value).toLocaleString('fr-MA')} MAD
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'date_debut',
			headerName: t.projects.dateDebut,
			flex: 0.9,
			minWidth: 110,
			filterOperators: createDateRangeFilterOperator(),
			renderCell: (params: GridRenderCellParams<ProjectListType>) => (
				<DarkTooltip title={formatDate(params.value as string)}>
					<Typography variant="body2" noWrap>
						{formatDate(params.value as string)}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'date_fin',
			headerName: t.projects.dateFin,
			flex: 0.9,
			minWidth: 110,
			filterOperators: createDateRangeFilterOperator(),
			renderCell: (params: GridRenderCellParams<ProjectListType>) => (
				<DarkTooltip title={formatDate(params.value as string)}>
					<Typography variant="body2" noWrap>
						{formatDate(params.value as string)}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'chef_de_projet',
			headerName: t.projects.projectManager,
			flex: 1,
			minWidth: 120,
			renderCell: (params: GridRenderCellParams<ProjectListType>) => (
				<DarkTooltip title={params.value ?? ''}>
					<Typography variant="body2" noWrap>
						{params.value}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'created_by_user_name',
			headerName: t.common.createdBy,
			flex: 1,
			minWidth: 100,
			filterOperators: createDropdownFilterOperators(createdByOptions, t.filters.allUsers),
			renderCell: (params: GridRenderCellParams<ProjectListType>) => (
				<DarkTooltip title={params.value ?? ''}>
					<Typography variant="body2" noWrap>
						{params.value ?? '—'}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'actions',
			headerName: t.common.actions,
			flex: 1.2,
			minWidth: 130,
			sortable: false,
			filterable: false,
			renderCell: (params) => {
				const actions = [
					{
						label: t.common.view,
						icon: <VisibilityIcon />,
						onClick: () => router.push(PROJECTS_VIEW(params.row.id)),
						color: 'info' as const,
					},
					{
						label: t.common.edit,
						icon: <EditIcon />,
						onClick: () => router.push(PROJECTS_EDIT(params.row.id)),
						color: 'primary' as const,
					},
					{
						label: t.common.delete,
						icon: <DeleteIcon />,
						onClick: () => {
							setSelectedId(params.row.id);
							setShowDeleteModal(true);
						},
						color: 'error' as const,
					},
				];
				return <MobileActionsMenu actions={actions} />;
			},
		},
	];

	return (
		<Stack
			direction="column"
			spacing={2}
			className={Styles.flexRootStack}
			sx={{
				mt: '48px',
				overflowX: 'auto',
				overflowY: 'hidden',
			}}
		>
			<NavigationBar title={t.projects.projectsList}>
				<Protected permission="can_view">
					<>
						<Box
							sx={{
								width: '100%',
								display: 'flex',
								justifyContent: 'flex-start',
								gap: 2,
								px: { xs: 1, sm: 2, md: 3 },
								mt: { xs: 1, sm: 2, md: 3 },
								mb: { xs: 1, sm: 2, md: 3 },
								flexWrap: 'wrap',
								alignItems: 'center',
							}}
						>
							<Button
								variant="contained"
								onClick={() => router.push(PROJECTS_ADD)}
								startIcon={<AddIcon fontSize="small" />}
								sx={{
									whiteSpace: 'nowrap',
									px: { xs: 1.5, sm: 2, md: 3 },
									py: { xs: 0.8, sm: 1, md: 1 },
									fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
								}}
							>
								{t.projects.newProject}
							</Button>
							{selectedIds.length > 0 && (
								<Button
									variant="outlined"
									color="error"
									onClick={() => setShowBulkDeleteModal(true)}
									startIcon={<DeleteIcon fontSize="small" />}
									sx={{ whiteSpace: 'nowrap' }}
								>
									{t.common.delete} ({selectedIds.length})
								</Button>
							)}
						</Box>

						<ChipSelectFilterBar filters={chipFilters} onFilterChange={setChipFilterParams} columns={1} />

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
							onCustomFilterParamsChange={setCustomFilterParams}
							checkboxSelection
							onSelectionChange={setSelectedIds}
							selectedIds={selectedIds}
						/>

						{showDeleteModal && (
							<ActionModals
								title={t.projects.deleteProject}
								body={t.projects.deleteProjectConfirm}
								actions={deleteModalActions}
							/>
						)}

						{showBulkDeleteModal && (
							<ActionModals
								title={t.projects.bulkDeleteProjects(selectedIds.length)}
								body={t.projects.bulkDeleteProjectsConfirm}
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

export default ProjectsListClient;
