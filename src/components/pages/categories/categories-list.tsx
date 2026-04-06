'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Stack, Typography } from '@mui/material';
import {
	Add as AddIcon,
	Close as CloseIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
} from '@mui/icons-material';
import { GridColDef, GridFilterModel, GridLogicOperator, GridRenderCellParams } from '@mui/x-data-grid';
import type { SessionProps } from '@/types/_initTypes';
import type { CategoryType } from '@/types/projectTypes';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import PaginatedDataGrid from '@/components/shared/paginatedDataGrid/paginatedDataGrid';
import ActionModals from '@/components/htmlElements/modals/actionModal/actionModals';
import { Protected } from '@/components/layouts/protected/protected';
import MobileActionsMenu from '@/components/shared/mobileActionsMenu/mobileActionsMenu';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import { createDropdownFilterOperators } from '@/components/shared/dropdownFilter/dropdownFilter';
import { extractApiErrorMessage, formatDate } from '@/utils/helpers';
import { CATEGORIES_ADD, CATEGORIES_EDIT } from '@/utils/routes';
import { useToast, useLanguage } from '@/utils/hooks';
import { useDeleteCategoryMutation, useBulkDeleteCategoriesMutation, useGetCategoriesQuery } from '@/store/services/project';
import { useInitAccessToken } from '@/contexts/InitContext';

const CategoriesListClient: React.FC<SessionProps> = ({ session }) => {
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
	const [customFilterParams, setCustomFilterParams] = useState<Record<string, string>>({});

	const { data: categories, isLoading } = useGetCategoriesQuery(undefined, { skip: !token });

	const [deleteCategory] = useDeleteCategoryMutation();
	const [bulkDeleteCategories] = useBulkDeleteCategoriesMutation();

	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

	const createdByOptions = useMemo(() => {
		const nameMap = new Map<string, string>();
		(categories ?? []).forEach((c) => {
			if (c.created_by_user_name) nameMap.set(c.created_by_user_name, c.created_by_user_name);
		});
		return Array.from(nameMap.values()).map((name) => ({ value: name, label: name }));
	}, [categories]);

	const filteredCategories = useMemo(() => {
		let result = categories ?? [];

		if (searchTerm.trim()) {
			const term = searchTerm.toLowerCase();
			result = result.filter(
				(c) =>
					c.name.toLowerCase().includes(term) ||
					(c.created_by_user_name ?? '').toLowerCase().includes(term),
			);
		}

		if (customFilterParams['created_by_user_name']) {
			result = result.filter((c) => c.created_by_user_name === customFilterParams['created_by_user_name']);
		}

		return result;
	}, [categories, searchTerm, customFilterParams]);

	const paginatedData = useMemo(() => {
		const start = paginationModel.page * paginationModel.pageSize;
		return {
			count: filteredCategories.length,
			results: filteredCategories.slice(start, start + paginationModel.pageSize),
		};
	}, [filteredCategories, paginationModel]);

	const deleteHandler = async () => {
		try {
			await deleteCategory({ id: selectedId! }).unwrap();
			onSuccess(t.categories.categoryDeletedSuccess);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.categories.categoryDeleteError));
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
			await bulkDeleteCategories({ ids: selectedIds }).unwrap();
			onSuccess(t.categories.bulkCategoriesDeletedSuccess(selectedIds.length));
			setSelectedIds([]);
		} catch (err) {
			onError(extractApiErrorMessage(err, t.categories.bulkCategoriesDeleteError));
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

	const columns: GridColDef[] = [
		{
			field: 'name',
			headerName: t.common.name,
			flex: 1.4,
			minWidth: 150,
			renderCell: (params: GridRenderCellParams<CategoryType>) => (
				<DarkTooltip title={params.value ?? ''}>
					<Typography variant="body2" noWrap>
						{params.value}
					</Typography>
				</DarkTooltip>
			),
		},
		{
			field: 'date_created',
			headerName: t.common.dateCreated,
			flex: 0.9,
			minWidth: 110,
			renderCell: (params: GridRenderCellParams<CategoryType>) => (
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
			renderCell: (params: GridRenderCellParams<CategoryType>) => (
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
						label: t.common.edit,
						icon: <EditIcon />,
						onClick: () => router.push(CATEGORIES_EDIT(params.row.id)),
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
			<NavigationBar title={t.categories.categoriesList}>
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
								onClick={() => router.push(CATEGORIES_ADD)}
								startIcon={<AddIcon fontSize="small" />}
								sx={{
									whiteSpace: 'nowrap',
									px: { xs: 1.5, sm: 2, md: 3 },
									py: { xs: 0.8, sm: 1, md: 1 },
									fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
								}}
							>
								{t.categories.newCategory}
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
								title={t.categories.deleteCategory}
								body={t.categories.deleteCategoryConfirm}
								actions={deleteModalActions}
							/>
						)}

						{showBulkDeleteModal && (
							<ActionModals
								title={t.categories.bulkDeleteCategories(selectedIds.length)}
								body={t.categories.bulkDeleteCategoriesConfirm}
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

export default CategoriesListClient;
