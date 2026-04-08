'use client';

import React, { useEffect, useState } from 'react';
import Styles from '@/styles/dashboard/settings/settings.module.sass';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import {
	Box,
	FormControlLabel,
	Stack,
	Switch,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import { setFormikAutoErrors } from '@/utils/helpers';
import { textInputTheme } from '@/utils/themes';
import { useFormik } from 'formik';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import {
	useGetNotificationPreferencesQuery,
	useUpdateNotificationPreferencesMutation,
} from '@/store/services/notification';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { useToast, useLanguage } from '@/utils/hooks';
import { Edit as EditIcon } from '@mui/icons-material';
import type { NotificationPreferenceFormValues } from '@/types/managementNotificationTypes';

const inputTheme = textInputTheme();

const FormikContent: React.FC = () => {
	const { onSuccess, onError } = useToast();
	const { t } = useLanguage();
	const { data: preferences, isLoading: isPreferencesLoading } = useGetNotificationPreferencesQuery();
	const [updatePreferences, { isLoading: isUpdateLoading }] = useUpdateNotificationPreferencesMutation();
	const [isPending, setIsPending] = useState(false);

	const formik = useFormik<NotificationPreferenceFormValues>({
		initialValues: {
			notify_budget_overrun: preferences?.notify_budget_overrun ?? true,
			notify_budget_threshold: preferences?.notify_budget_threshold ?? true,
			notify_deadline_approaching: preferences?.notify_deadline_approaching ?? true,
			notify_project_overdue: preferences?.notify_project_overdue ?? true,
			notify_status_change: preferences?.notify_status_change ?? true,
			budget_threshold_percent: preferences?.budget_threshold_percent ?? 80,
			deadline_alert_days: preferences?.deadline_alert_days ?? 7,
			globalError: '',
		},
		enableReinitialize: true,
		onSubmit: async (values, { setFieldError }) => {
			setIsPending(true);
			try {
				await updatePreferences({
					notify_budget_overrun: values.notify_budget_overrun,
					notify_budget_threshold: values.notify_budget_threshold,
					notify_deadline_approaching: values.notify_deadline_approaching,
					notify_project_overdue: values.notify_project_overdue,
					notify_status_change: values.notify_status_change,
					budget_threshold_percent: values.budget_threshold_percent,
					deadline_alert_days: values.deadline_alert_days,
				}).unwrap();
				onSuccess(t.settings.notificationUpdateSuccess);
			} catch (e) {
				onError(t.settings.notificationUpdateError);
				setFormikAutoErrors({ e, setFieldError });
			} finally {
				setIsPending(false);
			}
		},
	});

	useEffect(() => {
		if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
			void Notification.requestPermission();
		}
	}, []);

	return (
		<Stack direction="column" alignItems="center" spacing={2} className={`${Styles.flexRootStack}`} mt="32px">
			{(isPreferencesLoading || isUpdateLoading || isPending) && (
				<ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />
			)}
			<h2 className={Styles.pageTitle}>{t.settings.notificationPreferences}</h2>

			<form className={Styles.form} onSubmit={(e) => e.preventDefault()}>
				<Stack direction="column" justifyContent="center" alignItems="center" spacing={3}>
					<Box sx={{ maxWidth: 365, width: '100%' }}>
						<Stack spacing={2}>
							<FormControlLabel
								control={
									<Switch
										checked={formik.values.notify_budget_overrun}
										onChange={(e) => formik.setFieldValue('notify_budget_overrun', e.target.checked)}
									/>
								}
								label={t.settings.notifyBudgetOverrun}
							/>
							<FormControlLabel
								control={
									<Switch
										checked={formik.values.notify_budget_threshold}
										onChange={(e) => formik.setFieldValue('notify_budget_threshold', e.target.checked)}
									/>
								}
								label={t.settings.notifyBudgetThreshold}
							/>
							<FormControlLabel
								control={
									<Switch
										checked={formik.values.notify_deadline_approaching}
										onChange={(e) => formik.setFieldValue('notify_deadline_approaching', e.target.checked)}
									/>
								}
								label={t.settings.notifyDeadlineApproaching}
							/>
							<FormControlLabel
								control={
									<Switch
										checked={formik.values.notify_project_overdue}
										onChange={(e) => formik.setFieldValue('notify_project_overdue', e.target.checked)}
									/>
								}
								label={t.settings.notifyProjectOverdue}
							/>
							<FormControlLabel
								control={
									<Switch
										checked={formik.values.notify_status_change}
										onChange={(e) => formik.setFieldValue('notify_status_change', e.target.checked)}
									/>
								}
								label={t.settings.notifyStatusChange}
							/>
							<CustomTextInput
								id="budget_threshold_percent"
								label={t.settings.budgetThresholdPercent}
								type="number"
								size="small"
								value={String(formik.values.budget_threshold_percent)}
								onChange={(e) => formik.setFieldValue('budget_threshold_percent', Number(e.target.value))}
								slotProps={{ htmlInput: { min: 1, max: 100 } }}
								fullWidth
								theme={inputTheme}
							/>
							<CustomTextInput
								id="deadline_alert_days"
								label={t.settings.deadlineAlertDays}
								type="number"
								size="small"
								value={String(formik.values.deadline_alert_days)}
								onChange={(e) => formik.setFieldValue('deadline_alert_days', Number(e.target.value))}
								slotProps={{ htmlInput: { min: 1, max: 365 } }}
								fullWidth
								theme={inputTheme}
							/>
						</Stack>
					</Box>
					<PrimaryLoadingButton
						buttonText={t.settings.save}
						active={!isPending}
						onClick={formik.handleSubmit}
						cssClass={`${Styles.maxWidth} ${Styles.mobileButton} ${Styles.submitButton}`}
						type="submit"
						startIcon={<EditIcon />}
						loading={isPending}
					/>
				</Stack>
			</form>
		</Stack>
	);
};

const NotificationsClient: React.FC = () => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));
	const { t } = useLanguage();

	return (
		<Stack direction="column" sx={{ position: 'relative' }}>
			<NavigationBar title={t.settings.notificationPreferences}>
				<main className={`${Styles.main} ${Styles.fixMobile}`}>
					<Box
						sx={{
							width: '100%',
							display: 'flex',
							justifyContent: isMobile ? 'center' : 'flex-start',
							alignItems: 'flex-start',
						}}
					>
						<Box sx={{ width: '100%' }}>
							<FormikContent />
						</Box>
					</Box>
				</main>
			</NavigationBar>
		</Stack>
	);
};

export default NotificationsClient;
