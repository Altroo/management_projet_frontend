'use client';

import React from 'react';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';

interface SummaryKpiCardProps {
	icon: React.ReactNode;
	label: string;
	value: string;
	color: string;
	testId?: string;
}

const SummaryKpiCard: React.FC<SummaryKpiCardProps> = ({ icon, label, value, color, testId }) => (
	<Card
		elevation={2}
		data-testid={testId}
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
			<Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1 }}>
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
			<Typography variant="h5" sx={{ fontWeight: 700, wordBreak: 'break-word' }}>
				{value}
			</Typography>
		</CardContent>
	</Card>
);

export default SummaryKpiCard;