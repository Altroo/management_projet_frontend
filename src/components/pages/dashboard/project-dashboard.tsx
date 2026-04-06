'use client';

import React, { useMemo } from 'react';
import {
	Box,
	Card,
	CardContent,
	CardHeader,
	Typography,
	CircularProgress,
	Stack,
	IconButton,
	Tooltip as MuiTooltip,
} from '@mui/material';
import {
	AccountTree as ProjectsIcon,
	AccountBalanceWallet as BudgetIcon,
	TrendingUp as RevenueIcon,
	TrendingDown as ExpensesIcon,
	Savings as ProfitIcon,
	PieChart as MarginIcon,
	Speed as UtilisationIcon,
	InfoOutlined as InfoIcon,
} from '@mui/icons-material';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	ArcElement,
	Title,
	Tooltip,
	Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { useGetMultiProjectDashboardQuery } from '@/store/services/project';
import { useInitAccessToken } from '@/contexts/InitContext';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import { useLanguage } from '@/utils/hooks';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import type { SessionProps } from '@/types/_initTypes';
import { CHART_COLORS, PROJECT_COLORS, CHART_OPTS, STATUS_CHIP_COLORS } from '@/utils/rawData';
import { formatNumber } from '@/utils/helpers';

ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	ArcElement,
	Title,
	Tooltip,
	Legend,
);

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
			<Stack direction="row" justifyContent="space-between" alignItems="flex-start">
				<Stack direction="row" spacing={1.5} alignItems="center" mb={0.5}>
					<Box sx={{ color, display: 'flex' }}>{icon}</Box>
					<Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing={0.8}>
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
			<Typography variant="h5" fontWeight={700}>
				{value}
			</Typography>
			{sub && (
				<Typography variant="body2" color="text.secondary">
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
			title={<Typography variant="h6" sx={{ fontSize: { xs: '0.95rem', md: '1.1rem' } }}>{title}</Typography>}
			subheader={subheader && <Typography variant="caption" color="text.secondary">{subheader}</Typography>}
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
			display="flex"
			flexDirection="column"
			justifyContent="center"
			alignItems="center"
			height="100%"
			sx={{ bgcolor: 'grey.50', borderRadius: 2, border: '1px dashed', borderColor: 'grey.300' }}
		>
			<Typography variant="h6" color="text.secondary" gutterBottom>
				📊
			</Typography>
			<Typography variant="body2" color="text.secondary" textAlign="center">
				{message ?? t.analytics.noDataAvailable}
			</Typography>
		</Box>
	);
};

