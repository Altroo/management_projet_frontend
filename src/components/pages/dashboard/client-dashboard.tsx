'use client';

import React from 'react';
import { Box, Card, CardContent, CardHeader, CircularProgress, Stack, Typography } from '@mui/material';
import {
	AccountTree as ProjectsIcon,
	ReceiptLong as ServiceFeeIcon,
	TrendingDown as ExpensesIcon,
	TrendingUp as RevenueIcon,
} from '@mui/icons-material';
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Title, Tooltip } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useGetClientDashboardQuery } from '@/store/services/project';
import { useInitAccessToken } from '@/contexts/InitContext';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import SummaryKpiCard from '@/components/shared/summaryKpiCard/summaryKpiCard';
import { useLanguage } from '@/utils/hooks';
import { CHART_COLORS, CHART_OPTS } from '@/utils/rawData';
import { formatNumber } from '@/utils/helpers';
import Styles from '@/styles/dashboard/dashboard.module.sass';
import type { SessionProps } from '@/types/_initTypes';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ClientChartCard: React.FC<{ title: string; subheader: string; children: React.ReactNode }> = ({
	title,
	subheader,
	children,
}) => (
	<Card elevation={2}>
		<CardHeader
			title={<Typography variant="h6">{title}</Typography>}
			subheader={
				<Typography variant="caption" sx={{ color: 'text.secondary' }}>
					{subheader}
				</Typography>
			}
			sx={{ pb: 0 }}
		/>
		<CardContent>
			<Box sx={{ height: 320 }}>{children}</Box>
		</CardContent>
	</Card>
);

const EmptyChart: React.FC = () => {
	const { t } = useLanguage();
	return (
		<Box
			sx={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				height: '100%',
				border: '1px dashed',
				borderColor: 'grey.300',
				borderRadius: 2,
				bgcolor: 'grey.50',
			}}
		>
			<Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
				{t.analytics.noDataAvailable}
			</Typography>
		</Box>
	);
};

const ClientDashboardClient: React.FC<SessionProps> = ({ session }) => {
	const { t } = useLanguage();
	const token = useInitAccessToken(session);
	const { data, isLoading } = useGetClientDashboardQuery(undefined, { skip: !token });
	const topClients = data?.top_clients_revenue_reelle ?? [];
	const revenueReelleByClientData = {
		labels: topClients.map((item) => item.client),
		datasets: [
			{
				label: t.analytics.revenueReelle,
				data: topClients.map((item) => Number(item.revenue_reelle)),
				backgroundColor: CHART_COLORS.secondary,
				borderRadius: 4,
			},
			{
				label: t.analytics.serviceFees,
				data: topClients.map((item) => Number(item.service_fees)),
				backgroundColor: CHART_COLORS.primary,
				borderRadius: 4,
			},
		],
	};

	return (
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} sx={{ mt: '48px' }}>
			<NavigationBar title={t.analytics.clientDashboard}>
				<Protected permission="can_view">
					<Box sx={{ px: { xs: 1, sm: 2, md: 3 }, pb: 4, pt: '10px' }}>
						<Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
							{t.analytics.clientDashboard}
						</Typography>

						{isLoading ? (
							<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
								<CircularProgress />
							</Box>
						) : (
							<Stack spacing={3}>
								<Box
									sx={{
										display: 'grid',
										gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
										gap: 2,
									}}
								>
									<SummaryKpiCard
										icon={<ProjectsIcon />}
										label={t.analytics.totalProjects}
										value={String(data?.total_projects ?? 0)}
										color="#1976d2"
									/>
									<SummaryKpiCard
										icon={<RevenueIcon />}
										label={t.analytics.totalRevenue}
										value={`${formatNumber(data?.total_revenue ?? '0')} MAD`}
										color="#2e7d32"
									/>
									<SummaryKpiCard
										icon={<ServiceFeeIcon />}
										label={t.analytics.serviceFees}
										value={`${formatNumber(data?.total_service_fees ?? '0')} MAD`}
										color="#1976d2"
									/>
									<SummaryKpiCard
										icon={<RevenueIcon />}
										label={t.analytics.revenueReelle}
										value={`${formatNumber(data?.total_revenue_reelle ?? '0')} MAD`}
										color="#0288d1"
									/>
								</Box>
								<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(280px, 380px)' }, gap: 2 }}>
									<SummaryKpiCard
										icon={<ExpensesIcon />}
										label={t.analytics.totalExpenses}
										value={`${formatNumber(data?.total_expenses ?? '0')} MAD`}
										color="#d32f2f"
									/>
								</Box>
								<ClientChartCard
									title={t.analytics.revenueReelleByClient}
									subheader={t.analytics.revenueReelleByClientSub}
								>
									{topClients.length > 0 ? (
										<Bar
											data={revenueReelleByClientData}
											options={{
												...CHART_OPTS,
												indexAxis: 'y' as const,
												plugins: { legend: { position: 'top' as const } },
												scales: { x: { beginAtZero: true } },
											}}
										/>
									) : (
										<EmptyChart />
									)}
								</ClientChartCard>
							</Stack>
						)}
					</Box>
				</Protected>
			</NavigationBar>
		</Stack>
	);
};

export default ClientDashboardClient;
