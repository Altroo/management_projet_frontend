'use client';

import { runWithCleanup } from '@/utils/runWithCleanup';
import { useState, type FC } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, Box, Button, Chip, Stack, Typography } from '@mui/material';
import {
	Add as AddIcon,
	Close as CloseIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	TrendingDown as TrendingDownIcon,
	Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { GridColDef, GridFilterModel, GridLogicOperator, GridRenderCellParams } from '@mui/x-data-grid';
import type { SessionProps } from '@/types/_initTypes';
import type { QuoteType } from '@/types/projectTypes';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import { useDataGridPagination } from '@/components/shared/paginatedDataGrid/useDataGridPagination';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import { Protected } from '@/components/layouts/protected/protected';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import ChipSelectFilterBar from '@/components/shared/chipSelectFilter/chipSelectFilterBar';
import { createDateRangeFilterOperator } from '@/components/shared/dateRangeFilter/dateRangeFilterOperator';
import { createNumericFilterOperators } from '@/components/shared/numericFilter/numericFilterOperator';
import { createDropdownFilterOperators } from '@/components/shared/dropdownFilter/dropdownFilter';
import SummaryKpiCard from '@/components/shared/summaryKpiCard/summaryKpiCard';
import { extractApiErrorMessage, formatDate } from '@/utils/helpers';
import { QUOTES_ADD, QUOTES_EDIT, QUOTES_VIEW } from '@/utils/routes';
import { useLanguage, useToast, usePermission } from '@/utils/hooks';
import {
	useBulkDeleteQuotesMutation,
	useDeleteQuoteMutation,
	useGetCategoriesQuery,
	useGetQuotesQuery,
	useGetProjectsListQuery,
	useGetSuppliersQuery,
} from '@/store/services/project';
import { useInitAccessToken } from '@/contexts/InitContext';

const QuotesListClient: FC<SessionProps> = ({ session }) => {
	const router = useRouter();
	const params = useSearchParams();
	const { t } = useLanguage();
	const permissions = usePermission();
	const { onSuccess, onError } = useToast();
	const token = useInitAccessToken(session);

	const [paginationModel, setPaginationModel] = useDataGridPagination();
	const [searchTerm, setSearchTerm] = useState('');
	const [filterModel, setFilterModel] = useState<GridFilterModel>({
		items: [],
		logicOperator: GridLogicOperator.And,
	});
	const [chipFilterParams, setChipFilterParams] = useState<Record<string, string>>({});
	const [customFilterParams, setCustomFilterParams] = useState<Record<string, string>>({});

	const {
		data: quotes,
		isLoading,
		error,
	} = useGetQuotesQuery({ project: params.get('project') || undefined }, { skip: !token });
	const { data: projectsData } = useGetProjectsListQuery({}, { skip: !token });
	const { data: categoriesData } = useGetCategoriesQuery(undefined, { skip: !token });
	const { data: suppliersData } = useGetSuppliersQuery({}, { skip: !token });

	const projects = Array.isArray(projectsData)
		? projectsData
		: projectsData && 'results' in projectsData
			? projectsData.results
			: [];

	const categories = categoriesData ?? [];

	const projectChipOptions = projects.map((p) => ({ id: p.id, nom: p.nom }));

	const categoryChipOptions = categories.map((c) => ({ id: c.id, nom: c.name }));
	const supplierChipOptions = (suppliersData ?? []).map((supplier) => ({ id: supplier.id, nom: supplier.nom }));

	const chipFilters = [
		{
			key: 'status',
			label: t.quotes.status,
			paramName: 'status',
			options: (['received', 'validated', 'rejected'] as const).map((status) => ({
				id: status,
				nom: t.quotes[status],
			})),
		},
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
		{
			key: 'supplier',
			label: t.quotes.supplier,
			paramName: 'supplier',
			options: supplierChipOptions,
		},
	];

	const filteredQuotes = (() => {
		let data = quotes ?? [];
		if (chipFilterParams.status)
			data = data.filter((quote) => chipFilterParams.status.split(',').includes(quote.status));
		if (chipFilterParams.project) {
			const ids = chipFilterParams.project.split(',');
			data = data.filter((e) => ids.includes(String(e.project)));
		}
		if (chipFilterParams.category) {
			const ids = chipFilterParams.category.split(',');
			data = data.filter((e) => ids.includes(String(e.category)));
		}
		if (chipFilterParams.supplier) {
			const ids = chipFilterParams.supplier.split(',');
			data = data.filter((e) => e.supplier !== null && ids.includes(String(e.supplier)));
		}
		if (searchTerm.trim()) {
			const term = searchTerm.toLowerCase();
			data = data.filter(
				(e) =>
					e.description?.toLowerCase().includes(term) ||
					e.project_name?.toLowerCase().includes(term) ||
					e.category_name?.toLowerCase().includes(term) ||
					e.number?.toLowerCase().includes(term) ||
					e.supplier_name?.toLowerCase().includes(term),
			);
		}

		// Numeric amount filters
		if (customFilterParams['amount_ttc'] !== undefined && customFilterParams['amount_ttc'] !== '') {
			const val = Number(customFilterParams['amount_ttc']);
			data = data.filter((e) => Number(e.amount_ttc) === val);
		}
		if (customFilterParams['amount_ttc__gt'] !== undefined && customFilterParams['amount_ttc__gt'] !== '') {
			const val = Number(customFilterParams['amount_ttc__gt']);
			data = data.filter((e) => Number(e.amount_ttc) > val);
		}
		if (customFilterParams['amount_ttc__gte'] !== undefined && customFilterParams['amount_ttc__gte'] !== '') {
			const val = Number(customFilterParams['amount_ttc__gte']);
			data = data.filter((e) => Number(e.amount_ttc) >= val);
		}
		if (customFilterParams['amount_ttc__lt'] !== undefined && customFilterParams['amount_ttc__lt'] !== '') {
			const val = Number(customFilterParams['amount_ttc__lt']);
			data = data.filter((e) => Number(e.amount_ttc) < val);
		}
		if (customFilterParams['amount_ttc__lte'] !== undefined && customFilterParams['amount_ttc__lte'] !== '') {
			const val = Number(customFilterParams['amount_ttc__lte']);
			data = data.filter((e) => Number(e.amount_ttc) <= val);
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
	})();

	const paginatedData = (() => {
		const start = paginationModel.page * paginationModel.pageSize;
		return {
			count: filteredQuotes.length,
			results: filteredQuotes.slice(start, start + paginationModel.pageSize),
		};
	})();

	const totalAmount = filteredQuotes.reduce((sum, e) => sum + Number(e.amount_ttc), 0);

	const [deleteQuote] = useDeleteQuoteMutation();
	const [bulkDeleteQuotes] = useBulkDeleteQuotesMutation();
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
	const [selectedId, setSelectedId] = useState<number | null>(null);

	const deleteHandler = async () => {
		if (selectedId === null) return;
		await runWithCleanup(
			async () => {
				try {
					await deleteQuote({ id: selectedId }).unwrap();
					onSuccess(t.quotes.quoteDeletedSuccess);
				} catch (err) {
					onError(extractApiErrorMessage(err, t.quotes.quoteDeleteError));
				}
			},
			() => {
				setShowDeleteModal(false);
				setSelectedId(null);
			},
		);
	};

	const bulkDeleteHandler = async () => {
		await runWithCleanup(
			async () => {
				try {
					await bulkDeleteQuotes({ ids: selectedIds }).unwrap();
					onSuccess(t.quotes.quotesBulkDeletedSuccess(selectedIds.length));
					setSelectedIds([]);
				} catch (err) {
					onError(extractApiErrorMessage(err, t.quotes.quoteBulkDeleteError));
				}
			},
			() => {
				setShowBulkDeleteModal(false);
			},
		);
	};

	const createdByOptions = (() => {
		const nameMap = new Map<string, string>();
		(quotes ?? []).forEach((e) => {
			if (e.created_by_user_name) nameMap.set(e.created_by_user_name, e.created_by_user_name);
		});
		return Array.from(nameMap.values()).map((name) => ({ value: name, label: name }));
	})();

	const deleteModalActions = [
		{
			text: t.common.cancel,
			active: false,
			onClick: () => {
				setShowDeleteModal(false);
				setSelectedId(null);
			},
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
		{ field: 'number', headerName: t.quotes.number, minWidth: 150 },
		{
			field: 'status',
			headerName: t.quotes.status,
			minWidth: 130,
			filterable: false,
			renderCell: (params: GridRenderCellParams<QuoteType>) => (
				<DarkTooltip title={t.quotes[params.row.status]}>
					<Chip
						size="small"
						variant="outlined"
						label={t.quotes[params.row.status]}
						color={params.row.status === 'validated' ? 'success' : params.row.status === 'rejected' ? 'error' : 'info'}
					/>
				</DarkTooltip>
			),
		},
		{
			field: 'spent',
			filterable: false,
			headerName: t.quotes.spent,
			minWidth: 150,
			type: 'number',
			valueGetter: (value) => Number(value),
			renderCell: (params: GridRenderCellParams<QuoteType>) => (
				<Typography color={params.row.overrun ? 'error' : 'text.primary'}>
					{Number(params.value).toLocaleString('fr-MA')} MAD
				</Typography>
			),
		},
		{
			field: 'remaining',
			headerName: t.quotes.remaining,
			minWidth: 150,
			type: 'number',
			filterable: false,
			valueGetter: (value) => Number(value),
			valueFormatter: (value) => `${Number(value).toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD`,
		},
		{
			field: 'consumption_percent',
			filterable: false,
			headerName: t.quotes.consumption,
			minWidth: 150,
			renderCell: (params: GridRenderCellParams<QuoteType>) => (
				<Chip
					size="small"
					label={`${params.value ?? '—'} %`}
					color={params.row.overrun ? 'error' : 'default'}
					sx={
						params.row.overrun
							? undefined
							: { bgcolor: 'grey.50', color: 'text.secondary', border: '1px solid', borderColor: 'grey.200' }
					}
				/>
			),
		},
		{
			field: 'description',
			headerName: t.common.description,
			flex: 1.4,
			minWidth: 150,
			renderCell: (params: GridRenderCellParams<QuoteType>) => (
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
			renderCell: (params: GridRenderCellParams<QuoteType>) => (
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
			renderCell: (params: GridRenderCellParams<QuoteType>) => (
				<DarkTooltip title={params.value ?? ''}>
					<Typography variant="body2" noWrap>
						{params.value}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'amount_ttc',
			headerName: t.quotes.amount_ttc,
			flex: 0.9,
			minWidth: 110,
			filterOperators: createNumericFilterOperators(),
			renderCell: (params: GridRenderCellParams<QuoteType>) => (
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
			renderCell: (params: GridRenderCellParams<QuoteType>) => (
				<DarkTooltip title={formatDate(params.value as string)}>
					<Typography variant="body2" noWrap>
						{formatDate(params.value as string)}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'supplier_name',
			headerName: t.quotes.supplier,
			flex: 1,
			minWidth: 130,
			renderCell: (params: GridRenderCellParams<QuoteType>) => (
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
			renderCell: (params: GridRenderCellParams<QuoteType>) => (
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
						onClick: () => router.push(QUOTES_VIEW(params.row.id)),
						color: 'info' as const,
					},
					{
						label: t.common.edit,
						show: permissions.can_edit,
						icon: <EditIcon />,
						onClick: () => router.push(QUOTES_EDIT(params.row.id)),
						color: 'primary' as const,
					},
					{
						label: t.common.delete,
						show: permissions.can_delete,
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
			<NavigationBar title={t.quotes.quotesList}>
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
							{permissions.can_create && (
								<Button
									variant="contained"
									onClick={() =>
										router.push(`${QUOTES_ADD}${params.get('project') ? `?project=${params.get('project')}` : ''}`)
									}
									startIcon={<AddIcon fontSize="small" />}
									sx={{
										whiteSpace: 'nowrap',
										px: { xs: 1.5, sm: 2, md: 3 },
										py: { xs: 0.8, sm: 1, md: 1 },
										fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
									}}
								>
									{t.quotes.newQuote}
								</Button>
							)}
							{permissions.can_delete && selectedIds.length > 0 && (
								<Button
									variant="outlined"
									color="error"
									onClick={() => setShowBulkDeleteModal(true)}
									startIcon={<DeleteIcon fontSize="small" />}
									sx={{ whiteSpace: 'nowrap', ml: 'auto' }}
								>
									{t.common.delete} ({selectedIds.length})
								</Button>
							)}
						</Box>

						{filteredQuotes.length > 0 && (
							<Box sx={{ px: { xs: 1, sm: 2, md: 3 }, mb: { xs: 1, sm: 2, md: 3 } }}>
								<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(280px, 380px)' }, gap: 2 }}>
									<SummaryKpiCard
										icon={<TrendingDownIcon />}
										label={t.quotes.amount_ttc}
										value={`${totalAmount.toLocaleString('fr-MA')} MAD`}
										color="#D84315"
										testId="quotes-total-card"
									/>
								</Box>
							</Box>
						)}

						{error && <Alert severity="error">{t.quotes.loadError}</Alert>}
						<ChipSelectFilterBar
							filters={chipFilters}
							onFilterChange={(filters) => {
								setChipFilterParams(filters);
								setPaginationModel((current) => ({ ...current, page: 0 }));
							}}
							columns={2}
						/>

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
							checkboxSelection={permissions.can_delete}
							onSelectionChange={setSelectedIds}
							selectedIds={selectedIds}
						/>

						{showDeleteModal && (
							<ActionModals
								title={t.quotes.deleteQuote}
								body={t.quotes.deleteQuoteConfirm}
								actions={deleteModalActions}
							/>
						)}

						{showBulkDeleteModal && (
							<ActionModals
								title={t.quotes.bulkDeleteQuotes(selectedIds.length)}
								body={t.quotes.bulkDeleteQuotesConfirm}
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

export default QuotesListClient;