const ProjectDashboardClient: React.FC<SessionProps> = ({ session }) => {
	const { t } = useLanguage();
	const token = useInitAccessToken(session);

	const { data, isLoading } = useGetMultiProjectDashboardQuery(undefined, { skip: !token });

	const totalProjects = data?.total_projects ?? 0;
	const totalBudget = data?.total_budget ?? '0';
	const totalRevenue = data?.total_revenue ?? '0';
	const totalExpenses = data?.total_expenses ?? '0';
	const totalProfit = data?.total_profit ?? '0';
	const totalMargin = data?.total_margin ?? 0;
	const budgetUtilisation = data?.budget_utilisation ?? 0;
	const projects = data?.projects ?? [];

	// Status distribution for doughnut
	const statusCounts = useMemo(() => {
		const counts: Record<string, number> = {};
		projects.forEach((p) => {
			const status = typeof p.status === 'string' ? p.status : p.status;
			counts[status] = (counts[status] ?? 0) + 1;
		});
		return counts;
	}, [projects]);

	const statusLabels = Object.keys(statusCounts);
	const statusData = Object.values(statusCounts);
	const statusColors = statusLabels.map((s) => {
		const chipColor = STATUS_CHIP_COLORS[s];
		switch (chipColor) {
			case 'success': return 'rgba(46, 125, 50, 0.8)';
			case 'info': return 'rgba(2, 136, 209, 0.8)';
			case 'warning': return 'rgba(237, 108, 2, 0.8)';
			default: return 'rgba(158, 158, 158, 0.8)';
		}
	});

	// Budget vs Actual bar chart
	const budgetVsActualData = {
		labels: projects.map((p) => p.nom),
		datasets: [
			{
				label: t.analytics.budget,
				data: projects.map((p) => Number(p.budget_total)),
				backgroundColor: CHART_COLORS.primary,
				borderRadius: 4,
			},
			{
				label: t.analytics.revenue,
				data: projects.map((p) => Number(p.revenue)),
				backgroundColor: CHART_COLORS.secondary,
				borderRadius: 4,
			},
			{
				label: t.analytics.expenses,
				data: projects.map((p) => Number(p.expenses)),
				backgroundColor: CHART_COLORS.error,
				borderRadius: 4,
			},
		],
	};

	// Profit by project bar chart
	const profitChartData = {
		labels: projects.map((p) => p.nom),
		datasets: [
			{
				label: t.analytics.profit,
				data: projects.map((p) => Number(p.profit)),
				backgroundColor: projects.map((p) =>
					Number(p.profit) >= 0 ? CHART_COLORS.secondary : CHART_COLORS.error,
				),
				borderRadius: 4,
			},
		],
	};

	// Status distribution doughnut
	const statusChartData = {
		labels: statusLabels,
		datasets: [
			{
				data: statusData,
				backgroundColor: statusColors,
				borderWidth: 1,
			},
		],
	};

	return (
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} mt="48px">
			<NavigationBar title={t.common.dashboard}>
				<Protected permission="can_view">
					<Box sx={{ px: { xs: 1, sm: 2, md: 3 }, pb: 4, pt: '10px' }}>
						{/* Title */}
						<Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
							<Typography variant="h5" fontWeight={600}>
								{t.analytics.overviewTitle}
							</Typography>
						</Stack>

						{isLoading ? (
							<Box display="flex" justifyContent="center" py={8}>
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
									<KpiCard
										icon={<ProjectsIcon fontSize="small" />}
										label={t.analytics.totalProjects}
										value={totalProjects.toString()}
										color="#1976d2"
									/>
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
								</Box>

								{/* ── Profit & Margin KPIs ───────────────── */}
								<Box
									sx={{
										display: 'grid',
										gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
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
								</Box>

								{/* ── Budget vs Actual Bar ────────────────── */}
								<ChartCard
									title={t.analytics.budgetVsActual}
									subheader={t.analytics.budgetVsActualSub}
									height={320}
								>
									{projects.length > 0 ? (
										<Bar
											data={budgetVsActualData}
											options={{
												...CHART_OPTS,
												plugins: {
													legend: { position: 'top' as const },
												},
												scales: {
													y: { beginAtZero: true },
												},
											}}
										/>
									) : (
										<EmptyChart />
									)}
								</ChartCard>

								{/* ── Profit by Project + Status Distribution ── */}
								<Box
									sx={{
										display: 'grid',
										gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
										gap: 2,
									}}
								>
									<ChartCard
										title={t.analytics.profitByProject}
										subheader={t.analytics.profitByProjectSub}
										height={280}
									>
										{projects.length > 0 ? (
											<Bar
												data={profitChartData}
												options={{
													...CHART_OPTS,
													plugins: { legend: { display: false } },
													scales: { y: { beginAtZero: true } },
												}}
											/>
										) : (
											<EmptyChart />
										)}
									</ChartCard>

									<ChartCard
										title={t.analytics.statusDistribution}
										subheader={t.analytics.statusDistributionSub}
										height={280}
									>
										{statusLabels.length > 0 ? (
											<Doughnut
												data={statusChartData}
												options={{
													...CHART_OPTS,
													plugins: {
														legend: { position: 'bottom' as const },
													},
												}}
											/>
										) : (
											<EmptyChart />
										)}
									</ChartCard>
								</Box>
							</Stack>
						)}
					</Box>
				</Protected>
			</NavigationBar>
		</Stack>
	);
};

export default ProjectDashboardClient;
