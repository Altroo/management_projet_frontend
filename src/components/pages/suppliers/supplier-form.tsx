'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import {
	Add as AddIcon,
	ArrowBack as ArrowBackIcon,
	Build as BuildIcon,
	Edit as EditIcon,
	Person as PersonIcon,
	Warning as WarningIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import type { SessionProps } from '@/types/_initTypes';
import type { SupplierFormValues } from '@/types/projectTypes';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { textInputTheme } from '@/utils/themes';
import { supplierSchema } from '@/utils/formValidationSchemas';
import { getLabelForKey, setFormikAutoErrors } from '@/utils/helpers';
import { SUPPLIERS_LIST } from '@/utils/routes';
import { useLanguage, useToast } from '@/utils/hooks';
import { useCreateSupplierMutation, useGetSupplierQuery, useUpdateSupplierMutation } from '@/store/services/project';
import { useInitAccessToken } from '@/contexts/InitContext';
import Styles from '@/styles/dashboard/dashboard.module.sass';

const inputTheme = textInputTheme();

const SupplierFormContent: React.FC<{ token: string | undefined; id?: number }> = ({ token, id }) => {
	const { t } = useLanguage();
	const { onSuccess, onError } = useToast();
	const router = useRouter();
	const isEditMode = id !== undefined;
	const { data: rawData } = useGetSupplierQuery({ id: id! }, { skip: !token || !isEditMode });
	const [createSupplier, { isLoading: isCreateLoading }] = useCreateSupplierMutation();
	const [updateSupplier, { isLoading: isUpdateLoading }] = useUpdateSupplierMutation();
	const [isPending, setIsPending] = useState(false);

	const formik = useFormik<SupplierFormValues>({
		initialValues: {
			nom: rawData?.nom ?? '',
			contact: rawData?.contact ?? '',
			specialite: rawData?.specialite ?? '',
			globalError: '',
		},
		enableReinitialize: true,
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(supplierSchema),
		onSubmit: async (data, { setFieldError }) => {
			setIsPending(true);
			const { globalError, ...fields } = data;
			void globalError;
			try {
				if (isEditMode) {
					await updateSupplier({ id: id!, data: fields }).unwrap();
					onSuccess(t.suppliers.supplierUpdatedSuccess);
				} else {
					await createSupplier({ data: fields }).unwrap();
					onSuccess(t.suppliers.supplierAddedSuccess);
				}
				router.push(SUPPLIERS_LIST);
			} catch (e) {
				setFormikAutoErrors({ e, setFieldError });
				onError(isEditMode ? t.suppliers.supplierUpdateError : t.suppliers.supplierAddError);
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
			<Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(SUPPLIERS_LIST)} sx={{ alignSelf: 'flex-start' }}>
				{t.suppliers.suppliersList}
			</Button>
			{showValidationAlert && (
				<Alert severity="error" icon={<WarningIcon />}>
					{validationEntries.map(([key, err]) => (
						<Typography key={key} variant="body2">
							<strong>{getLabelForKey(t.rawData.fieldLabels.supplier, key)}</strong> : {err}
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
								<BuildIcon color="primary" />
								<Typography variant="h6" sx={{ fontWeight: 700 }}>
									{t.suppliers.supplierDetails}
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
									startIcon={<BuildIcon fontSize="small" />}
								/>
								<CustomTextInput
									theme={inputTheme}
									id="contact"
									type="text"
									size="small"
									label={t.suppliers.contact}
									value={formik.values.contact}
									onChange={formik.handleChange('contact')}
									onBlur={formik.handleBlur('contact')}
									error={formik.submitCount > 0 && Boolean(formik.errors.contact)}
									helperText={formik.submitCount > 0 ? (formik.errors.contact ?? '') : ''}
									fullWidth
									startIcon={<PersonIcon fontSize="small" />}
								/>
								<CustomTextInput
									theme={inputTheme}
									id="specialite"
									type="text"
									size="small"
									label={t.suppliers.speciality}
									value={formik.values.specialite}
									onChange={formik.handleChange('specialite')}
									onBlur={formik.handleBlur('specialite')}
									error={formik.submitCount > 0 && Boolean(formik.errors.specialite)}
									helperText={formik.submitCount > 0 ? (formik.errors.specialite ?? '') : ''}
									fullWidth
									startIcon={<BuildIcon fontSize="small" />}
								/>
							</Stack>
						</CardContent>
					</Card>
					<Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
						<PrimaryLoadingButton
							buttonText={isEditMode ? t.common.update : t.suppliers.newSupplier}
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

const SupplierFormClient: React.FC<SessionProps & { id?: number }> = ({ session, id }) => {
	const token = useInitAccessToken(session);
	const { t } = useLanguage();
	const title = id !== undefined ? t.suppliers.editSupplier : t.suppliers.newSupplier;

	return (
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} sx={{ mt: '48px' }}>
			<NavigationBar title={title}>
				<Protected permission={id !== undefined ? 'can_edit' : 'can_create'}>
					<SupplierFormContent token={token} id={id} />
				</Protected>
			</NavigationBar>
		</Stack>
	);
};

export default SupplierFormClient;
