'use client';

import React, { useState } from 'react';
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
	Person as PersonIcon,
	Phone as PhoneIcon,
	Email as EmailIcon,
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
import type { ProjectFormValues } from '@/types/projectTypes';
import type { DropDownType } from '@/types/accountTypes';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import CustomAutoCompleteSelect from '@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { textInputTheme } from '@/utils/themes';
import { projectSchema } from '@/utils/formValidationSchemas';
import { getLabelForKey, setFormikAutoErrors } from '@/utils/helpers';
import { PROJECTS_LIST } from '@/utils/routes';
import { useToast, useLanguage } from '@/utils/hooks';
import { useCreateProjectMutation, useUpdateProjectMutation, useGetProjectQuery } from '@/store/services/project';
import { useInitAccessToken } from '@/contexts/InitContext';
import { projectStatusItemsList } from '@/utils/rawData';
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

	const { data: rawData } = useGetProjectQuery(
		{ id: id! },
		{ skip: !token || !isEditMode },
	);

	const [createProject, { isLoading: isCreateLoading }] = useCreateProjectMutation();
	const [updateProject, { isLoading: isUpdateLoading }] = useUpdateProjectMutation();
	const [isPending, setIsPending] = useState(false);

	const statusItems: DropDownType[] = projectStatusItemsList(t).map((s) => ({ code: s.code, value: s.value }));

	const formik = useFormik<ProjectFormValues>({
		initialValues: {
			nom: rawData?.nom ?? '',
			description: rawData?.description ?? '',
			budget_total: rawData?.budget_total ?? '',
			date_debut: rawData?.date_debut ?? '',
			date_fin: rawData?.date_fin ?? '',
			status: rawData?.status ?? '',
			chef_de_projet: rawData?.chef_de_projet ?? '',
			nom_client: rawData?.nom_client ?? '',
			telephone_client: rawData?.telephone_client ?? '',
			email_client: rawData?.email_client ?? '',
			notes: rawData?.notes ?? '',
			globalError: '',
		},
		enableReinitialize: true,
		validateOnMount: false,
		validationSchema: toFormikValidationSchema(projectSchema),
		onSubmit: async (data, { setFieldError }) => {
			setIsPending(true);
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { globalError, ...fields } = data;
			try {
				if (isEditMode) {
					await updateProject({ id: id!, data: fields }).unwrap();
					onSuccess(t.projects.projectUpdatedSuccess);
				} else {
					await createProject({ data: fields }).unwrap();
					onSuccess(t.projects.projectAddedSuccess);
				}
				router.push(PROJECTS_LIST);
			} catch (e) {
				setFormikAutoErrors({ e, setFieldError });
				onError(isEditMode ? t.projects.projectUpdateError : t.projects.projectAddError);
			} finally {
				setIsPending(false);
			}
		},
	});

	const selectedStatus = statusItems.find((s) => s.code === formik.values.status) ?? null;

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
						onClick={() => router.push(PROJECTS_LIST)}
						sx={{ whiteSpace: 'nowrap' }}
					>
						{t.projects.projectsList}
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
										<strong>{getLabelForKey(t.rawData.fieldLabels.project, key)}</strong> : {err}
									</Typography>
								</li>
							))}
						</ul>
					</Alert>
				)}

				{isLoading && <ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />}

				<form onSubmit={formik.handleSubmit}>
					<Stack spacing={3}>
						{/* Project Info */}
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
									<AssignmentIcon color="primary" />
									<Typography variant="h6" fontWeight={700}>
										{t.projects.projectInfo}
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Stack spacing={2.5}>
									<CustomTextInput
										theme={inputTheme}
										id="nom"
										type="text"
										size="small"
										label={`${t.projects.projectName} *`}
										value={formik.values.nom}
										onChange={formik.handleChange('nom')}
										onBlur={formik.handleBlur('nom')}
										error={formik.submitCount > 0 && Boolean(formik.errors.nom)}
										helperText={formik.submitCount > 0 ? (formik.errors.nom ?? '') : ''}
										fullWidth
										startIcon={<AssignmentIcon fontSize="small" />}
									/>
									<CustomTextInput
										theme={inputTheme}
										id="description"
										type="text"
										size="small"
										label={t.common.description}
										value={formik.values.description}
										onChange={formik.handleChange('description')}
										onBlur={formik.handleBlur('description')}
										error={formik.submitCount > 0 && Boolean(formik.errors.description)}
										helperText={formik.submitCount > 0 ? (formik.errors.description ?? '') : ''}
										fullWidth
										multiline
										rows={3}
										startIcon={<NotesIcon fontSize="small" />}
									/>
									<Stack direction="row" spacing={2}>
										<CustomTextInput
											theme={inputTheme}
											id="budget_total"
											type="text"
											size="small"
											label={`${t.projects.budget} *`}
											value={formik.values.budget_total}
											onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
												if (/^(0|[1-9]\d*)?([.,]\d*)?$/.test(e.target.value))
													formik.setFieldValue('budget_total', e.target.value);
											}}
											onBlur={formik.handleBlur('budget_total')}
											error={formik.submitCount > 0 && Boolean(formik.errors.budget_total)}
											helperText={formik.submitCount > 0 ? (formik.errors.budget_total ?? '') : ''}
											fullWidth
											startIcon={<AttachMoneyIcon fontSize="small" />}
											slotProps={{ input: { inputProps: { inputMode: 'decimal' } } }}
										/>
										<CustomAutoCompleteSelect
											id="status"
											size="small"
											noOptionsText={t.projects.noStatusFound}
											label={`${t.common.status} *`}
											items={statusItems}
											theme={inputTheme}
											value={selectedStatus}
											fullWidth
											onChange={(_, newVal) => {
												formik.setFieldValue('status', newVal ? newVal.code : '');
											}}
											onBlur={formik.handleBlur('status')}
											error={formik.submitCount > 0 && Boolean(formik.errors.status)}
											helperText={formik.submitCount > 0 ? ((formik.errors.status as string) ?? '') : ''}
											startIcon={<AssignmentIcon fontSize="small" />}
										/>
									</Stack>
									<Stack direction="row" spacing={2}>
										<DatePicker
											label={`${t.projects.dateDebut} *`}
											value={formik.values.date_debut ? parseISO(formik.values.date_debut) : null}
											onChange={(date) =>
												formik.setFieldValue('date_debut', date ? format(date, 'yyyy-MM-dd') : '')
											}
											disabled={isLoading}
											slotProps={{
												textField: {
													size: 'small',
													fullWidth: true,
													onBlur: formik.handleBlur('date_debut'),
													error: formik.submitCount > 0 && Boolean(formik.errors.date_debut),
													helperText: formik.submitCount > 0 ? (formik.errors.date_debut ?? '') : '',
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
										<DatePicker
											label={`${t.projects.dateFin} *`}
											value={formik.values.date_fin ? parseISO(formik.values.date_fin) : null}
											onChange={(date) =>
												formik.setFieldValue('date_fin', date ? format(date, 'yyyy-MM-dd') : '')
											}
											disabled={isLoading}
											slotProps={{
												textField: {
													size: 'small',
													fullWidth: true,
													onBlur: formik.handleBlur('date_fin'),
													error: formik.submitCount > 0 && Boolean(formik.errors.date_fin),
													helperText: formik.submitCount > 0 ? (formik.errors.date_fin ?? '') : '',
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
										id="chef_de_projet"
										type="text"
										size="small"
										label={`${t.projects.projectManager} *`}
										value={formik.values.chef_de_projet}
										onChange={formik.handleChange('chef_de_projet')}
										onBlur={formik.handleBlur('chef_de_projet')}
										error={formik.submitCount > 0 && Boolean(formik.errors.chef_de_projet)}
										helperText={formik.submitCount > 0 ? (formik.errors.chef_de_projet ?? '') : ''}
										fullWidth
										startIcon={<PersonIcon fontSize="small" />}
									/>
								</Stack>
							</CardContent>
						</Card>

						{/* Client Info */}
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
									<PersonIcon color="primary" />
									<Typography variant="h6" fontWeight={700}>
										{t.projects.clientInfo}
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Stack spacing={2.5}>
									<CustomTextInput
										theme={inputTheme}
										id="nom_client"
										type="text"
										size="small"
										label={`${t.projects.clientName} *`}
										value={formik.values.nom_client}
										onChange={formik.handleChange('nom_client')}
										onBlur={formik.handleBlur('nom_client')}
										error={formik.submitCount > 0 && Boolean(formik.errors.nom_client)}
										helperText={formik.submitCount > 0 ? (formik.errors.nom_client ?? '') : ''}
										fullWidth
										startIcon={<PersonIcon fontSize="small" />}
									/>
									<Stack direction="row" spacing={2}>
										<CustomTextInput
											theme={inputTheme}
											id="telephone_client"
											type="text"
											size="small"
											label={t.projects.clientPhone}
											value={formik.values.telephone_client}
											onChange={formik.handleChange('telephone_client')}
											onBlur={formik.handleBlur('telephone_client')}
											error={formik.submitCount > 0 && Boolean(formik.errors.telephone_client)}
											helperText={formik.submitCount > 0 ? (formik.errors.telephone_client ?? '') : ''}
											fullWidth
											startIcon={<PhoneIcon fontSize="small" />}
										/>
										<CustomTextInput
											theme={inputTheme}
											id="email_client"
											type="text"
											size="small"
											label={t.projects.clientEmail}
											value={formik.values.email_client}
											onChange={formik.handleChange('email_client')}
											onBlur={formik.handleBlur('email_client')}
											error={formik.submitCount > 0 && Boolean(formik.errors.email_client)}
											helperText={formik.submitCount > 0 ? (formik.errors.email_client ?? '') : ''}
											fullWidth
											startIcon={<EmailIcon fontSize="small" />}
										/>
									</Stack>
								</Stack>
							</CardContent>
						</Card>

						{/* Notes */}
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
									<NotesIcon color="primary" />
									<Typography variant="h6" fontWeight={700}>
										{t.common.notes}
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
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
									rows={4}
									startIcon={<NotesIcon fontSize="small" />}
								/>
							</CardContent>
						</Card>

						<Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
							<PrimaryLoadingButton
								buttonText={isEditMode ? t.common.update : t.projects.newProject}
								loading={isPending}
								active={!isPending}
								type="submit"
								startIcon={isEditMode ? <EditIcon /> : <AddIcon />}
								cssClass={Styles.submitButton}
							/>
						</Box>
					</Stack>
				</form>
			</Stack>
		</LocalizationProvider>
	);
};

const ProjectFormClient: React.FC<SessionProps & { id?: number }> = ({ session, id }) => {
	const token = useInitAccessToken(session);
	const { t } = useLanguage();
	const title = id !== undefined ? t.projects.editProject : t.projects.newProject;

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

export default ProjectFormClient;
