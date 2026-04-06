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
	Stack,
	Typography,
} from '@mui/material';
import {
	Add as AddIcon,
	ArrowBack as ArrowBackIcon,
	Category as CategoryIcon,
	Edit as EditIcon,
	Warning as WarningIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import type { SessionProps } from '@/types/_initTypes';
import type { CategoryFormValues } from '@/types/projectTypes';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import { textInputTheme } from '@/utils/themes';
import { categorySchema } from '@/utils/formValidationSchemas';
import { getLabelForKey, setFormikAutoErrors } from '@/utils/helpers';
import { CATEGORIES_LIST } from '@/utils/routes';
import { useToast, useLanguage } from '@/utils/hooks';
import { useCreateCategoryMutation, useUpdateCategoryMutation, useGetCategoryQuery } from '@/store/services/project';
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

	const { data: rawData } = useGetCategoryQuery(
		{ id: id! },
		{ skip: !token || !isEditMode },
	);

	const [createCategory, { isLoading: isCreateLoading }] = useCreateCategoryMutation();
	const [updateCategory, { isLoading: isUpdateLoading }] = useUpdateCategoryMutation();
	const [isPending, setIsPending] = useState(false);

	const formik = useFormik<CategoryFormValues>({
		initialValues: {
			name: rawData?.name ?? '',
			globalError: '',
		},
		enableReinitialize: true,
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(categorySchema),
		onSubmit: async (data, { setFieldError }) => {
			setIsPending(true);
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { globalError, ...fields } = data;
			try {
				if (isEditMode) {
					await updateCategory({ id: id!, data: fields }).unwrap();
					onSuccess(t.categories.categoryUpdatedSuccess);
				} else {
					await createCategory({ data: fields }).unwrap();
					onSuccess(t.categories.categoryAddedSuccess);
				}
				router.push(CATEGORIES_LIST);
			} catch (e) {
				setFormikAutoErrors({ e, setFieldError });
				onError(isEditMode ? t.categories.categoryUpdateError : t.categories.categoryAddError);
			} finally {
				setIsPending(false);
			}
		},
	});

	const validationEntries = Object.entries(formik.errors).filter(([k]) => k !== 'globalError') as [string, string][];
	const hasValidationErrors = validationEntries.length > 0;
	const showValidationAlert = hasValidationErrors && formik.submitCount > 0;

	const isLoading = isCreateLoading || isUpdateLoading || isPending;

	return (
		<Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
			<Stack direction="row" justifyContent="space-between">
				<Button
					variant="outlined"
					startIcon={<ArrowBackIcon />}
					onClick={() => router.push(CATEGORIES_LIST)}
					sx={{ whiteSpace: 'nowrap' }}
				>
					{t.categories.categoriesList}
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
									<strong>{getLabelForKey(t.rawData.fieldLabels.category, key)}</strong> : {err}
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
								<CategoryIcon color="primary" />
								<Typography variant="h6" fontWeight={700}>
									{t.categories.categoryDetails}
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
									startIcon={<CategoryIcon fontSize="small" />}
								/>
							</Stack>
						</CardContent>
					</Card>

					<Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
						<PrimaryLoadingButton
							buttonText={isEditMode ? t.common.update : t.categories.newCategory}
							loading={isPending}
							active={!isPending}
							type="submit"
							startIcon={isEditMode ? <EditIcon /> : <AddIcon />}
							onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
								if (!formik.isValid) {
									e.preventDefault();
									formik.handleSubmit();
									onError(t.users.fixValidationErrors);
									window.scrollTo({ top: 0, behavior: 'smooth' });
								}
							}}
							cssClass={Styles.submitButton}
						/>
					</Box>
				</Stack>
			</form>
		</Stack>
	);
};

const CategoryFormClient: React.FC<SessionProps & { id?: number }> = ({ session, id }) => {
	const token = useInitAccessToken(session);
	const { t } = useLanguage();
	const title = id !== undefined ? t.categories.editCategory : t.categories.newCategory;

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

export default CategoryFormClient;
