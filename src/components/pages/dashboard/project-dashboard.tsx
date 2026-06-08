'use client';

import React, { useMemo, useState } from 'react';
import {
	Box,
	Card,
	CardContent,
	CardHeader,
	CircularProgress,
	IconButton,
	LinearProgress,
	Stack,
	Tooltip as MuiTooltip,
	Typography,
} from '@mui/material';
import {
	AccountBalanceWallet as BudgetIcon,
	AccountTree as ProjectsIcon,
	InfoOutlined as InfoIcon,
	PieChart as MarginIcon,
	ReceiptLong as ServiceFeeIcon,
	Savings as ProfitIcon,
	Speed as UtilisationIcon,
	TrendingDown as ExpensesIcon,
	TrendingUp as RevenueIcon,
} from '@mui/icons-material';
import {
	ArcElement,
	BarElement,
	CategoryScale,
	Chart as ChartJS,
	Filler,
	Legend,
	LineElement,
	LinearScale,
	PointElement,
	Title,
	Tooltip,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
	useGetClientDashboardQuery,
	useGetClientProjectDashboardQuery,
	useGetMultiProjectDashboardQuery,
	useGetProjectDashboardQuery,
} from '@/store/services/project';
import { useInitAccessToken } from '@/contexts/InitContext';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import CustomAutoCompleteSelect from '@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect';
import { useLanguage } from '@/utils/hooks';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import type { SessionProps } from '@/types/_initTypes';
import type { DropDownType } from '@/types/accountTypes';
import { CHART_OPTS } from '@/utils/rawData';
import { formatNumber } from '@/utils/helpers';
import { textInputTheme } from '@/utils/themes';
import type {
	DashboardCategoryTotalType,
	DashboardHistoryPointType,
	DashboardSubCategoryTotalType,
	DashboardVendorTotalType,
	RealBudgetStageSummaryType,
} from '@/types/projectTypes';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Filler, Title, Tooltip, Legend);

const inputTheme = textInputTheme();

/* ── KPI Card with left accent bar ─────────────────────────────────────────── */
interface KpiCardProps {
	icon: React.ReactNode;
	label: string;
	value: string;
	sub?: string;
	color: string;
	tooltip?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ icon, label, value, sub, color, tooltip }) => (
	<Card
		elevation={2}
		sx={{
			height: '100%',
			position: 'relative',
			overflow: 'hidden',
			'&::before': {
				content: '""',
				position: 'absolute',
				top: 0,
				left: 0,
				width: 4,
				height: '100%',
				bgcolor: color,
			},
		}}
	>
		<CardContent sx={{ pl: 2.5 }}>
			<Stack
				direction="row"
				sx={{
					justifyContent: 'space-between',
					alignItems: 'flex-start',
				}}
			>
				<Stack
					direction="row"
					spacing={1.5}
					sx={{
						alignItems: 'center',
						mb: 0.5,
					}}
				>
					<Box sx={{ color, display: 'flex' }}>{icon}</Box>
					<Typography
						variant="caption"
						sx={{
							color: 'text.secondary',
							textTransform: 'uppercase',
							letterSpacing: 0.8,
						}}
					>
						{label}
					</Typography>
				</Stack>
				{tooltip && (
					<MuiTooltip title={tooltip} arrow placement="top">
						<IconButton size="small" sx={{ color: 'text.secondary', mt: -0.5 }}>
							<InfoIcon fontSize="small" />
						</IconButton>
					</MuiTooltip>
				)}
			</Stack>
			<Typography
				variant="h5"
				sx={{
					fontWeight: 700,
				}}
			>
				{value}
			</Typography>
			{sub && (
				<Typography
					variant="body2"
					sx={{
						color: 'text.secondary',
					}}
				>
					{sub}
				</Typography>
			)}
		</CardContent>
	</Card>
);

