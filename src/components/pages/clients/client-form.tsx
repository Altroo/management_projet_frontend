'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import {
	Add as AddIcon,
	ArrowBack as ArrowBackIcon,
	Edit as EditIcon,
	Email as EmailIcon,
	Home as HomeIcon,
	Person as PersonIcon,
	Phone as PhoneIcon,
	Warning as WarningIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import type { SessionProps } from '@/types/_initTypes';
import type { ClientFormValues } from '@/types/projectTypes';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { textInputTheme } from '@/utils/themes';
import { clientSchema } from '@/utils/formValidationSchemas';
import { getLabelForKey, setFormikAutoErrors } from '@/utils/helpers';
import { CLIENTS_LIST } from '@/utils/routes';
import { useLanguage, useToast } from '@/utils/hooks';
import { useCreateClientMutation, useGetClientQuery, useUpdateClientMutation } from '@/store/services/project';
import { useInitAccessToken } from '@/contexts/InitContext';
import Styles from '@/styles/dashboard/dashboard.module.sass';

const inputTheme = textInputTheme();

const ClientFormContent: React.FC<{ token: string | undefined; id?: number }> = ({ token, id }) => {
	const { t } = useLanguage();
	const { onSuccess, onError } = useToast();
	const router = useRouter();
	const isEditMode = id !== undefined;
	const { data: rawData } = useGetClientQuery({ id: id! }, { skip: !token || !isEditMode });
	const [createClient, { isLoading: isCreateLoading }] = useCreateClientMutation();
	const [updateClient, { isLoading: isUpdateLoading }] = useUpdateClientMutation();
	const [isPending, setIsPending] = useState(false);

	const formik = useFormik<ClientFormValues>({
		initialValues: {
			nom: rawData?.nom ?? '',
			telephone: rawData?.telephone ?? '',
			email: rawData?.email ?? '',
			adresse: rawData?.adresse ?? '',
			globalError: '',
		},
		enableReinitialize: true,
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(clientSchema),
		onSubmit: async (data, { setFieldError }) => {
			setIsPending(true);
			const { globalError, ...fields } = data;
			void globalError;
			try {
				if (isEditMode) {
					await updateClient({ id: id!, data: fields }).unwrap();
					onSuccess(t.clients.clientUpdatedSuccess);
				} else {
					await createClient({ data: fields }).unwrap();
					onSuccess(t.clients.clientAddedSuccess);
				}
				router.push(CLIENTS_LIST);
			} catch (e) {
				setFormikAutoErrors({ e, setFieldError });
				onError(isEditMode ? t.clients.clientUpdateError : t.clients.clientAddError);
			} finally {
				setIsPending(false);
			}
		},
	});

	const validationEntries = Object.entries(formik.errors).filter(([key]) => key !== 'globalError') as [string, string][];
	const showValidationAlert = validationEntries.length > 0 && formik.submitCount > 0;
	const isLoading = isCreateLoading || isUpdateLoading || isPending;

	return (
		<Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
			<Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(CLIENTS_LIST)} sx={{ alignSelf: 'flex-start' }}>
				{t.clients.clientsList}
			</Button>
			{showValidationAlert && (
				<Alert severity="error" icon={<WarningIcon />}>
					{validationEntries.map(([key, err]) => (
						<Typography key={key} variant="body2">
							<strong>{getLabelForKey(t.rawData.fieldLabels.client, key)}</strong> : {err}
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
								<PersonIcon color="primary" />
								<Typography variant="h6" sx={{ fontWeight: 700 }}>
									{t.clients.clientDetails}
								</Typography>
							</Stack>
							<Divider sx={{ mb: 3 }} />
							<Stack spacing={2.5}>
								<CustomTextInput
									theme={inputTheme}
									id="nom"
									type="text"
									size="small"
									label={`${t.common.name} *`}
									value={formik.values.nom}
									onChange={formik.handleChange('nom')}
									onBlur={formik.handleBlur('nom')}
									error={formik.submitCount > 0 && Boolean(formik.errors.nom)}
									helperText={formik.submitCount > 0 ? (formik.errors.nom ?? '') : ''}
									fullWidth
									startIcon={<PersonIcon fontSize="small" />}
								/>
								<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
									<CustomTextInput
										theme={inputTheme}
										id="telephone"
										type="text"
										size="small"
										label={t.common.phone}
										value={formik.values.telephone}
										onChange={formik.handleChange('telephone')}
										onBlur={formik.handleBlur('telephone')}
										error={formik.submitCount > 0 && Boolean(formik.errors.telephone)}
										helperText={formik.submitCount > 0 ? (formik.errors.telephone ?? '') : ''}
										fullWidth
										startIcon={<PhoneIcon fontSize="small" />}
									/>
									<CustomTextInput
										theme={inputTheme}
										id="email"
										type="text"
										size="small"
										label={t.common.email}
										value={formik.values.email}
										onChange={formik.handleChange('email')}
										onBlur={formik.handleBlur('email')}
										error={formik.submitCount > 0 && Boolean(formik.errors.email)}
										helperText={formik.submitCount > 0 ? (formik.errors.email ?? '') : ''}
										fullWidth
										startIcon={<EmailIcon fontSize="small" />}
									/>
								</Stack>
								<CustomTextInput
									theme={inputTheme}
									id="adresse"
									type="text"
									size="small"
									label={t.common.address}
									value={formik.values.adresse}
									onChange={formik.handleChange('adresse')}
									onBlur={formik.handleBlur('adresse')}
									error={formik.submitCount > 0 && Boolean(formik.errors.adresse)}
									helperText={formik.submitCount > 0 ? (formik.errors.adresse ?? '') : ''}
									fullWidth
									multiline
									rows={3}
									startIcon={<HomeIcon fontSize="small" />}
								/>
							</Stack>
						</CardContent>
					</Card>
					<Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
						<PrimaryLoadingButton
							buttonText={isEditMode ? t.common.update : t.clients.newClient}
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

const ClientFormClient: React.FC<SessionProps & { id?: number }> = ({ session, id }) => {
	const token = useInitAccessToken(session);
	const { t } = useLanguage();
	const title = id !== undefined ? t.clients.editClient : t.clients.newClient;

	return (
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} sx={{ mt: '48px' }}>
			<NavigationBar title={title}>
				<Protected permission={id !== undefined ? 'can_edit' : 'can_create'}>
					<ClientFormContent token={token} id={id} />
				</Protected>
			</NavigationBar>
		</Stack>
	);
};

export default ClientFormClient;
