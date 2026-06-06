'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, Card, CardContent, Checkbox, Divider, FormControlLabel, Stack, Typography } from '@mui/material';
import { Add as AddIcon, ArrowBack as ArrowBackIcon, Edit as EditIcon, Label as LabelIcon, Warning as WarningIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import type { SessionProps } from '@/types/_initTypes';
import type { ProjectStatusFormValues } from '@/types/projectTypes';
import type { DropDownType } from '@/types/accountTypes';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import CustomAutoCompleteSelect from '@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { textInputTheme } from '@/utils/themes';
import { projectStatusSchema } from '@/utils/formValidationSchemas';
import { getLabelForKey, setFormikAutoErrors } from '@/utils/helpers';
import { PROJECT_STATUSES_LIST } from '@/utils/routes';
import { useLanguage, useToast } from '@/utils/hooks';
import { useCreateProjectStatusMutation, useGetProjectStatusQuery, useUpdateProjectStatusMutation } from '@/store/services/project';
import { useInitAccessToken } from '@/contexts/InitContext';
import Styles from '@/styles/dashboard/dashboard.module.sass';

const inputTheme = textInputTheme();

const ProjectStatusFormContent: React.FC<{ token: string | undefined; id?: number }> = ({ token, id }) => {
	const { t } = useLanguage();
	const { onSuccess, onError } = useToast();
	const router = useRouter();
	const isEditMode = id !== undefined;
	const { data: rawData } = useGetProjectStatusQuery({ id: id! }, { skip: !token || !isEditMode });
	const [createProjectStatus, { isLoading: isCreateLoading }] = useCreateProjectStatusMutation();
	const [updateProjectStatus, { isLoading: isUpdateLoading }] = useUpdateProjectStatusMutation();
	const [isPending, setIsPending] = useState(false);

	const colorItems: DropDownType[] = useMemo(
		() => [
			{ code: 'default', value: 'Default' },
			{ code: 'info', value: 'Info' },
			{ code: 'success', value: 'Success' },
			{ code: 'warning', value: 'Warning' },
			{ code: 'error', value: 'Error' },
		],
		[],
	);

	const formik = useFormik<ProjectStatusFormValues>({
		initialValues: {
			name: rawData?.name ?? '',
			color: rawData?.color ?? 'default',
			is_active: rawData?.is_active ?? true,
			ordering: rawData?.ordering ?? '',
			globalError: '',
		},
		enableReinitialize: true,
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(projectStatusSchema),
		onSubmit: async (data, { setFieldError }) => {
			setIsPending(true);
			const { globalError, ...fields } = data;
			void globalError;
			const payload = { ...fields, ordering: fields.ordering === '' ? 0 : fields.ordering };
			try {
				if (isEditMode) {
					await updateProjectStatus({ id: id!, data: payload }).unwrap();
					onSuccess(t.projectStatuses.projectStatusUpdatedSuccess);
				} else {
					await createProjectStatus({ data: payload }).unwrap();
					onSuccess(t.projectStatuses.projectStatusAddedSuccess);
				}
				router.push(PROJECT_STATUSES_LIST);
			} catch (e) {
				setFormikAutoErrors({ e, setFieldError });
				onError(isEditMode ? t.projectStatuses.projectStatusUpdateError : t.projectStatuses.projectStatusAddError);
			} finally {
				setIsPending(false);
			}
		},
	});

	const selectedColor = colorItems.find((item) => item.code === formik.values.color) ?? colorItems[0];
	const validationEntries = Object.entries(formik.errors).filter(([key]) => key !== 'globalError') as [string, string][];
	const showValidationAlert = validationEntries.length > 0 && formik.submitCount > 0;
	const isLoading = isCreateLoading || isUpdateLoading || isPending;

	return (
		<Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
			<Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(PROJECT_STATUSES_LIST)} sx={{ alignSelf: 'flex-start' }}>
				{t.projectStatuses.projectStatusesList}
			</Button>
			{showValidationAlert && (
				<Alert severity="error" icon={<WarningIcon />}>
					{validationEntries.map(([key, err]) => (
						<Typography key={key} variant="body2">
							<strong>{getLabelForKey(t.rawData.fieldLabels.projectStatus, key)}</strong> : {err}
						</Typography>
					))}
				</Alert>
			)}
			{isLoading && <ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />}
			<form onSubmit={formik.handleSubmit}>
				<Stack spacing={3}>
					<Card elevation={2} sx={{ borderRadius: 2 }}>
						<CardContent sx={{ p: 3 }}>
							<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
								<LabelIcon color="primary" />
								<Typography variant="h6" sx={{ fontWeight: 700 }}>
									{t.projectStatuses.projectStatusDetails}
								</Typography>
							</Stack>
							<Divider sx={{ mb: 3 }} />
							<Stack spacing={2.5}>
								<CustomTextInput
									theme={inputTheme}
									id="name"
									type="text"
									size="small"
									label={`${t.common.name} *`}
									value={formik.values.name}
									onChange={formik.handleChange('name')}
									onBlur={formik.handleBlur('name')}
									error={formik.submitCount > 0 && Boolean(formik.errors.name)}
									helperText={formik.submitCount > 0 ? (formik.errors.name ?? '') : ''}
									fullWidth
									startIcon={<LabelIcon fontSize="small" />}
								/>
								<CustomAutoCompleteSelect
									id="color"
									size="small"
									noOptionsText={t.common.noOptions}
									label={`${t.projectStatuses.statusColor} *`}
									items={colorItems}
									theme={inputTheme}
									value={selectedColor}
									fullWidth
									onChange={(_, newVal) => formik.setFieldValue('color', newVal?.code ?? 'default')}
									onBlur={formik.handleBlur('color')}
									error={formik.submitCount > 0 && Boolean(formik.errors.color)}
									helperText={formik.submitCount > 0 ? ((formik.errors.color as string) ?? '') : ''}
									startIcon={<LabelIcon fontSize="small" />}
								/>
								<CustomTextInput
									theme={inputTheme}
									id="ordering"
									type="text"
									size="small"
									label={t.projectStatuses.ordering}
									value={String(formik.values.ordering)}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
										if (/^\d*$/.test(e.target.value)) formik.setFieldValue('ordering', e.target.value === '' ? '' : Number(e.target.value));
									}}
									onBlur={formik.handleBlur('ordering')}
									error={formik.submitCount > 0 && Boolean(formik.errors.ordering)}
									helperText={formik.submitCount > 0 ? ((formik.errors.ordering as string) ?? '') : ''}
									fullWidth
									startIcon={<LabelIcon fontSize="small" />}
								/>
								<FormControlLabel
									control={
										<Checkbox
											checked={formik.values.is_active}
											onChange={(event) => formik.setFieldValue('is_active', event.target.checked)}
										/>
									}
									label={t.projectStatuses.isActive}
								/>
							</Stack>
						</CardContent>
					</Card>
					<Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
						<PrimaryLoadingButton
							buttonText={isEditMode ? t.common.update : t.projectStatuses.newProjectStatus}
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
	);
};

const ProjectStatusFormClient: React.FC<SessionProps & { id?: number }> = ({ session, id }) => {
	const token = useInitAccessToken(session);
	const { t } = useLanguage();
	const title = id !== undefined ? t.projectStatuses.editProjectStatus : t.projectStatuses.newProjectStatus;

	return (
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} sx={{ mt: '48px' }}>
			<NavigationBar title={title}>
				<Protected permission={id !== undefined ? 'can_edit' : 'can_create'}>
					<ProjectStatusFormContent token={token} id={id} />
				</Protected>
			</NavigationBar>
		</Stack>
	);
};

export default ProjectStatusFormClient;