/* ── Chart wrapper ─────────────────────────────────────────────────────────── */
interface ChartCardProps {
	title: string;
	subheader?: string;
	infoTooltip?: string;
	children: React.ReactNode;
	height?: number;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, subheader, infoTooltip, children, height = 300 }) => (
	<Card elevation={2} sx={{ overflow: 'hidden' }}>
		<CardHeader
			title={
				<Typography variant="h6" sx={{ fontSize: { xs: '0.95rem', md: '1.1rem' } }}>
					{title}
				</Typography>
			}
			subheader={
				subheader && (
					<Typography
						variant="caption"
						sx={{
							color: 'text.secondary',
						}}
					>
						{subheader}
					</Typography>
				)
			}
			action={
				infoTooltip ? (
					<MuiTooltip title={infoTooltip} arrow placement="top">
						<IconButton size="small" sx={{ color: 'text.secondary' }}>
							<InfoIcon fontSize="small" />
						</IconButton>
					</MuiTooltip>
				) : undefined
			}
			sx={{ pb: 0 }}
		/>
		<CardContent>
			<Box sx={{ height }}>{children}</Box>
		</CardContent>
	</Card>
);

const EmptyChart: React.FC<{ message?: string }> = ({ message }) => {
	const { t } = useLanguage();
	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'center',
				alignItems: 'center',
				height: '100%',
				bgcolor: 'grey.50',
				borderRadius: 2,
				border: '1px dashed',
				borderColor: 'grey.300',
			}}
		>
			<Typography
				variant="h6"
				gutterBottom
				sx={{
					color: 'text.secondary',
				}}
			>
				📊
			</Typography>
			<Typography
				variant="body2"
				sx={{
					color: 'text.secondary',
					textAlign: 'center',
				}}
			>
				{message ?? t.analytics.noDataAvailable}
			</Typography>
		</Box>
	);
};

const doughnutPalette = [
	'#1d4ed8',
	'#047857',
	'#b91c1c',
	'#c2410c',
	'#6d28d9',
	'#0f766e',
	'#be123c',
	'#4d7c0f',
];

const ALL_PROJECTS_CODE = '__all_projects__';

const compactCurrency = (value: string | number) => `${formatNumber(value)} MAD`;

const clampPercent = (value: number) => Math.min(Math.max(value, 0), 100);

const buildCumulativeHistoryData = (
	expenseHistory: DashboardHistoryPointType[],
	revenueHistory: DashboardHistoryPointType[],
	t: ReturnType<typeof useLanguage>['t'],
) => {
	const labels = Array.from(new Set([...expenseHistory.map((item) => item.date), ...revenueHistory.map((item) => item.date)])).sort();
	const expenseMap = new Map(expenseHistory.map((item) => [item.date, Number(item.total)]));
	const revenueMap = new Map(revenueHistory.map((item) => [item.date, Number(item.total)]));
	let expenseRunningTotal = 0;
	let revenueRunningTotal = 0;

	return {
		labels,
		datasets: [
			{
				label: t.analytics.expenses,
				data: labels.map((label) => {
					expenseRunningTotal += expenseMap.get(label) ?? 0;
					return expenseRunningTotal;
				}),
				borderColor: '#b91c1c',
				backgroundColor: 'rgba(185, 28, 28, 0.26)',
				fill: true,
				pointRadius: 0,
				tension: 0.35,
			},
			{
				label: t.analytics.revenue,
				data: labels.map((label) => {
					revenueRunningTotal += revenueMap.get(label) ?? 0;
					return revenueRunningTotal;
				}),
				borderColor: '#047857',
				backgroundColor: 'rgba(4, 120, 87, 0.26)',
				fill: true,
				pointRadius: 0,
				tension: 0.35,
			},
		],
	};
};

const doughnutOptions = {
	...CHART_OPTS,
	cutout: '62%',
	plugins: {
		legend: {
			position: 'bottom' as const,
			labels: { boxWidth: 10, padding: 12 },
		},
	},
};

const horizontalBarOptions = {
	...CHART_OPTS,
	indexAxis: 'y' as const,
	plugins: { legend: { display: false } },
	scales: {
		x: { beginAtZero: true },
		y: { grid: { display: false } },
	},
};

const areaChartOptions = {
	...CHART_OPTS,
	interaction: { mode: 'index' as const, intersect: false },
	plugins: { legend: { position: 'top' as const } },
	scales: {
		x: { grid: { color: 'rgba(0, 0, 0, 0.04)' } },
		y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.06)' } },
	},
};

