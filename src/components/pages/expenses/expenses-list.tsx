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
import type { ExpenseType } from '@/types/projectTypes';
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
import { EXPENSES_ADD, EXPENSES_EDIT, EXPENSES_VIEW } from '@/utils/routes';
import { useToast, useLanguage } from '@/utils/hooks';
import { useDeleteExpenseMutation, useBulkDeleteExpensesMutation, useGetExpensesQuery, useGetProjectsListQuery, useGetCategoriesQuery } from '@/store/services/project';
import { useInitAccessToken } from '@/contexts/InitContext';

const ExpensesListClient: React.FC<SessionProps> = ({ session }) => {
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

	const { data: expenses, isLoading } = useGetExpensesQuery({}, { skip: !token });
	const { data: projectsData } = useGetProjectsListQuery({}, { skip: !token });
	const { data: categoriesData } = useGetCategoriesQuery(undefined, { skip: !token });

	const projects = useMemo(() => {
		const raw = Array.isArray(projectsData) ? projectsData : (projectsData && 'results' in projectsData ? projectsData.results : []);
		return raw;
	}, [projectsData]);

	const categories = useMemo(() => categoriesData ?? [], [categoriesData]);

	const projectChipOptions = useMemo(
		() => projects.map((p) => ({ id: p.id, nom: p.nom })),
		[projects],
	);

	const categoryChipOptions = useMemo(
		() => categories.map((c) => ({ id: c.id, nom: c.name })),
		[categories],
	);

	const chipFilters = useMemo<ChipFilterConfig[]>(
		() => [
			{
				key: 'project',
				label: t.common.project,
				paramName: 'project',
				options: projectChipOptions,
			},
			{
				key: 'category',
				label: t.common.category,
				paramName: 'category',
				options: categoryChipOptions,
			},
		],
		[t, projectChipOptions, categoryChipOptions],
	);

	const filteredExpenses = useMemo(() => {
		let data = expenses ?? [];
		if (chipFilterParams.project) {
			const ids = chipFilterParams.project.split(',');
			data = data.filter((e) => ids.includes(String(e.project)));
		}
		if (chipFilterParams.category) {
			const ids = chipFilterParams.category.split(',');
			data = data.filter((e) => ids.includes(String(e.category)));
		}
		if (searchTerm.trim()) {
			const term = searchTerm.toLowerCase();
			data = data.filter(
				(e) =>
					(e.description?.toLowerCase().includes(term)) ||
					(e.project_name?.toLowerCase().includes(term)) ||
					(e.category_name?.toLowerCase().includes(term)) ||
					(e.element?.toLowerCase().includes(term)) ||
					(e.fournisseur?.toLowerCase().includes(term)),
			);
		}

		// Numeric amount filters
		if (customFilterParams['montant'] !== undefined && customFilterParams['montant'] !== '') {
			const val = Number(customFilterParams['montant']);
			data = data.filter((e) => Number(e.montant) === val);
		}
		if (customFilterParams['montant__gt'] !== undefined && customFilterParams['montant__gt'] !== '') {
			const val = Number(customFilterParams['montant__gt']);
			data = data.filter((e) => Number(e.montant) > val);
		}
		if (customFilterParams['montant__gte'] !== undefined && customFilterParams['montant__gte'] !== '') {
			const val = Number(customFilterParams['montant__gte']);
			data = data.filter((e) => Number(e.montant) >= val);
		}
		if (customFilterParams['montant__lt'] !== undefined && customFilterParams['montant__lt'] !== '') {
			const val = Number(customFilterParams['montant__lt']);
			data = data.filter((e) => Number(e.montant) < val);
		}
		if (customFilterParams['montant__lte'] !== undefined && customFilterParams['montant__lte'] !== '') {
			const val = Number(customFilterParams['montant__lte']);
			data = data.filter((e) => Number(e.montant) <= val);
		}

		// Date range filters
		if (customFilterParams['date_after']) {
			const after = new Date(customFilterParams['date_after']);
			data = data.filter((e) => new Date(e.date) >= after);
		}
		if (customFilterParams['date_before']) {
			const before = new Date(customFilterParams['date_before']);
			data = data.filter((e) => new Date(e.date) <= before);
		}

		// Created by dropdown filter
		if (customFilterParams['created_by_user_name']) {
			data = data.filter((e) => e.created_by_user_name === customFilterParams['created_by_user_name']);
		}

		return data;
	}, [expenses, chipFilterParams, searchTerm, customFilterParams]);

	const paginatedData = useMemo(() => {
		const start = paginationModel.page * paginationModel.pageSize;
		return {
			count: filteredExpenses.length,
			results: filteredExpenses.slice(start, start + paginationModel.pageSize),
		};
	}, [filteredExpenses, paginationModel]);

	const totalAmount = useMemo(
		() => filteredExpenses.reduce((sum, e) => sum + Number(e.montant), 0),
		[filteredExpenses],
	);

	const [deleteExpense] = useDeleteExpenseMutation();
	const [bulkDeleteExpenses] = useBulkDeleteExpensesMutation();
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
	const [selectedId, setSelectedId] = useState<number | null>(null);

	const deleteHandler = async () => {
		if (selectedId === null) return;
		try {
			await deleteExpense({ id: selectedId }).unwrap();
			onSuccess(t.expenses.expenseDeletedSuccess);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.expenses.expenseDeleteError));
		} finally {
			setShowDeleteModal(false);
			setSelectedId(null);
		}
	};

	const bulkDeleteHandler = async () => {
		try {
			await bulkDeleteExpenses({ ids: selectedIds }).unwrap();
			onSuccess(t.expenses.expensesBulkDeletedSuccess(selectedIds.length));
			setSelectedIds([]);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.expenses.expenseBulkDeleteError));
		} finally {
			setShowBulkDeleteModal(false);
		}
	};

	const createdByOptions = useMemo(() => {
		const nameMap = new Map<string, string>();
		(expenses ?? []).forEach((e) => {
			if (e.created_by_user_name) nameMap.set(e.created_by_user_name, e.created_by_user_name);
		});
		return Array.from(nameMap.values()).map((name) => ({ value: name, label: name }));
	}, [expenses]);

	const deleteModalActions = [
		{
			text: t.common.cancel,
			active: false,
			onClick: () => { setShowDeleteModal(false); setSelectedId(null); },
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

	const columns: GridColDef[] = [
		{
			field: 'description',
			headerName: t.common.description,
			flex: 1.4,
			minWidth: 150,
			renderCell: (params: GridRenderCellParams<ExpenseType>) => (
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
			minWidth: 130,
			filterable: false,
			renderCell: (params: GridRenderCellParams<ExpenseType>) => (
				<DarkTooltip title={params.value ?? ''}>
					<Typography variant="body2" noWrap>
						{params.value}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'category_name',
			headerName: t.common.category,
			flex: 1,
			minWidth: 130,
			filterable: false,
			renderCell: (params: GridRenderCellParams<ExpenseType>) => (
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
			renderCell: (params: GridRenderCellParams<ExpenseType>) => (
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
			renderCell: (params: GridRenderCellParams<ExpenseType>) => (
				<DarkTooltip title={formatDate(params.value as string)}>
					<Typography variant="body2" noWrap>
						{formatDate(params.value as string)}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'fournisseur',
			headerName: t.expenses.supplier,
			flex: 1,
			minWidth: 130,
			renderCell: (params: GridRenderCellParams<ExpenseType>) => (
				<DarkTooltip title={params.value ?? ''}>
					<Typography variant="body2" noWrap>
						{params.value ?? '—'}
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
			renderCell: (params: GridRenderCellParams<ExpenseType>) => (
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
						onClick: () => router.push(EXPENSES_VIEW(params.row.id)),
						color: 'info' as const,
					},
					{
						label: t.common.edit,
						icon: <EditIcon />,
						onClick: () => router.push(EXPENSES_EDIT(params.row.id)),
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
			mt="48px"
			sx={{ overflowX: 'auto', overflowY: 'hidden' }}
		>
			<NavigationBar title={t.expenses.expensesList}>
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
								onClick={() => router.push(EXPENSES_ADD)}
								startIcon={<AddIcon fontSize="small" />}
								sx={{
									whiteSpace: 'nowrap',
									px: { xs: 1.5, sm: 2, md: 3 },
									py: { xs: 0.8, sm: 1, md: 1 },
									fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
								}}
							>
								{t.expenses.newExpense}
							</Button>
							{filteredExpenses.length > 0 && (
								<Typography variant="subtitle1" fontWeight={700} color="error.main" sx={{ ml: 'auto' }}>
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
								title={t.expenses.deleteExpense}
								body={t.expenses.deleteExpenseConfirm}
								actions={deleteModalActions}
							/>
						)}

						{showBulkDeleteModal && (
							<ActionModals
								title={t.expenses.bulkDeleteExpenses(selectedIds.length)}
								body={t.expenses.bulkDeleteExpensesConfirm}
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

export default ExpensesListClient;
