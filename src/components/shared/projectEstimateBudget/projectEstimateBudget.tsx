'use client';

import { useState, type FC } from 'react';
import { useRouter } from 'next/navigation';
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	CircularProgress,
	Divider,
	IconButton,
	Stack,
	ThemeProvider,
	Typography,
} from '@mui/material';
import {
	AccountBalanceWallet,
	TrendingDown,
	TrendingUp,
	ReceiptLong,
	Add,
	AccountTree,
	Category,
	InfoOutlined,
	LinkOff,
} from '@mui/icons-material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { frFR, enUS } from '@mui/x-data-grid/locales';
import type { EstimateCategoryType, EstimateSummaryType } from '@/types/projectTypes';
import { useGetProjectDashboardQuery } from '@/store/services/project';
import { useLanguage } from '@/utils/hooks';
import { QUOTES_ADD, QUOTES_LIST } from '@/utils/routes';
import SummaryKpiCard from '@/components/shared/summaryKpiCard/summaryKpiCard';
import InfoRow from '@/components/shared/infoRow/infoRow';
import DarkTooltip from '@/components/htmlElements/tooltip/darkTooltip/darkTooltip';
import { getDefaultTheme } from '@/utils/themes';
import { useDataGridPagination } from '@/components/shared/paginatedDataGrid/useDataGridPagination';
import { Protected } from '@/components/layouts/protected/protected';