const groupedBarOptions = {
	...CHART_OPTS,
	plugins: { legend: { position: 'top' as const } },
	scales: {
		x: { grid: { display: false } },
		y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.06)' } },
	},
};

const makeDoughnutData = (labels: string[], values: number[], colors = doughnutPalette) => ({
	labels,
	datasets: [
		{
			data: values,
			backgroundColor: labels.map((_, index) => colors[index % colors.length]),
			borderColor: '#fff',
			borderWidth: 2,
		},
	],
});

const makeHorizontalData = (labels: string[], values: number[], color: string) => ({
	labels,
	datasets: [
		{
			data: values,
			backgroundColor: color,
			borderRadius: 2,
			barThickness: 28,
		},
	],
});

const makeRealBudgetStageData = (rows: RealBudgetStageSummaryType[], t: ReturnType<typeof useLanguage>['t']) => ({
	labels: rows.map((item) => item.stage),
	datasets: [
		{
			label: t.analytics.realRevenue,
			data: rows.map((item) => Number(item.total_revenue)),
			backgroundColor: '#047857',
			borderRadius: 3,
		},
		{
			label: t.analytics.realCost,
			data: rows.map((item) => Number(item.total_cost)),
			backgroundColor: '#b91c1c',
			borderRadius: 3,
		},
		{
			label: t.analytics.realMargin,
			data: rows.map((item) => Number(item.profit)),
			backgroundColor: '#1d4ed8',
			borderRadius: 3,
		},
	],
});

interface ProjectDashboardClientProps extends SessionProps {
	clientFacing?: boolean;
}

