'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Divider,
	InputAdornment,
	Stack,
	Typography,
} from '@mui/material';
import {
	Add as AddIcon,
	ArrowBack as ArrowBackIcon,
	AttachMoney as AttachMoneyIcon,
	CalendarMonth as CalendarMonthIcon,
	Edit as EditIcon,
	Notes as NotesIcon,
	Assignment as AssignmentIcon,
	Warning as WarningIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { format, parseISO } from 'date-fns';
import type { SessionProps } from '@/types/_initTypes';
import type { RevenueFormValues } from '@/types/projectTypes';
import type { DropDownType } from '@/types/accountTypes';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import CustomAutoCompleteSelect from '@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { textInputTheme } from '@/utils/themes';
import { revenueSchema } from '@/utils/formValidationSchemas';
import { getLabelForKey, setFormikAutoErrors } from '@/utils/helpers';
import { REVENUES_LIST } from '@/utils/routes';
import { useToast, useLanguage } from '@/utils/hooks';
import { useCreateRevenueMutation, useUpdateRevenueMutation, useGetRevenueQuery, useGetProjectsListQuery } from '@/store/services/project';
import { useInitAccessToken } from '@/contexts/InitContext';
import Styles from '@/styles/dashboard/dashboard.module.sass';

const inputTheme = textInputTheme();

type FormikContentProps = {
	token: string | undefined;
	id?: number;
};

const FormikContent: React.FC<FormikContentProps> = ({ token, id }) => {
	const { t } = useLanguage();
	const { onSuccess, onError } = useToast();
	const isEditMode = id !== undefined;
	const router = useRouter();

	const { data: rawData } = useGetRevenueQuery(
		{ id: id! },
		{ skip: !token || !isEditMode },
	);

	const { data: projectsData } = useGetProjectsListQuery({}, { skip: !token });

	const projectItems: DropDownType[] = useMemo(() => {
		const projects = Array.isArray(projectsData) ? projectsData : (projectsData && 'results' in projectsData ? projectsData.results : []);
		return projects.map((p) => ({ code: String(p.id), value: p.nom }));
	}, [projectsData]);

	const [createRevenue, { isLoading: isCreateLoading }] = useCreateRevenueMutation();
	const [updateRevenue, { isLoading: isUpdateLoading }] = useUpdateRevenueMutation();
	const [isPending, setIsPending] = useState(false);

	const formik = useFormik<RevenueFormValues>({
		initialValues: {
			project: rawData?.project ?? '',
			date: rawData?.date ?? '',
			description: rawData?.description ?? '',
			montant: rawData?.montant ?? '',
			notes: rawData?.notes ?? '',
			globalError: '',
		},
		enableReinitialize: true,
		validateOnMount: false,
		validationSchema: toFormikValidationSchema(revenueSchema),
		onSubmit: async (data, { setFieldError }) => {
			setIsPending(true);
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { globalError, ...fields } = data;
			try {
				if (isEditMode) {
					await updateRevenue({ id: id!, data: fields }).unwrap();
					onSuccess(t.revenues.revenueUpdatedSuccess);
				} else {
					await createRevenue({ data: fields }).unwrap();
					onSuccess(t.revenues.revenueAddedSuccess);
				}
				router.push(REVENUES_LIST);
			} catch (e) {
				setFormikAutoErrors({ e, setFieldError });
				onError(isEditMode ? t.revenues.revenueUpdateError : t.revenues.revenueAddError);
			} finally {
				setIsPending(false);
			}
		},
	});

	const selectedProject = projectItems.find((p) => p.code === String(formik.values.project)) ?? null;

	const validationEntries = Object.entries(formik.errors).filter(([k]) => k !== 'globalError') as [string, string][];
	const hasValidationErrors = validationEntries.length > 0;
	const showValidationAlert = hasValidationErrors && formik.submitCount > 0;

	const isLoading = isCreateLoading || isUpdateLoading || isPending;

	return (
		<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
			<Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
				<Stack direction="row" justifyContent="space-between">
					<Button
						variant="outlined"
						startIcon={<ArrowBackIcon />}
						onClick={() => router.push(REVENUES_LIST)}
						sx={{ whiteSpace: 'nowrap' }}
					>
						{t.revenues.revenuesList}
					</Button>
				</Stack>

				{showValidationAlert && (
					<Alert severity="error" icon={<WarningIcon />}>
						<Typography variant="subtitle2" fontWeight={600}>
							{t.common.validationErrorsDetected}
						</Typography>
						<ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
							{validationEntries.map(([key, err]) => (
								<li key={key}>
									<Typography variant="body2">
										<strong>{getLabelForKey(t.rawData.fieldLabels.revenue, key)}</strong> : {err}
									</Typography>
								</li>
							))}
						</ul>
					</Alert>
				)}

				{isLoading && <ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />}

				<form onSubmit={formik.handleSubmit}>
					<Stack spacing={3}>
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
									<AttachMoneyIcon color="primary" />
									<Typography variant="h6" fontWeight={700}>
										{t.revenues.revenueDetails}
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Stack spacing={2.5}>
									<CustomAutoCompleteSelect
										id="project"
										size="small"
										noOptionsText={t.projects.noProjectFound}
										label={`${t.common.project} *`}
										items={projectItems}
										theme={inputTheme}
										value={selectedProject}
										fullWidth
										onChange={(_, newVal) => {
											formik.setFieldValue('project', newVal ? Number(newVal.code) : '');
										}}
										onBlur={formik.handleBlur('project')}
										error={formik.submitCount > 0 && Boolean(formik.errors.project)}
										helperText={formik.submitCount > 0 ? ((formik.errors.project as string) ?? '') : ''}
										startIcon={<AssignmentIcon fontSize="small" />}
									/>
									<CustomTextInput
										theme={inputTheme}
										id="description"
										type="text"
										size="small"
										label={`${t.common.description} *`}
										value={formik.values.description}
										onChange={formik.handleChange('description')}
										onBlur={formik.handleBlur('description')}
										error={formik.submitCount > 0 && Boolean(formik.errors.description)}
										helperText={formik.submitCount > 0 ? (formik.errors.description ?? '') : ''}
										fullWidth
										startIcon={<NotesIcon fontSize="small" />}
									/>
									<Stack direction="row" spacing={2}>
										<CustomTextInput
											theme={inputTheme}
											id="montant"
											type="text"
											size="small"
											label={`${t.common.amount} (MAD) *`}
											value={formik.values.montant}
											onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
												if (/^(0|[1-9]\d*)?([.,]\d*)?$/.test(e.target.value))
													formik.setFieldValue('montant', e.target.value);
											}}
											onBlur={formik.handleBlur('montant')}
											error={formik.submitCount > 0 && Boolean(formik.errors.montant)}
											helperText={formik.submitCount > 0 ? (formik.errors.montant ?? '') : ''}
											fullWidth
											startIcon={<AttachMoneyIcon fontSize="small" />}
											slotProps={{ input: { inputProps: { inputMode: 'decimal' } } }}
										/>
										<DatePicker
											label={`${t.common.date} *`}
											value={formik.values.date ? parseISO(formik.values.date) : null}
											onChange={(date) =>
												formik.setFieldValue('date', date ? format(date, 'yyyy-MM-dd') : '')
											}
											disabled={isLoading}
											slotProps={{
												textField: {
													size: 'small',
													fullWidth: true,
													onBlur: formik.handleBlur('date'),
													error: formik.submitCount > 0 && Boolean(formik.errors.date),
													helperText: formik.submitCount > 0 ? (formik.errors.date ?? '') : '',
													InputProps: {
														startAdornment: (
															<InputAdornment position="start">
																<CalendarMonthIcon fontSize="small" />
															</InputAdornment>
														),
													},
												},
											}}
										/>
									</Stack>
									<CustomTextInput
										theme={inputTheme}
										id="notes"
										type="text"
										size="small"
										label={t.common.notes}
										value={formik.values.notes}
										onChange={formik.handleChange('notes')}
										onBlur={formik.handleBlur('notes')}
										error={formik.submitCount > 0 && Boolean(formik.errors.notes)}
										helperText={formik.submitCount > 0 ? (formik.errors.notes ?? '') : ''}
										fullWidth
										multiline
										rows={3}
										startIcon={<NotesIcon fontSize="small" />}
									/>
								</Stack>
							</CardContent>
						</Card>

						<Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
							<PrimaryLoadingButton
								buttonText={isEditMode ? t.common.update : t.revenues.newRevenue}
								loading={isPending}
								active={!isPending}
								type="submit"
								startIcon={isEditMode ? <EditIcon /> : <AddIcon />}							onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
								if (!formik.isValid) {
									e.preventDefault();
									formik.handleSubmit();
									onError(t.users.fixValidationErrors);
									window.scrollTo({ top: 0, behavior: 'smooth' });
								}
							}}								cssClass={Styles.submitButton}
							/>
						</Box>
					</Stack>
				</form>
			</Stack>
		</LocalizationProvider>
	);
};

const RevenueFormClient: React.FC<SessionProps & { id?: number }> = ({ session, id }) => {
	const token = useInitAccessToken(session);
	const { t } = useLanguage();
	const title = id !== undefined ? t.revenues.editRevenue : t.revenues.newRevenue;

	return (
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} mt="48px">
			<NavigationBar title={title}>
				<Protected permission={id !== undefined ? 'can_edit' : 'can_create'}>
					<FormikContent token={token} id={id} />
				</Protected>
			</NavigationBar>
		</Stack>
	);
};

export default RevenueFormClient;