const ProjectEstimateBudget: FC<{ projectId: number; summary?: EstimateSummaryType }> = ({ projectId, summary }) => {
	const { t, language } = useLanguage();
	const router = useRouter();
	const { data, isLoading, error } = useGetProjectDashboardQuery({ id: projectId }, { skip: Boolean(summary) });
	const budget = summary ?? data?.estimate_summary;
	const [paginationModel, setPaginationModel] = useDataGridPagination(10, 'estimate');
	const [showSubcategories, setShowSubcategories] = useState(false);
	const money = (value: string | number) =>
		`${Number(value).toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD`;
	const columns: GridColDef<EstimateCategoryType>[] = [
		{
			field: 'category_name',
			headerName: t.common.category,
			flex: 1,
			minWidth: 160,
			valueGetter: (value) => value ?? t.quotes.uncategorized,
		},
		...(showSubcategories
			? [
					{
						field: 'sous_categorie_name',
						headerName: t.expenses.subCategory,
						flex: 1,
						minWidth: 160,
						valueGetter: (value: string | null) => value ?? t.quotes.noSubcategory,
					},
				]
			: []),
		...(['estimated', 'spent', 'variance', 'remaining'] as const).map((field) => ({
			field,
			headerName: field === 'remaining' ? t.quotes.remainingBudget : t.quotes[field],
			minWidth: field === 'estimated' ? 225 : 180,
			type: 'number' as const,
			valueGetter: (value: string | number) => Number(value),
			renderCell: (params: { value?: number; row: EstimateCategoryType }) => (
				<Typography
					variant="body2"
					color={params.row.overrun && field === 'variance' ? 'error' : 'text.primary'}
					sx={{ width: '100%', textAlign: 'right' }}
				>
					{money(params.value ?? 0)}
				</Typography>
			),
		})),
	];
	const rows = (showSubcategories ? budget?.by_subcategory : budget?.by_category) ?? [];
	return (
		<Card elevation={2} sx={{ borderRadius: 2 }}>
			<CardContent sx={{ p: 3 }}>
				<Stack
					direction={{ xs: 'column', lg: 'row' }}
					spacing={2}
					sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', lg: 'center' }, mb: 2 }}
				>
					<Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
						<AccountBalanceWallet color="primary" />
						<Typography variant="h6" sx={{ fontWeight: 700 }}>
							{t.quotes.estimated}
						</Typography>
						<DarkTooltip title={t.quotes.budgetHelp}>
							<IconButton size="small" color="primary" aria-label={t.quotes.budgetHelp}>
								<InfoOutlined fontSize="small" />
							</IconButton>
						</DarkTooltip>
					</Stack>
					<Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
						<Button
							variant="outlined"
							size="small"
							startIcon={<ReceiptLong />}
							onClick={() => router.push(`${QUOTES_LIST}?project=${projectId}`)}
						>
							{t.quotes.quotesList}
						</Button>
						<Protected permission="can_create">
							<Button
								variant="outlined"
								size="small"
								startIcon={<Add />}
								onClick={() => router.push(`${QUOTES_ADD}?project=${projectId}`)}
							>
								{t.quotes.newQuote}
							</Button>
						</Protected>
					</Stack>
				</Stack>
				<Divider sx={{ mb: 3 }} />
				<Stack spacing={3}>
					{isLoading && <CircularProgress size={24} />}
					{error && <Alert severity="error">{t.quotes.loadError}</Alert>}
					{budget && (
						<>
							{!budget.validated_count && <Alert severity="info">{t.quotes.noValidated}</Alert>}
							{budget.overrun && budget.validated_count > 0 && (
								<Alert severity="error">
									{t.quotes.overrun}: {money(-Number(budget.variance))}
								</Alert>
							)}
							<Box
								sx={{
									display: 'grid',
									gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', xl: 'repeat(4, 1fr)' },
									gap: 2,
								}}
							>
								<SummaryKpiCard
									icon={<AccountBalanceWallet />}
									label={t.quotes.estimated}
									value={budget.validated_count ? money(budget.estimated) : '—'}
									color="#1565C0"
								/>
								<SummaryKpiCard
									icon={<TrendingDown />}
									label={t.quotes.spent}
									value={money(budget.spent)}
									color="#D84315"
								/>
								<SummaryKpiCard
									icon={<AccountBalanceWallet />}
									label={t.quotes.variance}
									value={budget.validated_count ? money(budget.variance) : '—'}
									color={budget.overrun ? '#D32F2F' : '#2E7D32'}
								/>
								<SummaryKpiCard
									icon={<TrendingUp />}
									label={t.quotes.advances}
									value={money(budget.advances)}
									color="#2E7D32"
								/>
							</Box>
							<Stack spacing={0}>
								<InfoRow
									icon={<AccountBalanceWallet />}
									label={t.quotes.remainingBudget}
									value={budget.validated_count ? money(budget.remaining) : '—'}
								/>
								<Divider />
								<InfoRow icon={<LinkOff />} label={t.quotes.unlinked} value={money(budget.unlinked_spent)} />
							</Stack>
							<Stack spacing={2}>
								<Stack
									direction={{ xs: 'column', lg: 'row' }}
									spacing={2}
									sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', lg: 'center' } }}
								>
									<Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
										<Category color="primary" />
										<Typography variant="h6" sx={{ fontWeight: 700 }}>
											{showSubcategories ? t.quotes.bySubcategory : t.quotes.byCategory}
										</Typography>
									</Stack>
									<Button
										variant="outlined"
										size="small"
										startIcon={showSubcategories ? <Category /> : <AccountTree />}
										onClick={() => {
											setShowSubcategories(!showSubcategories);
											setPaginationModel({ ...paginationModel, page: 0 });
										}}
									>
										{showSubcategories ? t.quotes.byCategory : t.quotes.bySubcategory}
									</Button>
								</Stack>
								<Divider />
								<ThemeProvider theme={getDefaultTheme()}>
									<Box sx={{ width: '100%', height: rows.length ? 430 : 320 }}>
										<DataGrid<EstimateCategoryType>
											rows={rows}
											columns={columns}
											loading={isLoading}
											pagination
											paginationModel={paginationModel}
											onPaginationModelChange={setPaginationModel}
											onFilterModelChange={() =>
												setPaginationModel((current) => (current.page === 0 ? current : { ...current, page: 0 }))
											}
											pageSizeOptions={[5, 10, 25, 50, 100]}
											localeText={(language === 'fr' ? frFR : enUS).components.MuiDataGrid.defaultProps.localeText}
											disableRowSelectionOnClick
											showToolbar
											slotProps={{ toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 500 } } }}
											sx={{
												'& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700 },
												'& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center' },
											}}
										/>
									</Box>
								</ThemeProvider>
							</Stack>
						</>
					)}
				</Stack>
			</CardContent>
		</Card>
	);
};
export default ProjectEstimateBudget;
