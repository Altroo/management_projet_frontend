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
import type { RevenueType } from '@/types/projectTypes';
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
import { REVENUES_ADD, REVENUES_EDIT, REVENUES_VIEW } from '@/utils/routes';
import { useLanguage, useToast } from '@/utils/hooks';
import {
	useBulkDeleteRevenuesMutation,
	useDeleteRevenueMutation,
	useGetProjectsListQuery,
	useGetRevenuesQuery,
} from '@/store/services/project';
import { useInitAccessToken } from '@/contexts/InitContext';

const RevenuesListClient: React.FC<SessionProps> = ({ session }) => {
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
	const [customFilterParams, setCustomFilterParams] = useState<Record<string, string>>({});

	const { data: revenues, isLoading } = useGetRevenuesQuery({}, { skip: !token });
	const { data: projectsData } = useGetProjectsListQuery({}, { skip: !token });

	const projectOptions = useMemo(() => {
		const projects = Array.isArray(projectsData)
			? projectsData
			: projectsData && 'results' in projectsData
				? projectsData.results
				: [];
		return projects.map((p) => ({ id: String(p.id), nom: p.nom }));
	}, [projectsData]);

	const [deleteRevenue] = useDeleteRevenueMutation();
	const [bulkDeleteRevenues] = useBulkDeleteRevenuesMutation();

	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

	const createdByOptions = useMemo(() => {
		const nameMap = new Map<string, string>();
		(revenues ?? []).forEach((r) => {
			if (r.created_by_user_name) nameMap.set(r.created_by_user_name, r.created_by_user_name);
		});
		return Array.from(nameMap.values()).map((name) => ({ value: name, label: name }));
	}, [revenues]);

	const filteredRevenues = useMemo(() => {
		let result = revenues ?? [];

		const projectParam = chipFilterParams['project'];
		if (projectParam) {
			const projectIds = projectParam.split(',').map(Number);
			result = result.filter((r) => projectIds.includes(r.project));
		}

		if (searchTerm.trim()) {
			const term = searchTerm.toLowerCase();
			result = result.filter(
				(r) =>
					(r.description ?? '').toLowerCase().includes(term) ||
					(r.project_name ?? '').toLowerCase().includes(term) ||
					(r.created_by_user_name ?? '').toLowerCase().includes(term),
			);
		}

		if (customFilterParams['montant'] !== undefined && customFilterParams['montant'] !== '') {
			const val = Number(customFilterParams['montant']);
			result = result.filter((r) => Number(r.montant) === val);
		}
		if (customFilterParams['montant__gt'] !== undefined && customFilterParams['montant__gt'] !== '') {
			const val = Number(customFilterParams['montant__gt']);
			result = result.filter((r) => Number(r.montant) > val);
		}
		if (customFilterParams['montant__gte'] !== undefined && customFilterParams['montant__gte'] !== '') {
			const val = Number(customFilterParams['montant__gte']);
			result = result.filter((r) => Number(r.montant) >= val);
		}
		if (customFilterParams['montant__lt'] !== undefined && customFilterParams['montant__lt'] !== '') {
			const val = Number(customFilterParams['montant__lt']);
			result = result.filter((r) => Number(r.montant) < val);
		}
		if (customFilterParams['montant__lte'] !== undefined && customFilterParams['montant__lte'] !== '') {
			const val = Number(customFilterParams['montant__lte']);
			result = result.filter((r) => Number(r.montant) <= val);
		}

		if (customFilterParams['date_after']) {
			const after = new Date(customFilterParams['date_after']);
			result = result.filter((r) => new Date(r.date) >= after);
		}
		if (customFilterParams['date_before']) {
			const before = new Date(customFilterParams['date_before']);
			result = result.filter((r) => new Date(r.date) <= before);
		}

		if (customFilterParams['created_by_user_name']) {
			result = result.filter((r) => r.created_by_user_name === customFilterParams['created_by_user_name']);
		}

		return result;
	}, [revenues, chipFilterParams, searchTerm, customFilterParams]);

	const paginatedData = useMemo(() => {
		const start = paginationModel.page * paginationModel.pageSize;
		return {
			count: filteredRevenues.length,
			results: filteredRevenues.slice(start, start + paginationModel.pageSize),
		};
	}, [filteredRevenues, paginationModel]);

	const totalAmount = filteredRevenues.reduce((sum, r) => sum + Number(r.montant), 0);

	const deleteHandler = async () => {
		try {
			await deleteRevenue({ id: selectedId! }).unwrap();
			onSuccess(t.revenues.revenueDeletedSuccess);
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
			await bulkDeleteRevenues({ ids: selectedIds }).unwrap();
			onSuccess(t.revenues.bulkRevenuesDeletedSuccess(selectedIds.length));
			setSelectedIds([]);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.revenues.bulkRevenuesDeleteError));
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
				key: 'project',
				label: t.common.project,
				paramName: 'project',
				options: projectOptions,
			},
		],
		[t, projectOptions],
	);

	const columns: GridColDef[] = [
		{
			field: 'description',
			headerName: t.common.description,
			flex: 1.4,
			minWidth: 150,
			renderCell: (params: GridRenderCellParams<RevenueType>) => (
				<DarkTooltip title={params.value ?? ''}>
					<Typography variant="body2" noWrap>
						{params.value}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'project_name',
			headerName: t.common.project,
			flex: 1,
			minWidth: 120,
			filterable: false,
			renderCell: (params: GridRenderCellParams<RevenueType>) => (
				<DarkTooltip title={params.value ?? ''}>
					<Typography variant="body2" noWrap>
						{params.value}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'montant',
			headerName: t.common.amount,
			flex: 0.9,
			minWidth: 110,
			filterOperators: createNumericFilterOperators(),
			renderCell: (params: GridRenderCellParams<RevenueType>) => (
				<DarkTooltip title={`${Number(params.value).toLocaleString('fr-MA')} MAD`}>
					<Typography variant="body2" noWrap>
						{Number(params.value).toLocaleString('fr-MA')} MAD
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'date',
			headerName: t.common.date,
			flex: 0.9,
			minWidth: 110,
			filterOperators: createDateRangeFilterOperator(),
			renderCell: (params: GridRenderCellParams<RevenueType>) => (
				<DarkTooltip title={formatDate(params.value as string)}>
					<Typography variant="body2" noWrap>
						{formatDate(params.value as string)}
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
			renderCell: (params: GridRenderCellParams<RevenueType>) => (
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
						onClick: () => router.push(REVENUES_VIEW(params.row.id)),
						color: 'info' as const,
					},
					{
						label: t.common.edit,
						icon: <EditIcon />,
						onClick: () => router.push(REVENUES_EDIT(params.row.id)),
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
			<NavigationBar title={t.revenues.revenuesList}>
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
								onClick={() => router.push(REVENUES_ADD)}
								startIcon={<AddIcon fontSize="small" />}
								sx={{
									whiteSpace: 'nowrap',
									px: { xs: 1.5, sm: 2, md: 3 },
									py: { xs: 0.8, sm: 1, md: 1 },
									fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
								}}
							>
								{t.revenues.newRevenue}
							</Button>
							{filteredRevenues.length > 0 && (
								<Typography
									variant="subtitle1"
									sx={{
										fontWeight: 700,
										color: 'success.main',
										ml: 'auto',
									}}
								>
									Total : {totalAmount.toLocaleString('fr-MA')} MAD
								</Typography>
							)}
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
								title={t.revenues.deleteRevenue}
								body={t.revenues.deleteRevenueConfirm}
								actions={deleteModalActions}
							/>
						)}

						{showBulkDeleteModal && (
							<ActionModals
								title={t.revenues.bulkDeleteRevenues(selectedIds.length)}
								body={t.revenues.bulkDeleteRevenuesConfirm}
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

export default RevenuesListClient;
