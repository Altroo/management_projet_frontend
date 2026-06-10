import { createApi } from '@reduxjs/toolkit/query/react';
import { retry } from '@reduxjs/toolkit/query';
import { isAuthenticatedInstance } from '@/utils/helpers';
import { axiosBaseQuery } from '@/utils/axiosBaseQuery';
import { getInitStateToken } from '@/store/selectors';
import type { RootState } from '@/store/store';
import { initToken } from '@/store/slices/_initSlice';
import type { ApiErrorResponseType, PaginationResponseType } from '@/types/_initTypes';
import type {
	CategoryType,
	AttachmentType,
	ClientFormValues,
	ClientType,
	ExpenseCategoryTreeType,
	SubCategoryType,
	ProjectListType,
	ProjectPaymentScheduleType,
	ProjectRealBudgetEntryType,
	ProjectType,
	PaymentScheduleFormValues,
	RealBudgetEntryFormValues,
	ProjectFormValues,
	CategoryFormValues,
	SubCategoryFormValues,
	RevenueType,
	RevenueFormValues,
	ExpenseType,
	ExpenseFormValues,
	ProjectDashboardType,
	MultiProjectDashboardType,
	ClientDashboardType,
	SupplierFormValues,
	SupplierType,
} from '@/types/projectTypes';

const rawBaseQuery = axiosBaseQuery((api) =>
	isAuthenticatedInstance(
		() => getInitStateToken(api.getState() as RootState),
		() => api.dispatch(initToken()),
	),
);

const baseQueryWithRetry = retry(
	async (args, api, extraOptions) => {
		const result = await rawBaseQuery(args, api, extraOptions);
		if (result.error && result.error.status !== 503 && result.error.status !== 0) {
			retry.fail(result.error);
		}
		return result;
	},
	{ maxRetries: 2 },
);

