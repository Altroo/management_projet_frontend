'use client';

import React from 'react';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Home as HomeIcon, SentimentDissatisfied as SadIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { DASHBOARD } from '@/utils/routes';
import { useLanguage } from '@/utils/hooks';

const NotFound = () => {
	const router = useRouter();
	const { t } = useLanguage();

	const handleGoHome = () => {
		router.push(DASHBOARD);
	};

	const handleGoBack = () => {
		router.back();
	};

	return (
		<Box
			sx={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				minHeight: '100vh',
				backgroundColor: 'background.default',
				p: 3,
			}}
		>
			<Paper
				elevation={3}
				sx={{
					p: { xs: 3, sm: 5 },
					maxWidth: 500,
					textAlign: 'center',
					borderRadius: 2,
				}}
			>
				<SadIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
				<Typography
					variant="h1"
					sx={{ fontSize: { xs: '4rem', sm: '6rem' }, fontWeight: 700, color: 'primary.main', mb: 1 }}
				>
					404
				</Typography>
				<Typography variant="h5" gutterBottom sx={{ fontWeight: 500 }}>
					{t.notFound.title}
				</Typography>
				<Typography
					variant="body1"
					sx={{
						color: 'text.secondary',
						mb: 4,
					}}
				>
					{t.notFound.message}
				</Typography>
				<Stack
					direction={{ xs: 'column', sm: 'row' }}
					spacing={2}
					sx={{
						justifyContent: 'center',
					}}
				>
					<Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={handleGoBack} size="large">
						{t.notFound.backBtn}
					</Button>
					<Button variant="contained" startIcon={<HomeIcon />} onClick={handleGoHome} size="large">
						{t.notFound.homeBtn}
					</Button>
				</Stack>
			</Paper>
		</Box>
	);
};

export default NotFound;