const ProjectDashboardClient: React.FC<ProjectDashboardClientProps> = ({ session, clientFacing = false }) => {
	const { t } = useLanguage();
	const token = useInitAccessToken(session);

	const { data: internalData, isLoading: isInternalLoading } = useGetMultiProjectDashboardQuery(undefined, {
		skip: !token || clientFacing,
	});
	const { data: clientData, isLoading: isClientLoading } = useGetClientDashboardQuery(undefined, {
		skip: !token || !clientFacing,
	});
	const data = clientFacing ? clientData : internalData;
	const isLoading = clientFacing ? isClientLoading : isInternalLoading;

	const projects = useMemo(() => data?.projects ?? [], [data?.projects]);
	const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
	const allProjectsOption = useMemo<DropDownType>(
		() => ({ code: ALL_PROJECTS_CODE, value: t.analytics.allProjects }),
		[t.analytics.allProjects],
	);
	const projectOptions: DropDownType[] = useMemo(
		() => [allProjectsOption, ...projects.map((project) => ({ code: String(project.id), value: project.nom }))],
		[allProjectsOption, projects],
	);
	const selectedProjectOption =
		selectedProjectId === null
			? allProjectsOption
			: projectOptions.find((project) => Number(project.code) === selectedProjectId) ?? allProjectsOption;
	const { data: internalProjectOverview, isFetching: isInternalProjectLoading } = useGetProjectDashboardQuery(
		{ id: selectedProjectId! },
		{ skip: !token || selectedProjectId === null || clientFacing },
	);
	const { data: clientProjectOverview, isFetching: isClientProjectLoading } = useGetClientProjectDashboardQuery(
		{ id: selectedProjectId! },
		{ skip: !token || selectedProjectId === null || !clientFacing },
	);
	const isProjectFiltered = selectedProjectId !== null;
	const fetchedProjectOverview = clientFacing ? clientProjectOverview : internalProjectOverview;
	const projectOverview = isProjectFiltered ? fetchedProjectOverview : undefined;
	const isProjectOverviewLoading = clientFacing ? isClientProjectLoading : isInternalProjectLoading;
	const showInternalFinancials = !clientFacing;

	const totalProjects = data?.total_projects ?? 0;
	const totalBudget = projectOverview?.budget_total ?? data?.total_budget ?? '0';
	const totalRevenue = projectOverview?.revenue_total ?? data?.total_revenue ?? '0';
	const totalExpenses = projectOverview?.depenses_totales ?? data?.total_expenses ?? '0';
	const totalProfit = projectOverview?.benefice ?? data?.total_profit ?? '0';
	const totalMargin = projectOverview?.marge ?? data?.total_margin ?? 0;
	const budgetUtilisation = projectOverview?.budget_utilisation ?? data?.budget_utilisation ?? 0;
	const totalServiceFees = projectOverview?.service_fees ?? data?.total_service_fees ?? '0';
	const totalRevenueReelle = projectOverview?.revenue_reelle ?? data?.total_revenue_reelle ?? '0';
	const realBudgetInitial = projectOverview?.budget_initial ?? data?.budget_initial ?? totalBudget;
	const realBudgetCost = projectOverview?.real_budget_total_cost ?? data?.real_budget_total_cost ?? '0';
	const realBudgetRevenue = projectOverview?.real_budget_total_revenue ?? data?.real_budget_total_revenue ?? '0';
	const realBudgetProfit = projectOverview?.real_budget_profit ?? data?.real_budget_profit ?? '0';
	const realBudgetMargin = projectOverview?.real_budget_margin ?? data?.real_budget_margin ?? 0;
	const realBudgetGap = projectOverview?.budget_gap ?? data?.budget_gap ?? '0';
	const realBudgetGapPercent = projectOverview?.budget_gap_percent ?? data?.budget_gap_percent ?? 0;
	const activeRealBudgetByStage = projectOverview?.real_budget_by_stage ?? data?.real_budget_by_stage ?? [];

	const activeTopCategories = projectOverview?.top_categories ?? data?.top_categories ?? [];
	const activeTopSubcategories = projectOverview?.top_subcategories ?? data?.top_subcategories ?? [];
	const activeTopVendors = projectOverview?.top_vendors ?? data?.top_vendors ?? [];
	const activeHistoryData = useMemo(
		() =>
			buildCumulativeHistoryData(
				projectOverview?.expense_history ?? data?.expense_history ?? [],
				projectOverview?.revenue_history ?? data?.revenue_history ?? [],
				t,
			),
		[
			data?.expense_history,
			data?.revenue_history,
			projectOverview?.expense_history,
			projectOverview?.revenue_history,
			t,
		],
	);

	const categoryBreakdownData = makeDoughnutData(
		activeTopCategories.map((item: DashboardCategoryTotalType) => item.category__name ?? t.common.category),
		activeTopCategories.map((item: DashboardCategoryTotalType) => Number(item.total)),
	);
	const subcategoryBreakdownData = makeDoughnutData(
		activeTopSubcategories.map((item: DashboardSubCategoryTotalType) => item.sous_categorie__name ?? t.expenses.subCategory),
		activeTopSubcategories.map((item: DashboardSubCategoryTotalType) => Number(item.total)),
	);
	const vendorBreakdownData = makeDoughnutData(
		activeTopVendors.map((item: DashboardVendorTotalType) => item.fournisseur),
		activeTopVendors.map((item: DashboardVendorTotalType) => Number(item.total)),
	);
	const realBudgetStageData = makeRealBudgetStageData(activeRealBudgetByStage, t);

	const topBudgetProjects = useMemo(
		() => [...projects].sort((a, b) => Number(b.budget_total) - Number(a.budget_total)).slice(0, 10),
		[projects],
	);
	const projectRankingData = makeHorizontalData(
		topBudgetProjects.map((project) => project.nom),
		topBudgetProjects.map((project) => Number(project.budget_total)),
		'#1d4ed8',
	);

	const topExpenseClients = data?.top_expense_clients ?? [];
	const topRevenueClients = data?.top_revenue_clients ?? [];
	const topExpenseClientsData = {
		labels: topExpenseClients.map((item) => item.client),
		datasets: [
			{
				label: t.analytics.expenses,
				data: topExpenseClients.map((item) => Number(item.total)),
				backgroundColor: '#b91c1c',
				borderRadius: 4,
			},
		],
	};
	const topRevenueClientsData = {
		labels: topRevenueClients.map((item) => item.client),
		datasets: [
			{
				label: t.analytics.revenue,
				data: topRevenueClients.map((item) => Number(item.total)),
				backgroundColor: '#047857',
				borderRadius: 4,
			},
		],
	};

	const projectTopCategoriesData = makeHorizontalData(
		activeTopCategories.map((item) => item.category__name ?? t.common.category),
		activeTopCategories.map((item) => Number(item.total)),
		'#b91c1c',
	);
	const projectTopSubcategoriesData = makeHorizontalData(
		activeTopSubcategories.map((item) => item.sous_categorie__name ?? t.expenses.subCategory),
		activeTopSubcategories.map((item) => Number(item.total)),
		'#047857',
	);
	const projectTopVendorsData = makeHorizontalData(
		activeTopVendors.map((item) => item.fournisseur),
		activeTopVendors.map((item) => Number(item.total)),
		'#1d4ed8',
	);
	const projectBudgetUtilisation = budgetUtilisation;
	const projectBudgetUsed = clampPercent(projectBudgetUtilisation);
	const projectBudgetData = makeDoughnutData(
		[t.analytics.usedBudget, t.analytics.remainingBudget],
		[projectBudgetUsed, Math.max(100 - projectBudgetUsed, 0)],
		['#b91c1c', '#334155'],
	);
	const projectProfitMargin = clampPercent(projectOverview?.marge ?? 0);
	const projectProfitData = makeDoughnutData(
		[t.analytics.profitMargin, t.analytics.remainingBudget],
		[projectProfitMargin, Math.max(100 - projectProfitMargin, 0)],
		['#047857', '#334155'],
	);
	const pageTitle = clientFacing ? t.analytics.clientDashboard : t.common.dashboard;

	return (
		<Stack
			direction="column"
			spacing={2}
			className={Styles.flexRootStack}
			sx={{
				mt: '48px',
			}}
		>
			<NavigationBar title={pageTitle}>
				<Protected permission="can_view">
					<Box sx={{ px: { xs: 1, sm: 2, md: 3 }, pb: 4, pt: '10px' }}>
						<Stack
							direction={{ xs: 'column', md: 'row' }}
							spacing={2}
							sx={{
								justifyContent: 'flex-end',
								alignItems: { xs: 'stretch', md: 'center' },
								mb: 3,
							}}
						>
							<Box sx={{ width: { xs: '100%', md: 380 } }}>
								<CustomAutoCompleteSelect
									id={clientFacing ? 'client-project-filter' : 'project-filter'}
									size="small"
									noOptionsText={t.projects.noProjectFound}
									label={t.analytics.projectOverviewSelect}
									items={projectOptions}
									theme={inputTheme}
									value={selectedProjectOption}
									fullWidth
									onChange={(_, newVal) =>
										setSelectedProjectId(newVal && newVal.code !== ALL_PROJECTS_CODE ? Number(newVal.code) : null)
									}
									startIcon={<ProjectsIcon fontSize="small" />}
								/>
							</Box>
						</Stack>

						{isLoading || (isProjectFiltered && isProjectOverviewLoading) ? (
							<Box
								sx={{
									display: 'flex',
									justifyContent: 'center',
									py: 8,
								}}
							>
								<CircularProgress />
							</Box>
						) : (
							<Stack spacing={3}>
								{/* ── KPI Row ─────────────────────────────── */}
								<Box
									sx={{
										display: 'grid',
										gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
										gap: 2,
									}}
								>
									{!projectOverview && (
										<KpiCard
											icon={<ProjectsIcon fontSize="small" />}
											label={t.analytics.totalProjects}
											value={totalProjects.toString()}
											color="#1976d2"
										/>
									)}
									<KpiCard
										icon={<BudgetIcon fontSize="small" />}
										label={t.analytics.totalBudget}
										value={`${formatNumber(totalBudget)} MAD`}
										color="#ed6c02"
									/>
									<KpiCard
										icon={<RevenueIcon fontSize="small" />}
										label={t.analytics.totalRevenue}
										value={`${formatNumber(totalRevenue)} MAD`}
										color="#2e7d32"
									/>
									<KpiCard
										icon={<ExpensesIcon fontSize="small" />}
										label={t.analytics.totalExpenses}
										value={`${formatNumber(totalExpenses)} MAD`}
										color="#d32f2f"
									/>
									{projectOverview && showInternalFinancials && (
										<KpiCard
											icon={<ProfitIcon fontSize="small" />}
											label={t.analytics.totalProfit}
											value={`${formatNumber(totalProfit)} MAD`}
											color={Number(totalProfit) >= 0 ? '#2e7d32' : '#d32f2f'}
										/>
									)}
									{projectOverview && showInternalFinancials && (
										<KpiCard
											icon={<ServiceFeeIcon fontSize="small" />}
											label={t.analytics.serviceFees}
											value={`${formatNumber(totalServiceFees)} MAD`}
											color="#1976d2"
										/>
									)}
									{projectOverview && showInternalFinancials && (
										<KpiCard
											icon={<RevenueIcon fontSize="small" />}
											label={t.analytics.revenueReelle}
											value={`${formatNumber(totalRevenueReelle)} MAD`}
											color="#0288d1"
										/>
									)}
									{projectOverview && !showInternalFinancials && (
										<KpiCard
											icon={<UtilisationIcon fontSize="small" />}
											label={t.analytics.budgetUtilisation}
											value={`${budgetUtilisation.toFixed(1)}%`}
											color="#0288d1"
										/>
									)}
								</Box>

								{/* ── Profit & Margin KPIs ───────────────── */}
								{showInternalFinancials && !projectOverview && (
									<Box
										sx={{
											display: 'grid',
											gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' },
											gap: 2,
										}}
									>
										<KpiCard
											icon={<ProfitIcon fontSize="small" />}
											label={t.analytics.totalProfit}
											value={`${formatNumber(totalProfit)} MAD`}
											color={Number(totalProfit) >= 0 ? '#2e7d32' : '#d32f2f'}
										/>
										<KpiCard
											icon={<MarginIcon fontSize="small" />}
											label={t.analytics.profitMargin}
											value={`${totalMargin.toFixed(1)}%`}
											color="#9c27b0"
										/>
										<KpiCard
											icon={<UtilisationIcon fontSize="small" />}
											label={t.analytics.budgetUtilisation}
											value={`${budgetUtilisation.toFixed(1)}%`}
											color="#0288d1"
										/>
										<KpiCard
											icon={<ServiceFeeIcon fontSize="small" />}
											label={t.analytics.serviceFees}
											value={`${formatNumber(totalServiceFees)} MAD`}
											color="#1976d2"
										/>
										<KpiCard
											icon={<RevenueIcon fontSize="small" />}
											label={t.analytics.revenueReelle}
											value={`${formatNumber(totalRevenueReelle)} MAD`}
											color="#0288d1"
										/>
									</Box>
								)}

								{showInternalFinancials && (
									<Box
										sx={{
											display: 'grid',
											gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' },
											gap: 2,
										}}
									>
										<KpiCard
											icon={<BudgetIcon fontSize="small" />}
											label={t.analytics.initialBudget}
											value={`${formatNumber(realBudgetInitial)} MAD`}
											color="#ed6c02"
										/>
										<KpiCard
											icon={<ExpensesIcon fontSize="small" />}
											label={t.analytics.realCost}
											value={`${formatNumber(realBudgetCost)} MAD`}
											color="#d32f2f"
										/>
										<KpiCard
											icon={<RevenueIcon fontSize="small" />}
											label={t.analytics.realRevenue}
											value={`${formatNumber(realBudgetRevenue)} MAD`}
											color="#2e7d32"
										/>
										<KpiCard
											icon={<ProfitIcon fontSize="small" />}
											label={t.analytics.realMargin}
											value={`${formatNumber(realBudgetProfit)} MAD`}
											sub={`${realBudgetMargin.toFixed(1)}%`}
											color={Number(realBudgetProfit) >= 0 ? '#2e7d32' : '#d32f2f'}
										/>
										<KpiCard
											icon={<UtilisationIcon fontSize="small" />}
											label={t.analytics.budgetGap}
											value={`${formatNumber(realBudgetGap)} MAD`}
											sub={`${realBudgetGapPercent.toFixed(1)}%`}
											color={Number(realBudgetGap) >= 0 ? '#0288d1' : '#d32f2f'}
										/>
									</Box>
								)}

								<Card elevation={2}>
									<CardContent>
										<Stack spacing={1.5}>
											<Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
												<Typography variant="subtitle2" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
													{t.analytics.budgetUtilisation}
												</Typography>
												<Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'success.main' }}>
													{budgetUtilisation.toFixed(1)}%
												</Typography>
											</Stack>
											<LinearProgress
												variant="determinate"
												value={clampPercent(budgetUtilisation)}
												sx={{
													height: 18,
													borderRadius: 0,
													bgcolor: 'rgba(29, 78, 216, 0.18)',
													'& .MuiLinearProgress-bar': {
														bgcolor: '#1d4ed8',
													},
												}}
											/>
										</Stack>
									</CardContent>
								</Card>

								{projectOverview ? (
									<Stack spacing={2}>
										{showInternalFinancials && (
											<ChartCard title={t.analytics.realBudgetByStage} subheader={t.analytics.realBudgetByStageSub} height={330}>
												{activeRealBudgetByStage.length > 0 ? (
													<Bar data={realBudgetStageData} options={groupedBarOptions} />
												) : (
													<EmptyChart />
												)}
											</ChartCard>
										)}
										<ChartCard title={t.analytics.cumulativeIncomeExpenses} subheader={projectOverview.nom} height={340}>
											{activeHistoryData.labels.length > 0 ? (
												<Line data={activeHistoryData} options={areaChartOptions} />
											) : (
												<EmptyChart />
											)}
										</ChartCard>
										<Box
											sx={{
												display: 'grid',
												gridTemplateColumns: { xs: '1fr', md: showInternalFinancials ? '2fr 1fr' : '1fr' },
												gap: 2,
											}}
										>
											<ChartCard title={t.analytics.projectBudgetUtilization} subheader={projectOverview.nom} height={300}>
												<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ height: '100%', alignItems: 'center' }}>
													<Box sx={{ height: 230, width: { xs: '100%', sm: 230 }, position: 'relative' }}>
														<Doughnut data={projectBudgetData} options={{ ...doughnutOptions, plugins: { legend: { display: false } } }} />
														<Stack
															spacing={0.5}
															sx={{
																position: 'absolute',
																inset: 0,
																alignItems: 'center',
																justifyContent: 'center',
																pointerEvents: 'none',
															}}
														>
															<Typography variant="h5" sx={{ fontWeight: 700 }}>
																{projectBudgetUsed.toFixed(1)}%
															</Typography>
															<Typography variant="caption" sx={{ color: 'text.secondary' }}>
																{projectBudgetUtilisation <= 100 ? t.analytics.withinBudget : t.analytics.overBudget}
															</Typography>
														</Stack>
													</Box>
													<Stack spacing={1.25} sx={{ flex: 1, minWidth: 0 }}>
														<Typography variant="body2">
															{t.analytics.totalBudget}: <strong>{compactCurrency(totalBudget)}</strong>
														</Typography>
														<Typography variant="body2">
															{t.analytics.totalExpenses}: <strong>{compactCurrency(totalExpenses)}</strong>
														</Typography>
														<Typography variant="body2">
															{t.analytics.usedBudget}: <strong>{projectBudgetUsed.toFixed(1)}%</strong>
														</Typography>
													</Stack>
												</Stack>
											</ChartCard>
											{showInternalFinancials && (
												<ChartCard title={t.analytics.profitGauge} subheader={t.analytics.profitMargin} height={300}>
													<Box sx={{ height: '100%', position: 'relative' }}>
														<Doughnut data={projectProfitData} options={{ ...doughnutOptions, plugins: { legend: { display: false } } }} />
														<Stack
															spacing={0.5}
															sx={{
																position: 'absolute',
																inset: 0,
																alignItems: 'center',
																justifyContent: 'center',
																pointerEvents: 'none',
															}}
														>
															<Typography variant="h6" sx={{ fontWeight: 700 }}>
																{compactCurrency(totalProfit)}
															</Typography>
															<Typography variant="caption" sx={{ color: 'text.secondary' }}>
																{totalMargin.toFixed(1)}%
															</Typography>
														</Stack>
													</Box>
												</ChartCard>
											)}
										</Box>
										<Box
											sx={{
												display: 'grid',
												gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, 1fr)' },
												gap: 2,
											}}
										>
											<ChartCard title={t.analytics.costByCategory} height={300}>
												{activeTopCategories.length > 0 ? (
													<Bar data={projectTopCategoriesData} options={horizontalBarOptions} />
												) : (
													<EmptyChart />
												)}
											</ChartCard>
											<ChartCard title={t.analytics.costBySubcategory} height={300}>
												{activeTopSubcategories.length > 0 ? (
													<Bar data={projectTopSubcategoriesData} options={horizontalBarOptions} />
												) : (
													<EmptyChart />
												)}
											</ChartCard>
											<ChartCard title={t.analytics.costByVendor} height={300}>
												{activeTopVendors.length > 0 ? (
													<Bar data={projectTopVendorsData} options={horizontalBarOptions} />
												) : (
													<EmptyChart />
												)}
											</ChartCard>
										</Box>
									</Stack>
								) : (
									<>
										{showInternalFinancials && (
											<ChartCard title={t.analytics.realBudgetByStage} subheader={t.analytics.realBudgetByStageSub} height={330}>
												{activeRealBudgetByStage.length > 0 ? (
													<Bar data={realBudgetStageData} options={groupedBarOptions} />
												) : (
													<EmptyChart />
												)}
											</ChartCard>
										)}
										<Box
											sx={{
												display: 'grid',
												gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, 1fr)' },
												gap: 2,
											}}
										>
											<ChartCard title={t.analytics.categoryBreakdown} height={300}>
												{activeTopCategories.length > 0 ? (
													<Doughnut data={categoryBreakdownData} options={doughnutOptions} />
												) : (
													<EmptyChart />
												)}
											</ChartCard>
											<ChartCard title={t.analytics.subcategoryBreakdown} height={300}>
												{activeTopSubcategories.length > 0 ? (
													<Doughnut data={subcategoryBreakdownData} options={doughnutOptions} />
												) : (
													<EmptyChart />
												)}
											</ChartCard>
											<ChartCard title={t.analytics.vendorBreakdown} height={300}>
												{activeTopVendors.length > 0 ? (
													<Doughnut data={vendorBreakdownData} options={doughnutOptions} />
												) : (
													<EmptyChart />
												)}
											</ChartCard>
										</Box>

										<Box
											sx={{
												display: 'grid',
												gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
												gap: 2,
											}}
										>
											<ChartCard title={t.analytics.expenseIncome} subheader={t.analytics.expenseIncomeSub} height={340}>
												{activeHistoryData.labels.length > 0 ? (
													<Line data={activeHistoryData} options={areaChartOptions} />
												) : (
													<EmptyChart />
												)}
											</ChartCard>
											<ChartCard title={t.analytics.projectRanking} subheader={t.analytics.projectRankingSub} height={340}>
												{topBudgetProjects.length > 0 ? (
													<Bar data={projectRankingData} options={horizontalBarOptions} />
												) : (
													<EmptyChart />
												)}
											</ChartCard>
										</Box>
									</>
								)}

								{/* ── Top clients ─────────────────────────── */}
								{!projectOverview && (
									<Box
										sx={{
											display: 'grid',
											gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
											gap: 2,
										}}
									>
										<ChartCard title={t.analytics.topExpenseClients} subheader={t.analytics.topExpenseClientsSub} height={280}>
											{topExpenseClients.length > 0 ? (
												<Bar data={topExpenseClientsData} options={horizontalBarOptions} />
											) : (
												<EmptyChart />
											)}
										</ChartCard>
										<ChartCard title={t.analytics.topRevenueClients} subheader={t.analytics.topRevenueClientsSub} height={280}>
											{topRevenueClients.length > 0 ? (
												<Bar data={topRevenueClientsData} options={horizontalBarOptions} />
											) : (
												<EmptyChart />
											)}
										</ChartCard>
									</Box>
								)}
							</Stack>
						)}
					</Box>
				</Protected>
			</NavigationBar>
		</Stack>
	);
};

export default ProjectDashboardClient;
