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
	SubCategoryType,
	ProjectListType,
	ProjectType,
	ProjectFormValues,
	CategoryFormValues,
	SubCategoryFormValues,
	RevenueType,
	RevenueFormValues,
	ExpenseType,
	ExpenseFormValues,
	ProjectDashboardType,
	MultiProjectDashboardType,
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
	tagTypes: ['Project', 'Category', 'SubCategory', 'Revenue', 'Expense', 'ProjectDashboard', 'MultiProjectDashboard'],
	baseQuery: baseQueryWithRetry,
	endpoints: (builder) => ({
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

		createCategory: builder.mutation<CategoryType | ApiErrorResponseType, { data: Omit<CategoryFormValues, 'globalError'> }>({
			query: ({ data }) => ({
				url: process.env.NEXT_PUBLIC_PROJECT_CATEGORIES,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['Category'],
		}),

		updateCategory: builder.mutation<CategoryType | ApiErrorResponseType, { id: number; data: Omit<CategoryFormValues, 'globalError'> }>({
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

		createSubCategory: builder.mutation<SubCategoryType | ApiErrorResponseType, { data: Omit<SubCategoryFormValues, 'globalError'> }>({
			query: ({ data }) => ({
				url: process.env.NEXT_PUBLIC_PROJECT_SUBCATEGORIES,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['SubCategory'],
		}),

		updateSubCategory: builder.mutation<SubCategoryType | ApiErrorResponseType, { id: number; data: Omit<SubCategoryFormValues, 'globalError'> }>({
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

		createProject: builder.mutation<ProjectType | ApiErrorResponseType, { data: Omit<ProjectFormValues, 'globalError'> }>({
			query: ({ data }) => ({
				url: process.env.NEXT_PUBLIC_PROJECT_LIST,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['Project', 'ProjectDashboard', 'MultiProjectDashboard'],
		}),

		updateProject: builder.mutation<ProjectType | ApiErrorResponseType, { id: number; data: Omit<ProjectFormValues, 'globalError'> }>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_LIST}${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['Project', 'ProjectDashboard', 'MultiProjectDashboard'],
		}),

		deleteProject: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_LIST}${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Project', 'ProjectDashboard', 'MultiProjectDashboard', 'Revenue', 'Expense'],
		}),

		bulkDeleteProjects: builder.mutation<void, { ids: number[] }>({
			query: ({ ids }) => ({
				url: `${process.env.NEXT_PUBLIC_PROJECT_LIST}bulk_delete/`,
				method: 'DELETE',
				data: { ids },
			}),
			invalidatesTags: ['Project', 'ProjectDashboard', 'MultiProjectDashboard', 'Revenue', 'Expense'],
		}),

		// ── Revenues ────────────────────────────────────────────────────────
		getRevenues: builder.query<
			RevenueType[],
			{ project?: number; search?: string; date_after?: string; date_before?: string; [key: string]: string | number | undefined }
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

		createRevenue: builder.mutation<RevenueType | ApiErrorResponseType, { data: Omit<RevenueFormValues, 'globalError'> }>({
			query: ({ data }) => ({
				url: process.env.NEXT_PUBLIC_REVENUE_LIST,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['Revenue', 'Project', 'ProjectDashboard', 'MultiProjectDashboard'],
		}),

		updateRevenue: builder.mutation<RevenueType | ApiErrorResponseType, { id: number; data: Omit<RevenueFormValues, 'globalError'> }>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_REVENUE_LIST}${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['Revenue', 'Project', 'ProjectDashboard', 'MultiProjectDashboard'],
		}),

		deleteRevenue: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_REVENUE_LIST}${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Revenue', 'Project', 'ProjectDashboard', 'MultiProjectDashboard'],
		}),

		bulkDeleteRevenues: builder.mutation<void, { ids: number[] }>({
			query: ({ ids }) => ({
				url: `${process.env.NEXT_PUBLIC_REVENUE_LIST}bulk_delete/`,
				method: 'DELETE',
				data: { ids },
			}),
			invalidatesTags: ['Revenue', 'Project', 'ProjectDashboard', 'MultiProjectDashboard'],
		}),

		// ── Expenses ────────────────────────────────────────────────────────
		getExpenses: builder.query<
			ExpenseType[],
			{
				project?: number;
				category?: number;
				sous_categorie?: number;
				search?: string;
				fournisseur?: string;
				date_after?: string;
				date_before?: string;
				[key: string]: string | number | undefined;
			}
		>({
			query: ({ project, category, sous_categorie, search, fournisseur, ...rest }) => ({
				url: process.env.NEXT_PUBLIC_EXPENSE_LIST,
				method: 'GET',
				params: { project, category, sous_categorie, search, fournisseur, ...rest },
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

		createExpense: builder.mutation<ExpenseType | ApiErrorResponseType, { data: Omit<ExpenseFormValues, 'globalError'> }>({
			query: ({ data }) => ({
				url: process.env.NEXT_PUBLIC_EXPENSE_LIST,
				method: 'POST',
				data,
			}),
			invalidatesTags: ['Expense', 'Project', 'ProjectDashboard', 'MultiProjectDashboard'],
		}),

		updateExpense: builder.mutation<ExpenseType | ApiErrorResponseType, { id: number; data: Omit<ExpenseFormValues, 'globalError'> }>({
			query: ({ id, data }) => ({
				url: `${process.env.NEXT_PUBLIC_EXPENSE_LIST}${id}/`,
				method: 'PUT',
				data,
			}),
			invalidatesTags: ['Expense', 'Project', 'ProjectDashboard', 'MultiProjectDashboard'],
		}),

		deleteExpense: builder.mutation<void, { id: number }>({
			query: ({ id }) => ({
				url: `${process.env.NEXT_PUBLIC_EXPENSE_LIST}${id}/`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Expense', 'Project', 'ProjectDashboard', 'MultiProjectDashboard'],
		}),

		bulkDeleteExpenses: builder.mutation<void, { ids: number[] }>({
			query: ({ ids }) => ({
				url: `${process.env.NEXT_PUBLIC_EXPENSE_LIST}bulk_delete/`,
				method: 'DELETE',
				data: { ids },
			}),
			invalidatesTags: ['Expense', 'Project', 'ProjectDashboard', 'MultiProjectDashboard'],
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
	}),
});

export const {
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
	// Revenues
	useGetRevenuesQuery,
	useGetRevenueQuery,
	useCreateRevenueMutation,
	useUpdateRevenueMutation,
	useDeleteRevenueMutation,
	useBulkDeleteRevenuesMutation,
	// Expenses
	useGetExpensesQuery,
	useGetExpenseQuery,
	useCreateExpenseMutation,
	useUpdateExpenseMutation,
	useDeleteExpenseMutation,
	useBulkDeleteExpensesMutation,
	// Dashboard
	useGetProjectDashboardQuery,
	useGetMultiProjectDashboardQuery,
} = projectApi;
