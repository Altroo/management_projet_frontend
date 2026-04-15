'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, Card, CardContent, Divider, InputAdornment, Stack, Typography } from '@mui/material';
import {
	Add as AddIcon,
	ArrowBack as ArrowBackIcon,
	Assignment as AssignmentIcon,
	AttachMoney as AttachMoneyIcon,
	CalendarMonth as CalendarMonthIcon,
	Category as CategoryIcon,
	Edit as EditIcon,
	Notes as NotesIcon,
	Person as PersonIcon,
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
import type { ExpenseFormValues } from '@/types/projectTypes';
import type { DropDownType } from '@/types/accountTypes';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import CustomAutoCompleteSelect from '@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import EntityCrudControls from '@/components/shared/entityCrudControls/entityCrudControls';
import { textInputTheme } from '@/utils/themes';
import { expenseSchema } from '@/utils/formValidationSchemas';
import { getLabelForKey, setFormikAutoErrors } from '@/utils/helpers';
import { EXPENSES_LIST } from '@/utils/routes';
import { useLanguage, useToast } from '@/utils/hooks';
import {
	useCreateExpenseCategoryMutation,
	useCreateExpenseSubCategoryMutation,
	useCreateExpenseMutation,
	useDeleteExpenseCategoryMutation,
	useDeleteExpenseSubCategoryMutation,
	useGetExpenseTaxonomyQuery,
	useGetExpenseQuery,
	useGetProjectsListQuery,
	useUpdateExpenseCategoryMutation,
	useUpdateExpenseSubCategoryMutation,
	useUpdateExpenseMutation,
} from '@/store/services/project';
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

	const { data: rawData } = useGetExpenseQuery({ id: id! }, { skip: !token || !isEditMode });

	const { data: projectsData } = useGetProjectsListQuery({}, { skip: !token });
	const { data: expenseTaxonomy } = useGetExpenseTaxonomyQuery(undefined, { skip: !token });

	const projectItems: DropDownType[] = useMemo(() => {
		const projects = Array.isArray(projectsData)
			? projectsData
			: projectsData && 'results' in projectsData
				? projectsData.results
				: [];
		return projects.map((p) => ({ code: String(p.id), value: p.nom }));
	}, [projectsData]);

	const categoryItems: DropDownType[] = useMemo(() => {
		return (expenseTaxonomy ?? []).map((category) => ({ code: String(category.id), value: category.name }));
	}, [expenseTaxonomy]);

	const [createExpenseCategory] = useCreateExpenseCategoryMutation();
	const [updateExpenseCategory] = useUpdateExpenseCategoryMutation();
	const [deleteExpenseCategory] = useDeleteExpenseCategoryMutation();
	const [createExpenseSubCategory] = useCreateExpenseSubCategoryMutation();
	const [updateExpenseSubCategory] = useUpdateExpenseSubCategoryMutation();
	const [deleteExpenseSubCategory] = useDeleteExpenseSubCategoryMutation();
	const [createExpense, { isLoading: isCreateLoading }] = useCreateExpenseMutation();
	const [updateExpense, { isLoading: isUpdateLoading }] = useUpdateExpenseMutation();
	const [isPending, setIsPending] = useState(false);

	const formik = useFormik<ExpenseFormValues>({
		initialValues: {
			project: rawData?.project ?? '',
			date: rawData?.date ?? '',
			category: rawData?.category ?? '',
			sous_categorie: rawData?.sous_categorie ?? '',
			element: rawData?.element ?? '',
			description: rawData?.description ?? '',
			montant: rawData?.montant ?? '',
			fournisseur: rawData?.fournisseur ?? '',
			notes: rawData?.notes ?? '',
			globalError: '',
		},
		enableReinitialize: true,
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(expenseSchema),
		onSubmit: async (data, { setFieldError }) => {
			setIsPending(true);
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { globalError, ...fields } = data;
			try {
				if (isEditMode) {
					await updateExpense({ id: id!, data: fields }).unwrap();
					onSuccess(t.expenses.expenseUpdatedSuccess);
				} else {
					await createExpense({ data: fields }).unwrap();
					onSuccess(t.expenses.expenseAddedSuccess);
				}
				router.push(EXPENSES_LIST);
			} catch (e) {
				setFormikAutoErrors({ e, setFieldError });
				onError(isEditMode ? t.expenses.expenseUpdateError : t.expenses.expenseAddError);
			} finally {
				setIsPending(false);
			}
		},
	});

	const selectedProject = projectItems.find((p) => p.code === String(formik.values.project)) ?? null;
	const selectedCategory = categoryItems.find((c) => c.code === String(formik.values.category)) ?? null;

	const subCategoryItems: DropDownType[] = useMemo(() => {
		const activeCategory = (expenseTaxonomy ?? []).find((category) => category.id === Number(formik.values.category));
		return (activeCategory?.subcategories ?? []).map((subCategory) => ({
			code: String(subCategory.id),
			value: subCategory.name,
		}));
	}, [expenseTaxonomy, formik.values.category]);

	const selectedSubCategory = subCategoryItems.find((sc) => sc.code === String(formik.values.sous_categorie)) ?? null;

	const validationEntries = Object.entries(formik.errors).filter(([k]) => k !== 'globalError') as [string, string][];
	const hasValidationErrors = validationEntries.length > 0;
	const showValidationAlert = hasValidationErrors && formik.submitCount > 0;

	const isLoading = isCreateLoading || isUpdateLoading || isPending;

	return (
		<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
			<Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
				<Stack
					direction="row"
					sx={{
						justifyContent: 'space-between',
					}}
				>
					<Button
						variant="outlined"
						startIcon={<ArrowBackIcon />}
						onClick={() => router.push(EXPENSES_LIST)}
						sx={{ whiteSpace: 'nowrap' }}
					>
						{t.expenses.expensesList}
					</Button>
				</Stack>

				{showValidationAlert && (
					<Alert severity="error" icon={<WarningIcon />}>
						<Typography
							variant="subtitle2"
							sx={{
								fontWeight: 600,
							}}
						>
							{t.common.validationErrorsDetected}
						</Typography>
						<ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
							{validationEntries.map(([key, err]) => (
								<li key={key}>
									<Typography variant="body2">
										<strong>{getLabelForKey(t.rawData.fieldLabels.expense, key)}</strong> : {err}
									</Typography>
								</li>
							))}
						</ul>
					</Alert>
				)}

				{isLoading && <ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />}

				<form onSubmit={formik.handleSubmit}>
					<Stack spacing={3}>
						{/* Main Info */}
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack
									direction="row"
									spacing={2}
									sx={{
										alignItems: 'center',
										mb: 2,
									}}
								>
									<AttachMoneyIcon color="primary" />
									<Typography
										variant="h6"
										sx={{
											fontWeight: 700,
										}}
									>
										{t.expenses.expenseDetails}
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
											onChange={(date) => formik.setFieldValue('date', date ? format(date, 'yyyy-MM-dd') : '')}
											disabled={isLoading}
											slotProps={{
												textField: {
													size: 'small',
													fullWidth: true,
													onBlur: formik.handleBlur('date'),
													error: formik.submitCount > 0 && Boolean(formik.errors.date),
													helperText: formik.submitCount > 0 ? (formik.errors.date ?? '') : '',
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
								</Stack>
							</CardContent>
						</Card>

						{/* Category Info */}
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack
									direction="row"
									spacing={2}
									sx={{
										alignItems: 'center',
										mb: 2,
									}}
								>
									<CategoryIcon color="primary" />
									<Typography
										variant="h6"
										sx={{
											fontWeight: 700,
										}}
									>
										{t.expenses.categoryInfo}
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Stack spacing={2.5}>
									<CustomAutoCompleteSelect
										id="category"
										size="small"
										noOptionsText={t.categories.noCategoryFound}
										label={t.common.category}
										items={categoryItems}
										theme={inputTheme}
										value={selectedCategory}
										fullWidth
										onChange={(_, newVal) => {
											formik.setFieldValue('category', newVal ? Number(newVal.code) : '');
											formik.setFieldValue('sous_categorie', '');
										}}
										onBlur={formik.handleBlur('category')}
										error={formik.submitCount > 0 && Boolean(formik.errors.category)}
										helperText={formik.submitCount > 0 ? ((formik.errors.category as string) ?? '') : ''}
										startIcon={<CategoryIcon fontSize="small" />}
										endIcon={
											<EntityCrudControls
												label={t.common.category.toLowerCase()}
												icon={<CategoryIcon fontSize="small" />}
												inputTheme={inputTheme}
												selectedItem={selectedCategory}
												addEntity={({ data }) => createExpenseCategory({ data: { name: String(data.name ?? '') } })}
												editEntity={({ id: entityId, data }) =>
													updateExpenseCategory({ id: entityId, data: { name: String(data.name ?? '') } })
												}
												deleteEntity={({ id: entityId }) => deleteExpenseCategory({ id: entityId })}
												buildAddPayload={(name) => ({ name })}
												buildEditPayload={(name) => ({ name })}
												onAddSuccess={(newId) => {
													formik.setFieldValue('category', newId);
													formik.setFieldValue('sous_categorie', '');
												}}
												onDeleteSuccess={() => {
													formik.setFieldValue('category', '');
													formik.setFieldValue('sous_categorie', '');
												}}
											/>
										}
									/>
									<CustomAutoCompleteSelect
										id="sous_categorie"
										size="small"
										noOptionsText={t.expenses.noSubCategoryFound}
										label={t.expenses.subCategory}
										items={subCategoryItems}
										theme={inputTheme}
										value={selectedSubCategory}
										fullWidth
										onChange={(_, newVal) => {
											formik.setFieldValue('sous_categorie', newVal ? Number(newVal.code) : '');
										}}
										onBlur={formik.handleBlur('sous_categorie')}
										error={formik.submitCount > 0 && Boolean(formik.errors.sous_categorie)}
										helperText={formik.submitCount > 0 ? ((formik.errors.sous_categorie as string) ?? '') : ''}
										startIcon={<CategoryIcon fontSize="small" />}
										endIcon={
											<EntityCrudControls
												label={t.expenses.subCategory.toLowerCase()}
												icon={<CategoryIcon fontSize="small" />}
												inputTheme={inputTheme}
												selectedItem={selectedSubCategory}
												addEntity={({ data }) =>
													createExpenseSubCategory({
														data: {
															name: String(data.name ?? ''),
															category: Number(data.category ?? formik.values.category),
														},
													})
												}
												editEntity={({ id: entityId, data }) =>
													updateExpenseSubCategory({
														id: entityId,
														data: {
															name: String(data.name ?? ''),
															category: Number(data.category ?? formik.values.category),
														},
													})
												}
												deleteEntity={({ id: entityId }) => deleteExpenseSubCategory({ id: entityId })}
												buildAddPayload={(name) => ({ name, category: Number(formik.values.category) })}
												buildEditPayload={(name) => ({ name, category: Number(formik.values.category) })}
												addDisabled={!formik.values.category}
												disabled={!formik.values.category}
												onAddSuccess={(newId) => {
													formik.setFieldValue('sous_categorie', newId);
												}}
												onDeleteSuccess={() => {
													formik.setFieldValue('sous_categorie', '');
												}}
											/>
										}
									/>
									<CustomTextInput
										theme={inputTheme}
										id="element"
										type="text"
										size="small"
										label={t.expenses.element}
										value={formik.values.element}
										onChange={formik.handleChange('element')}
										onBlur={formik.handleBlur('element')}
										error={formik.submitCount > 0 && Boolean(formik.errors.element)}
										helperText={formik.submitCount > 0 ? (formik.errors.element ?? '') : ''}
										fullWidth
										startIcon={<NotesIcon fontSize="small" />}
									/>
									<CustomTextInput
										theme={inputTheme}
										id="fournisseur"
										type="text"
										size="small"
										label={t.expenses.supplier}
										value={formik.values.fournisseur}
										onChange={formik.handleChange('fournisseur')}
										onBlur={formik.handleBlur('fournisseur')}
										error={formik.submitCount > 0 && Boolean(formik.errors.fournisseur)}
										helperText={formik.submitCount > 0 ? (formik.errors.fournisseur ?? '') : ''}
										fullWidth
										startIcon={<PersonIcon fontSize="small" />}
									/>
								</Stack>
							</CardContent>
						</Card>

						{/* Notes */}
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack
									direction="row"
									spacing={2}
									sx={{
										alignItems: 'center',
										mb: 2,
									}}
								>
									<NotesIcon color="primary" />
									<Typography
										variant="h6"
										sx={{
											fontWeight: 700,
										}}
									>
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
									rows={3}
									startIcon={<NotesIcon fontSize="small" />}
								/>
							</CardContent>
						</Card>

						<Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
							<PrimaryLoadingButton
								buttonText={isEditMode ? t.common.update : t.expenses.newExpense}
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
		</LocalizationProvider>
	);
};

const ExpenseFormClient: React.FC<SessionProps & { id?: number }> = ({ session, id }) => {
	const token = useInitAccessToken(session);
	const { t } = useLanguage();
	const title = id !== undefined ? t.expenses.editExpense : t.expenses.newExpense;

	return (
		<Stack
			direction="column"
			spacing={2}
			className={Styles.flexRootStack}
			sx={{
				mt: '48px',
			}}
		>
			<NavigationBar title={title}>
				<Protected permission={id !== undefined ? 'can_edit' : 'can_create'}>
					<FormikContent token={token} id={id} />
				</Protected>
			</NavigationBar>
		</Stack>
	);
};

export default ExpenseFormClient;
