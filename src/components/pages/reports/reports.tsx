'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Box, Card, CardContent, Divider, InputAdornment, LinearProgress, Stack, Typography } from '@mui/material';
import { CalendarMonth as CalendarMonthIcon, PictureAsPdf as PictureAsPdfIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { SessionProps } from '@/types/_initTypes';
import type { DropDownType } from '@/types/accountTypes';
import type { ProjectListType } from '@/types/projectTypes';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import PdfLanguageModal from '@/components/shared/pdfLanguageModal/pdfLanguageModal';
import CustomAutoCompleteSelect from '@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import { useInitAccessToken } from '@/contexts/InitContext';
import { useGetProjectsListQuery } from '@/store/services/project';
import { extractApiErrorMessage } from '@/utils/helpers';
import { useLanguage, useToast } from '@/utils/hooks';
import { REPORTS_DOWNLOAD, type PdfLanguage } from '@/utils/routes';
import { downloadFileBlob } from '@/utils/fileDownload';
import { textInputTheme } from '@/utils/themes';
import Styles from '@/styles/dashboard/dashboard.module.sass';

const inputTheme = textInputTheme();
type GenerationStage = 'preparing' | 'downloading';

const currentYearPeriod = () => {
	const year = new Date().getFullYear();
	return { dateFrom: `${year}-01-01`, dateTo: `${year}-12-31` };
};

export const defaultReportStartDate = (
	projects: Pick<ProjectListType, 'id' | 'date_debut'>[],
	projectId: number | '',
	fallback: string,
) => {
	if (projectId) {
		return projects.find((project) => project.id === projectId)?.date_debut || fallback;
	}
	return (
		projects
			.map((project) => project.date_debut)
			.filter(Boolean)
			.sort()[0] || fallback
	);
};

const ReportsClient: React.FC<SessionProps> = ({ session }) => {
	const { t } = useLanguage();
	const { onError } = useToast();
	const token = useInitAccessToken(session);
	const initialPeriod = useMemo(currentYearPeriod, []);
	const [dateFrom, setDateFrom] = useState(initialPeriod.dateFrom);
	const [dateTo, setDateTo] = useState(initialPeriod.dateTo);
	const [projectId, setProjectId] = useState<number | ''>('');
	const startDateInitialized = useRef(false);
	const [showLanguageModal, setShowLanguageModal] = useState(false);
	const [generationStage, setGenerationStage] = useState<GenerationStage | null>(null);
	const [generatingLanguage, setGeneratingLanguage] = useState<PdfLanguage | null>(null);
	const [generationError, setGenerationError] = useState('');
	const { data: projectsData, isLoading: projectsLoading } = useGetProjectsListQuery(
		{ with_pagination: false },
		{ skip: !token },
	);
	const projects = useMemo(
		() => (Array.isArray(projectsData) ? projectsData : (projectsData?.results ?? [])),
		[projectsData],
	);
	const projectItems = useMemo<DropDownType[]>(() => {
		return [
			{ code: '', value: t.reports.allProjects },
			...projects.map((project) => ({ code: String(project.id), value: project.nom })),
		];
	}, [projects, t.reports.allProjects]);
	const selectedProject = projectItems.find((project) => project.code === String(projectId)) ?? projectItems[0];
	const periodIsValid = Boolean(dateFrom && dateTo && dateFrom <= dateTo);
	const isGenerating = generationStage !== null;
	const generatingLanguageLabel =
		generatingLanguage === 'en' ? t.aiAssistant.translateToEnglish : t.aiAssistant.translateToFrench;

	useEffect(() => {
		if (projectsData !== undefined && !projectsLoading && !startDateInitialized.current) {
			setDateFrom(defaultReportStartDate(projects, projectId, initialPeriod.dateFrom));
			startDateInitialized.current = true;
		}
	}, [initialPeriod.dateFrom, projectId, projects, projectsData, projectsLoading]);

	const generateReport = async (language: PdfLanguage) => {
		if (!token || !periodIsValid) return;
		setShowLanguageModal(false);
		setGenerationError('');
		setGeneratingLanguage(language);
		setGenerationStage('preparing');
		try {
			await downloadFileBlob(
				REPORTS_DOWNLOAD(language, {
					dateFrom,
					dateTo,
					projectId: projectId || undefined,
					projectName: projectId ? selectedProject?.value : undefined,
				}),
				{ onResponseReady: () => setGenerationStage('downloading') },
			);
		} catch (error) {
			const message = extractApiErrorMessage(error, t.reports.generationError);
			setGenerationError(message);
			onError(message);
		} finally {
			setGenerationStage(null);
			setGeneratingLanguage(null);
		}
	};

	return (
		<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
			<Stack direction="column" spacing={2} className={Styles.flexRootStack} sx={{ mt: '48px', overflowX: 'auto' }}>
				<NavigationBar title={t.reports.title}>
					<Protected permission="can_print">
						<Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
							<Card elevation={2} sx={{ borderRadius: 2 }}>
								<CardContent sx={{ p: 3 }}>
									<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
										<PictureAsPdfIcon color="primary" />
										<Typography variant="h6" sx={{ fontWeight: 700 }}>
											{t.reports.configuration}
										</Typography>
									</Stack>
									<Divider sx={{ mb: 3 }} />
									<Stack spacing={2.5}>
										<Alert severity="info">{t.reports.periodHelp}</Alert>
										<Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
											<DatePicker
												label={t.reports.startDate}
												value={dateFrom ? parseISO(dateFrom) : null}
												onChange={(value) => setDateFrom(value ? format(value, 'yyyy-MM-dd') : '')}
												slotProps={{
													textField: {
														size: 'small',
														fullWidth: true,
														slotProps: {
															input: {
																startAdornment: (
																	<InputAdornment position="start">
																		<CalendarMonthIcon fontSize="small" />
																	</InputAdornment>
																),
															},
														},
													},
												}}
											/>
											<DatePicker
												label={t.reports.endDate}
												value={dateTo ? parseISO(dateTo) : null}
												onChange={(value) => setDateTo(value ? format(value, 'yyyy-MM-dd') : '')}
												slotProps={{
													textField: {
														size: 'small',
														fullWidth: true,
														slotProps: {
															input: {
																startAdornment: (
																	<InputAdornment position="start">
																		<CalendarMonthIcon fontSize="small" />
																	</InputAdornment>
																),
															},
														},
													},
												}}
											/>
										</Stack>
										{!periodIsValid && <Alert severity="error">{t.reports.invalidPeriod}</Alert>}
										<CustomAutoCompleteSelect
											id="report-scope"
											size="small"
											label={t.reports.scope}
											items={projectItems}
											value={selectedProject}
											theme={inputTheme}
											noOptionsText={t.projects.noProjectFound}
											fullWidth
											disabled={projectsLoading}
											onChange={(_, value) => {
												const nextProjectId = value?.code ? Number(value.code) : '';
												setProjectId(nextProjectId);
												setDateFrom(defaultReportStartDate(projects, nextProjectId, initialPeriod.dateFrom));
											}}
										/>
									</Stack>
								</CardContent>
							</Card>
							{generationStage && (
								<Alert severity="info" icon={<PictureAsPdfIcon fontSize="inherit" />}>
									<Stack spacing={1} sx={{ minWidth: { sm: 420 } }}>
										<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
											{t.reports.preparingReport}: {generatingLanguageLabel}
										</Typography>
										<Typography variant="body2">
											{generationStage === 'preparing'
												? t.reports.translatingAndGenerating
												: t.reports.downloadingFile}
										</Typography>
										<LinearProgress aria-label={t.reports.generationProgress} />
										<Typography variant="caption" color="text.secondary">
											{t.reports.progressHelp}
										</Typography>
									</Stack>
								</Alert>
							)}
							{generationError && <Alert severity="error">{generationError}</Alert>}
							<Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
								<PrimaryLoadingButton
									buttonText={t.reports.generate}
									loading={isGenerating}
									active={Boolean(token && periodIsValid && !isGenerating)}
									type="button"
									startIcon={<PictureAsPdfIcon />}
									onClick={() => setShowLanguageModal(true)}
									cssClass={Styles.submitButton}
								/>
							</Box>
						</Stack>
						{showLanguageModal && (
							<PdfLanguageModal onSelectLanguage={generateReport} onClose={() => setShowLanguageModal(false)} />
						)}
					</Protected>
				</NavigationBar>
			</Stack>
		</LocalizationProvider>
	);
};

export default ReportsClient;
