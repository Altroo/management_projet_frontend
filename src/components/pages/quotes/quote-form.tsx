'use client';

import { useState, type ChangeEvent, type FC, type MouseEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
	ReceiptLong as ReceiptLongIcon,
	TaskAlt as TaskAltIcon,
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
import type { QuoteFormValues, QuoteStatus } from '@/types/projectTypes';
import NavigationBar from '@/components/layouts/navigationBar/navigationBar';
import { Protected } from '@/components/layouts/protected/protected';
import CustomTextInput from '@/components/formikElements/customTextInput/customTextInput';
import CustomAutoCompleteSelect from '@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import ApiProgress from '@/components/formikElements/apiLoading/apiProgress/apiProgress';
import EntityCrudControls from '@/components/shared/entityCrudControls/entityCrudControls';
import {
	buildAttachmentFormData,
	QuoteAttachmentsFormSection,
	type QueuedAttachment,
} from '@/components/shared/entityAttachments/entityAttachments';
import { textInputTheme } from '@/utils/themes';
import { quoteSchema } from '@/utils/formValidationSchemas';
import { setFormikAutoErrors, extractApiErrorMessage } from '@/utils/helpers';
import { QUOTES_VIEW, QUOTES_EDIT, QUOTES_LIST } from '@/utils/routes';
import { useLanguage, useToast } from '@/utils/hooks';
import {
	useCreateQuoteMutation,
	useUpdateQuoteMutation,
	useGetQuoteQuery,
	useGetProjectsListQuery,
	useGetExpenseTaxonomyQuery,
	useGetSuppliersQuery,
	useUploadQuoteAttachmentMutation,
	useCreateExpenseCategoryMutation,
	useUpdateExpenseCategoryMutation,
	useDeleteExpenseCategoryMutation,
	useCreateExpenseSubCategoryMutation,
	useUpdateExpenseSubCategoryMutation,
	useDeleteExpenseSubCategoryMutation,
} from '@/store/services/project';
import { useInitAccessToken } from '@/contexts/InitContext';
import Styles from '@/styles/dashboard/dashboard.module.sass';

const inputTheme = textInputTheme();
const FormikContent: FC<{ token?: string; id?: number }> = ({ token, id }) => {
	const { t } = useLanguage();
	const { onSuccess, onError } = useToast();
	const router = useRouter();
	const params = useSearchParams();
	const { data: rawData, isLoading, error } = useGetQuoteQuery({ id: id! }, { skip: !token || !id });
	const { data: projectsData } = useGetProjectsListQuery({ with_pagination: false }, { skip: !token });
	const { data: expenseTaxonomy } = useGetExpenseTaxonomyQuery(undefined, { skip: !token });
	const { data: suppliers } = useGetSuppliersQuery({}, { skip: !token });
	const [createQuote] = useCreateQuoteMutation();
	const [updateQuote] = useUpdateQuoteMutation();
	const [uploadAttachment] = useUploadQuoteAttachmentMutation();
	const [createExpenseCategory] = useCreateExpenseCategoryMutation();
	const [updateExpenseCategory] = useUpdateExpenseCategoryMutation();
	const [deleteExpenseCategory] = useDeleteExpenseCategoryMutation();
	const [createExpenseSubCategory] = useCreateExpenseSubCategoryMutation();
	const [updateExpenseSubCategory] = useUpdateExpenseSubCategoryMutation();
	const [deleteExpenseSubCategory] = useDeleteExpenseSubCategoryMutation();
	const [queuedAttachments, setQueuedAttachments] = useState<QueuedAttachment[]>([]);
	const [saveError, setSaveError] = useState('');
	const projects = Array.isArray(projectsData) ? projectsData : (projectsData?.results ?? []);
	const initialProject = Number(params.get('project'));
	const formik = useFormik<QuoteFormValues>({
		initialValues: {
			project: rawData?.project ?? (initialProject > 0 ? initialProject : ''),
			supplier: rawData?.supplier ?? '',
			number: rawData?.number ?? '',
			date: rawData?.date ?? '',
			category: rawData?.category ?? '',
			sous_categorie: rawData?.sous_categorie ?? '',
			description: rawData?.description ?? '',
			amount_ht: rawData?.amount_ht ?? '',
			amount_tva: rawData?.amount_tva ?? '0.00',
			status: rawData?.status ?? 'received',
			globalError: '',
		},
		enableReinitialize: true,
		validateOnMount: true,
		validationSchema: toFormikValidationSchema(quoteSchema),
		onSubmit: async (values, { setFieldError }) => {
			setSaveError('');
			const { globalError: _globalError, ...fields } = values;
			void _globalError;
			const data = {
				...fields,
				number: fields.number.trim(),
				description: fields.description.trim(),
				category: fields.category || null,
				sous_categorie: fields.sous_categorie || null,
				amount_ht: fields.amount_ht.replace(',', '.'),
				amount_tva: fields.amount_tva.replace(',', '.'),
			};
			try {
				const saved = id ? await updateQuote({ id, data }).unwrap() : await createQuote({ data }).unwrap();
				if (!id && queuedAttachments.length) {
					const uploads = await Promise.allSettled(
						queuedAttachments.map((attachment) =>
							uploadAttachment({ id: saved.id, data: buildAttachmentFormData(attachment) }).unwrap(),
						),
					);
					if (uploads.some((upload) => upload.status === 'rejected')) {
						onError(t.quotes.attachmentError);
						router.replace(QUOTES_EDIT(saved.id));
						return;
					}
				}
				onSuccess(t.quotes.saved);
				router.push(QUOTES_VIEW(saved.id));
			} catch (e) {
				setFormikAutoErrors({ e, setFieldError });
				setSaveError(extractApiErrorMessage(e, t.quotes.saveError));
			}
		},
	});
	const projectItems = projects.map((project) => ({ code: String(project.id), value: project.nom }));
	const supplierItems = (suppliers ?? []).map((supplier) => ({ code: String(supplier.id), value: supplier.nom }));
	const statusItems = (['received', 'validated', 'rejected'] as const).map((status) => ({
		code: status,
		value: t.quotes[status],
	}));
	const fieldLabels: Record<string, string> = {
		project: t.common.project,
		supplier: t.quotes.supplier,
		number: t.quotes.number,
		date: t.common.date,
		category: t.common.category,
		sous_categorie: t.expenses.subCategory,
		description: t.common.description,
		amount_ht: t.quotes.amount_ht,
		amount_tva: t.quotes.amount_tva,
		status: t.quotes.status,
	};
	const validationEntries = Object.entries(formik.errors).filter(([key]) => key !== 'globalError');
	const showValidationAlert = validationEntries.length > 0 && formik.submitCount > 0;
	const categoryItems = (expenseTaxonomy ?? []).map((c) => ({ code: String(c.id), value: c.name }));
	const selectedCategory = categoryItems.find((c) => c.code === String(formik.values.category)) ?? null;
	const subCategoryItems = (expenseTaxonomy?.find((c) => c.id === formik.values.category)?.subcategories ?? []).map(
		(c) => ({ code: String(c.id), value: c.name }),
	);
	const selectedSubCategory = subCategoryItems.find((c) => c.code === String(formik.values.sous_categorie)) ?? null;
	const total =
		(Math.round(Number(formik.values.amount_ht.replace(',', '.')) * 100) +
			Math.round(Number(formik.values.amount_tva.replace(',', '.')) * 100)) /
		100;
	if (id && isLoading) return <ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />;
	if (id && (error || !rawData)) return <Alert severity="error">{t.quotes.loadError}</Alert>;
	return (
		<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
			<Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
				<Button
					variant="outlined"
					startIcon={<ArrowBackIcon />}
					onClick={() => router.push(QUOTES_LIST)}
					sx={{ alignSelf: 'flex-start' }}
				>
					{t.quotes.backToList}
				</Button>
				{saveError && <Alert severity="error">{saveError}</Alert>}
				{showValidationAlert && (
					<Alert severity="error" icon={<WarningIcon />}>
						<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
							{t.common.validationErrorsDetected}
						</Typography>
						<ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
							{validationEntries.map(([key, error]) => (
								<li key={key}>
									<Typography variant="body2">
										<strong>{fieldLabels[key] ?? key}</strong> : {error}
									</Typography>
								</li>
							))}
						</ul>
					</Alert>
				)}
				{formik.isSubmitting && <ApiProgress backdropColor="#FFFFFF" circularColor="#0D070B" />}
				<form onSubmit={formik.handleSubmit}>
					<Stack spacing={3}>
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
									<ReceiptLongIcon color="primary" />
									<Typography variant="h6" sx={{ fontWeight: 700 }}>
										{t.quotes.quoteDetails}
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
										value={projectItems.find((item) => item.code === String(formik.values.project)) ?? null}
										fullWidth
										onChange={(_, newVal) => {
											void formik.setFieldValue('project', newVal ? Number(newVal.code) : '');
										}}
										onBlur={formik.handleBlur('project')}
										error={formik.submitCount > 0 && Boolean(formik.errors.project)}
										helperText={formik.submitCount > 0 ? (formik.errors.project ?? '') : ''}
										startIcon={<AssignmentIcon fontSize="small" />}
									/>
									<CustomAutoCompleteSelect
										id="supplier"
										size="small"
										noOptionsText={t.suppliers.noSupplierFound}
										label={`${t.quotes.supplier} *`}
										items={supplierItems}
										theme={inputTheme}
										value={supplierItems.find((item) => item.code === String(formik.values.supplier)) ?? null}
										fullWidth
										onChange={(_, newVal) => {
											void formik.setFieldValue('supplier', newVal ? Number(newVal.code) : '');
										}}
										onBlur={formik.handleBlur('supplier')}
										error={formik.submitCount > 0 && Boolean(formik.errors.supplier)}
										helperText={formik.submitCount > 0 ? (formik.errors.supplier ?? '') : ''}
										startIcon={<PersonIcon fontSize="small" />}
									/>
									<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
										<CustomTextInput
											theme={inputTheme}
											id="number"
											type="text"
											size="small"
											label={`${t.quotes.number} *`}
											value={formik.values.number}
											onChange={formik.handleChange('number')}
											onBlur={formik.handleBlur('number')}
											error={formik.submitCount > 0 && Boolean(formik.errors.number)}
											helperText={formik.submitCount > 0 ? (formik.errors.number ?? '') : ''}
											fullWidth
											startIcon={<ReceiptLongIcon fontSize="small" />}
										/>
										<DatePicker
											label={`${t.common.date} *`}
											disabled={formik.isSubmitting}
											value={formik.values.date ? parseISO(formik.values.date) : null}
											onChange={(date) =>
												void formik.setFieldValue(
													'date',
													date && !Number.isNaN(date.getTime()) ? format(date, 'yyyy-MM-dd') : '',
												)
											}
											slotProps={{
												textField: {
													size: 'small',
													fullWidth: true,
													onBlur: formik.handleBlur('date'),
													slotProps: {
														input: {
															startAdornment: (
																<InputAdornment position="start">
																	<CalendarMonthIcon fontSize="small" />
																</InputAdornment>
															),
														},
													},
													error: formik.submitCount > 0 && Boolean(formik.errors.date),
													helperText: formik.submitCount ? formik.errors.date : '',
												},
											}}
										/>
									</Stack>
									<CustomTextInput
										theme={inputTheme}
										id="description"
										type="textarea"
										size="small"
										label={`${t.common.description} *`}
										value={formik.values.description}
										onChange={formik.handleChange('description')}
										onBlur={formik.handleBlur('description')}
										error={formik.submitCount > 0 && Boolean(formik.errors.description)}
										helperText={formik.submitCount > 0 ? (formik.errors.description ?? '') : ''}
										fullWidth
										startIcon={<NotesIcon fontSize="small" />}
										multiline
										rows={3}
									/>
									<CustomAutoCompleteSelect
										id="status"
										size="small"
										noOptionsText={t.common.noOptions}
										label={t.quotes.status}
										items={statusItems}
										theme={inputTheme}
										value={statusItems.find((item) => item.code === String(formik.values.status)) ?? null}
										fullWidth
										onChange={(_, newVal) => {
											void formik.setFieldValue('status', (newVal?.code ?? 'received') as QuoteStatus);
										}}
										onBlur={formik.handleBlur('status')}
										error={formik.submitCount > 0 && Boolean(formik.errors.status)}
										helperText={formik.submitCount > 0 ? (formik.errors.status ?? '') : ''}
										startIcon={<TaskAltIcon fontSize="small" />}
									/>
								</Stack>
							</CardContent>
						</Card>
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
									<CategoryIcon color="primary" />
									<Typography variant="h6" sx={{ fontWeight: 700 }}>
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
										value={categoryItems.find((item) => item.code === String(formik.values.category)) ?? null}
										fullWidth
										onChange={(_, newVal) => {
											void formik.setFieldValue('category', newVal ? Number(newVal.code) : '');
											void formik.setFieldValue('sous_categorie', '');
										}}
										onBlur={formik.handleBlur('category')}
										error={formik.submitCount > 0 && Boolean(formik.errors.category)}
										helperText={formik.submitCount > 0 ? (formik.errors.category ?? '') : ''}
										startIcon={<CategoryIcon fontSize="small" />}
										endIcon={
											<EntityCrudControls
												label={t.common.category.toLowerCase()}
												icon={<CategoryIcon fontSize="small" />}
												inputTheme={inputTheme}
												selectedItem={selectedCategory}
												addEntity={({ data }) => createExpenseCategory({ data: { name: String(data.name) } })}
												editEntity={({ id, data }) => updateExpenseCategory({ id, data: { name: String(data.name) } })}
												deleteEntity={deleteExpenseCategory}
												onAddSuccess={(value) => {
													void formik.setFieldValue('category', value);
													void formik.setFieldValue('sous_categorie', '');
												}}
												onDeleteSuccess={() => {
													void formik.setFieldValue('category', '');
													void formik.setFieldValue('sous_categorie', '');
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
										value={subCategoryItems.find((item) => item.code === String(formik.values.sous_categorie)) ?? null}
										fullWidth
										onChange={(_, newVal) => {
											void formik.setFieldValue('sous_categorie', newVal ? Number(newVal.code) : '');
										}}
										onBlur={formik.handleBlur('sous_categorie')}
										error={formik.submitCount > 0 && Boolean(formik.errors.sous_categorie)}
										helperText={formik.submitCount > 0 ? (formik.errors.sous_categorie ?? '') : ''}
										startIcon={<CategoryIcon fontSize="small" />}
										endIcon={
											<EntityCrudControls
												label={t.expenses.subCategory.toLowerCase()}
												icon={<CategoryIcon fontSize="small" />}
												inputTheme={inputTheme}
												selectedItem={selectedSubCategory}
												addEntity={({ data }) =>
													createExpenseSubCategory({
														data: { name: String(data.name), category: Number(data.category) },
													})
												}
												editEntity={({ id, data }) =>
													updateExpenseSubCategory({
														id,
														data: { name: String(data.name), category: Number(data.category) },
													})
												}
												deleteEntity={deleteExpenseSubCategory}
												addDisabled={!formik.values.category}
												disabled={!formik.values.category}
												buildAddPayload={(name) => ({ name, category: Number(formik.values.category) })}
												buildEditPayload={(name) => ({ name, category: Number(formik.values.category) })}
												onAddSuccess={(value) => void formik.setFieldValue('sous_categorie', value)}
												onDeleteSuccess={() => void formik.setFieldValue('sous_categorie', '')}
											/>
										}
									/>
								</Stack>
							</CardContent>
						</Card>
						<Card elevation={2} sx={{ borderRadius: 2 }}>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
									<AttachMoneyIcon color="primary" />
									<Typography variant="h6" sx={{ fontWeight: 700 }}>
										{t.quotes.estimated}
									</Typography>
								</Stack>
								<Divider sx={{ mb: 3 }} />
								<Stack spacing={2.5}>
									<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
										<CustomTextInput
											theme={inputTheme}
											id="amount_ht"
											type="text"
											size="small"
											label={`${t.quotes.amount_ht} (MAD) *`}
											value={formik.values.amount_ht}
											onChange={(e: ChangeEvent<HTMLInputElement>) => {
												if (/^(0|[1-9]\d*)?([.,]\d*)?$/.test(e.target.value))
													void formik.setFieldValue('amount_ht', e.target.value);
											}}
											onBlur={formik.handleBlur('amount_ht')}
											error={formik.submitCount > 0 && Boolean(formik.errors.amount_ht)}
											helperText={formik.submitCount > 0 ? (formik.errors.amount_ht ?? '') : ''}
											fullWidth
											startIcon={<AttachMoneyIcon fontSize="small" />}
											slotProps={{ input: { inputProps: { inputMode: 'decimal' } } }}
										/>
										<CustomTextInput
											theme={inputTheme}
											id="amount_tva"
											type="text"
											size="small"
											label={`${t.quotes.amount_tva} (MAD) *`}
											value={formik.values.amount_tva}
											onChange={(e: ChangeEvent<HTMLInputElement>) => {
												if (/^(0|[1-9]\d*)?([.,]\d*)?$/.test(e.target.value))
													void formik.setFieldValue('amount_tva', e.target.value);
											}}
											onBlur={formik.handleBlur('amount_tva')}
											error={formik.submitCount > 0 && Boolean(formik.errors.amount_tva)}
											helperText={formik.submitCount > 0 ? (formik.errors.amount_tva ?? '') : ''}
											fullWidth
											startIcon={<AttachMoneyIcon fontSize="small" />}
											slotProps={{ input: { inputProps: { inputMode: 'decimal' } } }}
										/>
									</Stack>
									<Typography variant="h6">
										{t.quotes.amount_ttc}:{' '}
										{Number.isFinite(total) ? total.toLocaleString('fr-MA', { minimumFractionDigits: 2 }) : '—'} MAD
									</Typography>
								</Stack>
							</CardContent>
						</Card>
						<QuoteAttachmentsFormSection
							id={id}
							queuedAttachments={queuedAttachments}
							setQueuedAttachments={setQueuedAttachments}
						/>
						<Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
							<PrimaryLoadingButton
								buttonText={id ? t.common.update : t.quotes.newQuote}
								loading={formik.isSubmitting}
								active={!formik.isSubmitting}
								type="submit"
								startIcon={id ? <EditIcon /> : <AddIcon />}
								onClick={(e: MouseEvent<HTMLButtonElement>) => {
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
const QuoteFormClient: FC<SessionProps & { id?: number }> = ({ session, id }) => {
	const token = useInitAccessToken(session);
	const { t } = useLanguage();
	return (
		<Stack direction="column" spacing={2} className={Styles.flexRootStack} sx={{ mt: '48px' }}>
			<NavigationBar title={id ? t.quotes.editQuote : t.quotes.newQuote}>
				<Protected permission={id ? 'can_edit' : 'can_create'}>
					<FormikContent token={token} id={id} />
				</Protected>
			</NavigationBar>
		</Stack>
	);
};
export default QuoteFormClient;
