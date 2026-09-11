'use client';

import React, { useMemo, useState } from 'react';
import {
	Alert,
	Button,
	Card,
	CardContent,
	CircularProgress,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import { PictureAsPdf as PictureAsPdfIcon } from '@mui/icons-material';
import type { SessionProps } from '@/types/_initTypes';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import PdfLanguageModal from '@/components/shared/pdfLanguageModal/pdfLanguageModal';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useGetProjectsListQuery } from '@/store/services/project';
import { fetchFileBlob } from '@/utils/apiHelpers';
import { extractApiErrorMessage } from '@/utils/helpers';
import { useLanguage, useToast } from '@/utils/hooks';
import { REPORTS_PDF, type PdfLanguage } from '@/utils/routes';

const currentYearPeriod = () => {
	const year = new Date().getFullYear();
	return { dateFrom: `${year}-01-01`, dateTo: `${year}-12-31` };
};

const ReportsClient: React.FC<SessionProps> = ({ session }) => {
	const { t } = useLanguage();
	const { onError } = useToast();
	const token = useInitAccessToken(session);
	const initialPeriod = useMemo(currentYearPeriod, []);
	const [dateFrom, setDateFrom] = useState(initialPeriod.dateFrom);
	const [dateTo, setDateTo] = useState(initialPeriod.dateTo);
	const [projectId, setProjectId] = useState<number | ''>('');
	const [showLanguageModal, setShowLanguageModal] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const { data: projectsData, isLoading: projectsLoading } = useGetProjectsListQuery(
		{ with_pagination: false },
		{ skip: !token },
	);
	const projects = Array.isArray(projectsData) ? projectsData : (projectsData?.results ?? []);
	const periodIsValid = Boolean(dateFrom && dateTo && dateFrom <= dateTo);

	const generateReport = async (language: PdfLanguage) => {
		if (!token || !periodIsValid) return;
		setShowLanguageModal(false);
		setIsGenerating(true);
		try {
			const blob = await fetchFileBlob(
				REPORTS_PDF(language, {
					dateFrom,
					dateTo,
					projectId: projectId || undefined,
				}),
				token,
			);
			const blobUrl = window.URL.createObjectURL(blob);
			window.open(blobUrl, '_blank');
			setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60_000);
		} catch (error) {
			onError(extractApiErrorMessage(error, t.reports.generationError));
		} finally {
			setIsGenerating(false);
		}
	};

	return (
		<NavigationBar title={t.reports.title}>
			<Protected permission="can_print">
				<Stack spacing={3} sx={{ p: { xs: 2, md: 3 }, mt: 2, maxWidth: 900 }}>
					<Stack spacing={0.5}>
						<Typography variant="h5" sx={{ fontWeight: 700 }}>
							{t.reports.title}
						</Typography>
						<Typography color="text.secondary">{t.reports.description}</Typography>
					</Stack>
					<Card elevation={2}>
						<CardContent>
							<Stack spacing={3}>
								<Alert severity="info">{t.reports.periodHelp}</Alert>
								<Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
									<TextField
										fullWidth
										type="date"
										label={t.reports.startDate}
										value={dateFrom}
										onChange={(event) => setDateFrom(event.target.value)}
										slotProps={{ inputLabel: { shrink: true } }}
									/>
									<TextField
										fullWidth
										type="date"
										label={t.reports.endDate}
										value={dateTo}
										onChange={(event) => setDateTo(event.target.value)}
										slotProps={{ inputLabel: { shrink: true } }}
									/>
								</Stack>
								{!periodIsValid && <Alert severity="error">{t.reports.invalidPeriod}</Alert>}
								<FormControl fullWidth>
									<InputLabel id="report-scope-label">{t.reports.scope}</InputLabel>
									<Select
										labelId="report-scope-label"
										label={t.reports.scope}
										value={projectId}
										onChange={(event) => {
											const value = event.target.value as number | string;
											setProjectId(value === '' ? '' : Number(value));
										}}
										disabled={projectsLoading}
									>
										<MenuItem value="">{t.reports.allProjects}</MenuItem>
										{projects.map((project) => (
											<MenuItem key={project.id} value={project.id}>
												{project.nom}
											</MenuItem>
										))}
									</Select>
								</FormControl>
								<Button
									variant="contained"
									startIcon={isGenerating ? <CircularProgress size={18} color="inherit" /> : <PictureAsPdfIcon />}
									disabled={!token || !periodIsValid || isGenerating}
									onClick={() => setShowLanguageModal(true)}
									sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
								>
									{t.reports.generate}
								</Button>
							</Stack>
						</CardContent>
					</Card>
				</Stack>
				{showLanguageModal && (
					<PdfLanguageModal onSelectLanguage={generateReport} onClose={() => setShowLanguageModal(false)} />
				)}
			</Protected>
		</NavigationBar>
	);
};

export default ReportsClient;