export const projectApi = createApi({
	reducerPath: 'projectApi',
	tagTypes: [
		'Project',
		'Client',
		'Supplier',
		'Category',
		'SubCategory',
		'Revenue',
		'Expense',
		'Attachment',
		'PaymentSchedule',
		'RealBudget',
		'ProjectDashboard',
		'MultiProjectDashboard',
		'ClientDashboard',
	],
	baseQuery: baseQueryWithRetry,
	endpoints: (builder) => ({
		// ── Expense Taxonomy ────────────────────────────────────────────────
		getExpenseTaxonomy: builder.query<ExpenseCategoryTreeType[], void>({
			query: () => ({
				url: process.env.NEXT_PUBLIC_PROJECT_EXPENSE_TAXONOMY,
				method: 'GET',
			}),
			providesTags: ['Category', 'SubCategory'],
		}),

		createExpenseCategory: builder.mutation<
			CategoryType | ApiErrorResponseType,
			{ data: Omit<CategoryFormValues, 'globalError'> }
		>({
			query: ({ data }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_EXPENSE_TAXONOMY}categories/`,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['Category', 'SubCategory', 'Expense'],
		}),

		updateExpenseCategory: builder.mutation<
			CategoryType | ApiErrorResponseType,
			{ id: number; data: Omit<CategoryFormValues, 'globalError'> }
		>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_EXPENSE_TAXONOMY}categories/${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['Category', 'SubCategory', 'Expense'],
		}),

		deleteExpenseCategory: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_EXPENSE_TAXONOMY}categories/${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Category', 'SubCategory', 'Expense'],
		}),

		createExpenseSubCategory: builder.mutation<
			SubCategoryType | ApiErrorResponseType,
			{ data: Omit<SubCategoryFormValues, 'globalError'> }
		>({
			query: ({ data }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_EXPENSE_TAXONOMY}subcategories/`,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['Category', 'SubCategory', 'Expense'],
		}),

		updateExpenseSubCategory: builder.mutation<
			SubCategoryType | ApiErrorResponseType,
			{ id: number; data: Omit<SubCategoryFormValues, 'globalError'> }
		>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_EXPENSE_TAXONOMY}subcategories/${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['Category', 'SubCategory', 'Expense'],
		}),

		deleteExpenseSubCategory: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_EXPENSE_TAXONOMY}subcategories/${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Category', 'SubCategory', 'Expense'],
		}),

		// ── Clients ─────────────────────────────────────────────────────────
		getClients: builder.query<ClientType[], { search?: string }>({
			query: ({ search } = {}) => ({
				url: process.env.NEXT_PUBLIC_PROJECT_CLIENTS,
				method: 'GET',
				params: { search },
			}),
			providesTags: ['Client'],
		}),

		getClient: builder.query<ClientType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_CLIENTS}${id}/`,
				method: 'GET',
			}),
			providesTags: ['Client'],
		}),

		createClient: builder.mutation<ClientType | ApiErrorResponseType, { data: Omit<ClientFormValues, 'globalError'> }>({
			query: ({ data }) => ({
				url: process.env.NEXT_PUBLIC_PROJECT_CLIENTS,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['Client', 'Project', 'ProjectDashboard', 'MultiProjectDashboard', 'ClientDashboard'],
		}),

		updateClient: builder.mutation<
			ClientType | ApiErrorResponseType,
			{ id: number; data: Omit<ClientFormValues, 'globalError'> }
		>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_CLIENTS}${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['Client', 'Project', 'ProjectDashboard', 'MultiProjectDashboard', 'ClientDashboard'],
		}),

		deleteClient: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_CLIENTS}${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Client', 'Project', 'ProjectDashboard', 'MultiProjectDashboard', 'ClientDashboard'],
		}),

		bulkDeleteClients: builder.mutation<void, { ids: number[] }>({
			query: ({ ids }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_CLIENTS}bulk_delete/`,
				method: 'DELETE',
				data: { ids },
			}),
			invalidatesTags: ['Client', 'Project', 'ProjectDashboard', 'MultiProjectDashboard', 'ClientDashboard'],
		}),

		// ── Suppliers ───────────────────────────────────────────────────────
		getSuppliers: builder.query<SupplierType[], { search?: string }>({
			query: ({ search } = {}) => ({
				url: process.env.NEXT_PUBLIC_PROJECT_SUPPLIERS,
				method: 'GET',
				params: { search },
			}),
			providesTags: ['Supplier'],
		}),

		getSupplier: builder.query<SupplierType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_SUPPLIERS}${id}/`,
				method: 'GET',
			}),
			providesTags: ['Supplier'],
		}),

		createSupplier: builder.mutation<
			SupplierType | ApiErrorResponseType,
			{ data: Omit<SupplierFormValues, 'globalError'> }
		>({
			query: ({ data }) => ({
				url: process.env.NEXT_PUBLIC_PROJECT_SUPPLIERS,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['Supplier', 'Expense', 'ProjectDashboard', 'MultiProjectDashboard', 'ClientDashboard'],
		}),

		updateSupplier: builder.mutation<
			SupplierType | ApiErrorResponseType,
			{ id: number; data: Omit<SupplierFormValues, 'globalError'> }
		>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_SUPPLIERS}${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['Supplier', 'Expense', 'ProjectDashboard', 'MultiProjectDashboard', 'ClientDashboard'],
		}),

		deleteSupplier: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_SUPPLIERS}${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Supplier', 'Expense', 'ProjectDashboard', 'MultiProjectDashboard', 'ClientDashboard'],
		}),

		bulkDeleteSuppliers: builder.mutation<void, { ids: number[] }>({
			query: ({ ids }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_SUPPLIERS}bulk_delete/`,
				method: 'DELETE',
				data: { ids },
			}),
			invalidatesTags: ['Supplier', 'Expense', 'ProjectDashboard', 'MultiProjectDashboard', 'ClientDashboard'],
		}),

		// ── Categories ──────────────────────────────────────────────────────
		getCategories: builder.query<CategoryType[], void>({
			query: () => ({
				url: process.env.NEXT_PUBLIC_PROJECT_CATEGORIES,
				method: 'GET',
			}),
			providesTags: ['Category'],
		}),

		getCategory: builder.query<CategoryType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_CATEGORIES}${id}/`,
				method: 'GET',
			}),
			providesTags: ['Category'],
		}),

		createCategory: builder.mutation<
			CategoryType | ApiErrorResponseType,
			{ data: Omit<CategoryFormValues, 'globalError'> }
		>({
			query: ({ data }) => ({
				url: process.env.NEXT_PUBLIC_PROJECT_CATEGORIES,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['Category'],
		}),

		updateCategory: builder.mutation<
			CategoryType | ApiErrorResponseType,
			{ id: number; data: Omit<CategoryFormValues, 'globalError'> }
		>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_CATEGORIES}${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['Category'],
		}),

		deleteCategory: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_CATEGORIES}${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Category'],
		}),

		bulkDeleteCategories: builder.mutation<void, { ids: number[] }>({
			query: ({ ids }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_CATEGORIES}bulk_delete/`,
				method: 'DELETE',
				data: { ids },
			}),
			invalidatesTags: ['Category'],
		}),

		// ── SubCategories ───────────────────────────────────────────────────
		getSubCategories: builder.query<SubCategoryType[], { category?: number }>({
			query: ({ category }) => ({
				url: process.env.NEXT_PUBLIC_PROJECT_SUBCATEGORIES,
				method: 'GET',
				params: { category },
			}),
			providesTags: ['SubCategory'],
		}),

		getSubCategory: builder.query<SubCategoryType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_SUBCATEGORIES}${id}/`,
				method: 'GET',
			}),
			providesTags: ['SubCategory'],
		}),

		createSubCategory: builder.mutation<
			SubCategoryType | ApiErrorResponseType,
			{ data: Omit<SubCategoryFormValues, 'globalError'> }
		>({
			query: ({ data }) => ({
				url: process.env.NEXT_PUBLIC_PROJECT_SUBCATEGORIES,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['SubCategory'],
		}),

		updateSubCategory: builder.mutation<
			SubCategoryType | ApiErrorResponseType,
			{ id: number; data: Omit<SubCategoryFormValues, 'globalError'> }
		>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_SUBCATEGORIES}${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['SubCategory'],
		}),

		deleteSubCategory: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_SUBCATEGORIES}${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['SubCategory'],
		}),

		bulkDeleteSubCategories: builder.mutation<void, { ids: number[] }>({
			query: ({ ids }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_SUBCATEGORIES}bulk_delete/`,
				method: 'DELETE',
				data: { ids },
			}),
			invalidatesTags: ['SubCategory'],
		}),

		// ── Projects ────────────────────────────────────────────────────────
		getProjectsList: builder.query<
			ProjectListType[] | PaginationResponseType<ProjectListType>,
			{
				with_pagination?: boolean;
				page?: number;
				pageSize?: number;
				search?: string;
				status?: string;
				date_debut_after?: string;
				date_debut_before?: string;
				date_fin_after?: string;
				date_fin_before?: string;
				[key: string]: string | number | boolean | undefined;
			}
		>({
			query: ({ with_pagination, page, pageSize, search, status, ...rest }) => ({
				url: process.env.NEXT_PUBLIC_PROJECT_LIST,
				method: 'GET',
				params: {
					pagination: with_pagination || undefined,
					page: with_pagination ? page : undefined,
					page_size: with_pagination ? pageSize : undefined,
					search,
					status,
					...rest,
				},
			}),
			providesTags: ['Project'],
		}),

		getProject: builder.query<ProjectType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_LIST}${id}/`,
				method: 'GET',
			}),
			providesTags: ['Project'],
		}),

		createProject: builder.mutation<
			ProjectType | ApiErrorResponseType,
			{ data: Omit<ProjectFormValues, 'globalError' | 'client'> & { client: number | null } }
		>({
			query: ({ data }) => ({
				url: process.env.NEXT_PUBLIC_PROJECT_LIST,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['Project', 'ProjectDashboard', 'MultiProjectDashboard', 'ClientDashboard'],
		}),

		updateProject: builder.mutation<
			ProjectType | ApiErrorResponseType,
			{ id: number; data: Omit<ProjectFormValues, 'globalError' | 'client'> & { client: number | null } }
		>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_LIST}${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['Project', 'ProjectDashboard', 'MultiProjectDashboard', 'ClientDashboard'],
		}),

		deleteProject: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_LIST}${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: [
				'Project',
				'ProjectDashboard',
				'MultiProjectDashboard',
				'ClientDashboard',
				'Revenue',
				'Expense',
			],
		}),

		bulkDeleteProjects: builder.mutation<void, { ids: number[] }>({
			query: ({ ids }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_LIST}bulk_delete/`,
				method: 'DELETE',
				data: { ids },
			}),
			invalidatesTags: [
				'Project',
				'ProjectDashboard',
				'MultiProjectDashboard',
				'ClientDashboard',
				'Revenue',
				'Expense',
			],
		}),

		getProjectAttachments: builder.query<AttachmentType[], { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_LIST}${id}/attachments/`,
				method: 'GET',
			}),
			providesTags: ['Attachment'],
		}),

		uploadProjectAttachment: builder.mutation<AttachmentType | ApiErrorResponseType, { id: number; data: FormData }>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_LIST}${id}/attachments/`,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['Attachment'],
		}),

		deleteProjectAttachment: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_LIST}attachments/${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Attachment'],
		}),

		getPaymentSchedules: builder.query<ProjectPaymentScheduleType[], { project?: number }>({
			query: ({ project } = {}) => ({
				url: process.env.NEXT_PUBLIC_PROJECT_PAYMENT_SCHEDULES,
				method: 'GET',
				params: { project },
			}),
			providesTags: ['PaymentSchedule'],
		}),

		getPaymentSchedule: builder.query<ProjectPaymentScheduleType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_PAYMENT_SCHEDULES}${id}/`,
				method: 'GET',
			}),
			providesTags: ['PaymentSchedule'],
		}),

		createPaymentSchedule: builder.mutation<
			ProjectPaymentScheduleType | ApiErrorResponseType,
			{ data: Omit<PaymentScheduleFormValues, 'globalError'> }
		>({
			query: ({ data }) => ({
				url: process.env.NEXT_PUBLIC_PROJECT_PAYMENT_SCHEDULES,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['PaymentSchedule', 'Project', 'ProjectDashboard', 'MultiProjectDashboard', 'ClientDashboard'],
		}),

		updatePaymentSchedule: builder.mutation<
			ProjectPaymentScheduleType | ApiErrorResponseType,
			{ id: number; data: Omit<PaymentScheduleFormValues, 'globalError'> }
		>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_PAYMENT_SCHEDULES}${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['PaymentSchedule', 'Project', 'ProjectDashboard', 'MultiProjectDashboard', 'ClientDashboard'],
		}),

		deletePaymentSchedule: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_PAYMENT_SCHEDULES}${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['PaymentSchedule', 'Project', 'ProjectDashboard', 'MultiProjectDashboard', 'ClientDashboard'],
		}),

		bulkDeletePaymentSchedules: builder.mutation<void, { ids: number[] }>({
			query: ({ ids }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_PAYMENT_SCHEDULES}bulk_delete/`,
				method: 'DELETE',
				data: { ids },
			}),
			invalidatesTags: ['PaymentSchedule', 'Project', 'ProjectDashboard', 'MultiProjectDashboard', 'ClientDashboard'],
		}),

		getRealBudgetEntries: builder.query<
			ProjectRealBudgetEntryType[],
			{ project?: number; stage?: string; search?: string }
		>({
			query: ({ project, stage, search } = {}) => ({
				url: process.env.NEXT_PUBLIC_PROJECT_REAL_BUDGET_ENTRIES,
				method: 'GET',
				params: { project, stage, search },
			}),
			providesTags: ['RealBudget'],
		}),

		getRealBudgetEntry: builder.query<ProjectRealBudgetEntryType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_REAL_BUDGET_ENTRIES}${id}/`,
				method: 'GET',
			}),
			providesTags: ['RealBudget'],
		}),

		createRealBudgetEntry: builder.mutation<
			ProjectRealBudgetEntryType | ApiErrorResponseType,
			{ data: Omit<RealBudgetEntryFormValues, 'globalError'> }
		>({
			query: ({ data }) => ({
				url: process.env.NEXT_PUBLIC_PROJECT_REAL_BUDGET_ENTRIES,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['RealBudget', 'Project', 'ProjectDashboard', 'MultiProjectDashboard', 'ClientDashboard'],
		}),

		updateRealBudgetEntry: builder.mutation<
			ProjectRealBudgetEntryType | ApiErrorResponseType,
			{ id: number; data: Omit<RealBudgetEntryFormValues, 'globalError'> }
		>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_REAL_BUDGET_ENTRIES}${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['RealBudget', 'Project', 'ProjectDashboard', 'MultiProjectDashboard', 'ClientDashboard'],
		}),

		deleteRealBudgetEntry: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_REAL_BUDGET_ENTRIES}${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['RealBudget', 'Project', 'ProjectDashboard', 'MultiProjectDashboard', 'ClientDashboard'],
		}),

		bulkDeleteRealBudgetEntries: builder.mutation<void, { ids: number[] }>({
			query: ({ ids }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_REAL_BUDGET_ENTRIES}bulk_delete/`,
				method: 'DELETE',
				data: { ids },
			}),
			invalidatesTags: ['RealBudget', 'Project', 'ProjectDashboard', 'MultiProjectDashboard', 'ClientDashboard'],
		}),

		downloadProjectReport: builder.mutation<Blob, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_LIST}${id}/report.pdf`,
				method: 'GET',
				responseType: 'blob',
			}),
		}),

		// ── Revenues ────────────────────────────────────────────────────────
		getRevenues: builder.query<
			RevenueType[],
			{
				project?: number;
				search?: string;
				date_after?: string;
				date_before?: string;
				[key: string]: string | number | undefined;
			}
		>({
			query: ({ project, search, ...rest }) => ({
				url: process.env.NEXT_PUBLIC_REVENUE_LIST,
				method: 'GET',
				params: { project, search, ...rest },
			}),
			providesTags: ['Revenue'],
		}),

		getRevenue: builder.query<RevenueType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_REVENUE_LIST}${id}/`,
				method: 'GET',
			}),
			providesTags: ['Revenue'],
		}),

		createRevenue: builder.mutation<
			RevenueType | ApiErrorResponseType,
			{ data: Omit<RevenueFormValues, 'globalError'> }
		>({
			query: ({ data }) => ({
				url: process.env.NEXT_PUBLIC_REVENUE_LIST,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['Revenue', 'Project', 'ProjectDashboard', 'MultiProjectDashboard', 'ClientDashboard'],
		}),

		updateRevenue: builder.mutation<
			RevenueType | ApiErrorResponseType,
			{ id: number; data: Omit<RevenueFormValues, 'globalError'> }
		>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_REVENUE_LIST}${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['Revenue', 'Project', 'ProjectDashboard', 'MultiProjectDashboard', 'ClientDashboard'],
		}),

		deleteRevenue: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_REVENUE_LIST}${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Revenue', 'Project', 'ProjectDashboard', 'MultiProjectDashboard', 'ClientDashboard'],
		}),

		bulkDeleteRevenues: builder.mutation<void, { ids: number[] }>({
			query: ({ ids }) => ({
				url: `${process.env.NEXT_PUBLIC_REVENUE_LIST}bulk_delete/`,
				method: 'DELETE',
				data: { ids },
			}),
			invalidatesTags: ['Revenue', 'Project', 'ProjectDashboard', 'MultiProjectDashboard', 'ClientDashboard'],
		}),

		getRevenueAttachments: builder.query<AttachmentType[], { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_REVENUE_LIST}${id}/attachments/`,
				method: 'GET',
			}),
			providesTags: ['Attachment'],
		}),

		uploadRevenueAttachment: builder.mutation<AttachmentType | ApiErrorResponseType, { id: number; data: FormData }>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_REVENUE_LIST}${id}/attachments/`,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['Attachment'],
		}),

		deleteRevenueAttachment: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_REVENUE_LIST}attachments/${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Attachment'],
		}),

		// ── Expenses ────────────────────────────────────────────────────────
		getExpenses: builder.query<
			ExpenseType[],
			{
				project?: number;
				category?: number;
				sous_categorie?: number;
				search?: string;
				supplier?: number;
				date_after?: string;
				date_before?: string;
				[key: string]: string | number | undefined;
			}
		>({
			query: ({ project, category, sous_categorie, search, supplier, ...rest }) => ({
				url: process.env.NEXT_PUBLIC_EXPENSE_LIST,
				method: 'GET',
				params: { project, category, sous_categorie, search, supplier, ...rest },
			}),
			providesTags: ['Expense'],
		}),

		getExpense: builder.query<ExpenseType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_EXPENSE_LIST}${id}/`,
				method: 'GET',
			}),
			providesTags: ['Expense'],
		}),

		createExpense: builder.mutation<
			ExpenseType | ApiErrorResponseType,
			{ data: Omit<ExpenseFormValues, 'globalError' | 'supplier'> & { supplier: number | null } }
		>({
			query: ({ data }) => ({
				url: process.env.NEXT_PUBLIC_EXPENSE_LIST,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['Expense', 'Project', 'ProjectDashboard', 'MultiProjectDashboard', 'ClientDashboard'],
		}),

		updateExpense: builder.mutation<
			ExpenseType | ApiErrorResponseType,
			{ id: number; data: Omit<ExpenseFormValues, 'globalError' | 'supplier'> & { supplier: number | null } }
		>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_EXPENSE_LIST}${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['Expense', 'Project', 'ProjectDashboard', 'MultiProjectDashboard', 'ClientDashboard'],
		}),

		deleteExpense: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_EXPENSE_LIST}${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Expense', 'Project', 'ProjectDashboard', 'MultiProjectDashboard', 'ClientDashboard'],
		}),

		bulkDeleteExpenses: builder.mutation<void, { ids: number[] }>({
			query: ({ ids }) => ({
				url: `${process.env.NEXT_PUBLIC_EXPENSE_LIST}bulk_delete/`,
				method: 'DELETE',
				data: { ids },
			}),
			invalidatesTags: ['Expense', 'Project', 'ProjectDashboard', 'MultiProjectDashboard', 'ClientDashboard'],
		}),

		getExpenseAttachments: builder.query<AttachmentType[], { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_EXPENSE_LIST}${id}/attachments/`,
				method: 'GET',
			}),
			providesTags: ['Attachment'],
		}),

		uploadExpenseAttachment: builder.mutation<AttachmentType | ApiErrorResponseType, { id: number; data: FormData }>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_EXPENSE_LIST}${id}/attachments/`,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['Attachment'],
		}),

		deleteExpenseAttachment: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_EXPENSE_LIST}attachments/${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Attachment'],
		}),

		// ── Dashboard ───────────────────────────────────────────────────────
		getProjectDashboard: builder.query<ProjectDashboardType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_LIST}dashboard/${id}/`,
				method: 'GET',
			}),
			providesTags: ['ProjectDashboard'],
		}),

		getMultiProjectDashboard: builder.query<MultiProjectDashboardType, void>({
			query: () => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_LIST}dashboard/`,
				method: 'GET',
			}),
			providesTags: ['MultiProjectDashboard'],
		}),

		getClientDashboard: builder.query<ClientDashboardType, void>({
			query: () => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_LIST}dashboard/client/`,
				method: 'GET',
			}),
			providesTags: ['ClientDashboard'],
		}),

		getClientProjectDashboard: builder.query<ProjectDashboardType, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_LIST}dashboard/client/${id}/`,
				method: 'GET',
			}),
			providesTags: ['ClientDashboard'],
		}),
	}),
});

export const {
	// Expense Taxonomy
	useGetExpenseTaxonomyQuery,
	useCreateExpenseCategoryMutation,
	useUpdateExpenseCategoryMutation,
	useDeleteExpenseCategoryMutation,
	useCreateExpenseSubCategoryMutation,
	useUpdateExpenseSubCategoryMutation,
	useDeleteExpenseSubCategoryMutation,
	// Clients
	useGetClientsQuery,
	useGetClientQuery,
	useCreateClientMutation,
	useUpdateClientMutation,
	useDeleteClientMutation,
	useBulkDeleteClientsMutation,
	// Suppliers
	useGetSuppliersQuery,
	useGetSupplierQuery,
	useCreateSupplierMutation,
	useUpdateSupplierMutation,
	useDeleteSupplierMutation,
	useBulkDeleteSuppliersMutation,
	// Categories
	useGetCategoriesQuery,
	useGetCategoryQuery,
	useCreateCategoryMutation,
	useUpdateCategoryMutation,
	useDeleteCategoryMutation,
	useBulkDeleteCategoriesMutation,
	// SubCategories
	useGetSubCategoriesQuery,
	useGetSubCategoryQuery,
	useCreateSubCategoryMutation,
	useUpdateSubCategoryMutation,
	useDeleteSubCategoryMutation,
	useBulkDeleteSubCategoriesMutation,
	// Projects
	useGetProjectsListQuery,
	useGetProjectQuery,
	useCreateProjectMutation,
	useUpdateProjectMutation,
	useDeleteProjectMutation,
	useBulkDeleteProjectsMutation,
	useGetProjectAttachmentsQuery,
	useUploadProjectAttachmentMutation,
	useDeleteProjectAttachmentMutation,
	useGetPaymentSchedulesQuery,
	useGetPaymentScheduleQuery,
	useCreatePaymentScheduleMutation,
	useUpdatePaymentScheduleMutation,
	useDeletePaymentScheduleMutation,
	useBulkDeletePaymentSchedulesMutation,
	useGetRealBudgetEntriesQuery,
	useGetRealBudgetEntryQuery,
	useCreateRealBudgetEntryMutation,
	useUpdateRealBudgetEntryMutation,
	useDeleteRealBudgetEntryMutation,
	useBulkDeleteRealBudgetEntriesMutation,
	useDownloadProjectReportMutation,
	// Revenues
	useGetRevenuesQuery,
	useGetRevenueQuery,
	useCreateRevenueMutation,
	useUpdateRevenueMutation,
	useDeleteRevenueMutation,
	useBulkDeleteRevenuesMutation,
	useGetRevenueAttachmentsQuery,
	useUploadRevenueAttachmentMutation,
	useDeleteRevenueAttachmentMutation,
	// Expenses
	useGetExpensesQuery,
	useGetExpenseQuery,
	useCreateExpenseMutation,
	useUpdateExpenseMutation,
	useDeleteExpenseMutation,
	useBulkDeleteExpensesMutation,
	useGetExpenseAttachmentsQuery,
	useUploadExpenseAttachmentMutation,
	useDeleteExpenseAttachmentMutation,
	// Dashboard
	useGetProjectDashboardQuery,
	useGetMultiProjectDashboardQuery,
	useGetClientDashboardQuery,
	useGetClientProjectDashboardQuery,
} = projectApi;
