export type ProjectStatusType =
	| 'Complété'
	| 'En cours'
	| 'Pas commencé'
	| 'En attente'
	| 'En pause'
	| 'Annulé'
	| 'En attente de démarrage'
	| 'Livré';
export type ServiceFeeType = 'percentage' | 'fixed';

export interface CategoryType {
	id: number;
	name: string;
	created_by_user: number | null;
	created_by_user_name: string | null;
	date_created: string;
	date_updated: string;
}

export interface SubCategoryType {
	id: number;
	name: string;
	category: number;
	category_name: string;
	created_by_user: number | null;
	created_by_user_name: string | null;
	date_created: string;
	date_updated: string;
}

export interface ExpenseCategoryTreeType extends CategoryType {
	subcategories: SubCategoryType[];
}

export interface ProjectListType {
	id: number;
	nom: string;
	description?: string | null;
	budget_total: string;
	date_debut: string;
	date_fin: string;
	status: ProjectStatusType | string;
	status_display?: string;
	client: number | null;
	client_name: string | null;
	client_city?: string | null;
	chef_de_projet: string;
	nom_client: string;
	telephone_client?: string | null;
	email_client?: string | null;
	ville_client?: string | null;
	notes?: string | null;
	jours_restants: number;
	revenue_total: string;
	depenses_totales: string;
	benefice: string;
	marge: number;
	created_by_user: number | null;
	created_by_user_name: string | null;
	date_created: string;
	date_updated: string;
}

export interface ProjectType extends ProjectListType {
	description: string | null;
	telephone_client: string | null;
	email_client: string | null;
	ville_client: string | null;
	client_address: string | null;
	notes: string | null;
}

export interface ProjectFormValues {
	nom: string;
	description: string;
	budget_total: string;
	date_debut: string;
	date_fin: string;
	status: string;
	client: number | '';
	chef_de_projet: string;
	nom_client: string;
	telephone_client: string;
	email_client: string;
	ville_client: string;
	notes: string;
	globalError: string;
}

export interface CategoryFormValues {
	name: string;
	globalError: string;
}

export interface SubCategoryFormValues {
	name: string;
	category: number | '';
	globalError: string;
}

export interface RevenueType {
	id: number;
	project: number;
	project_name: string;
	date: string;
	description: string;
	montant: string;
	notes: string | null;
	created_by_user: number | null;
	created_by_user_name: string | null;
	date_created: string;
	date_updated: string;
}

export interface AttachmentType {
	id: number;
	project?: number;
	expense?: number;
	revenue?: number;
	file: string;
	file_url: string | null;
	filename: string;
	file_size: number | null;
	label: string | null;
	uploaded_by_user: number | null;
	uploaded_by_user_name: string | null;
	date_created: string;
}

export interface RevenueFormValues {
	project: number | '';
	date: string;
	description: string;
	montant: string;
	notes: string;
	globalError: string;
}

export interface ExpenseType {
	id: number;
	project: number;
	project_name: string;
	date: string;
	category: number | null;
	category_name: string | null;
	sous_categorie: number | null;
	sous_categorie_name: string | null;
	element: string | null;
	description: string;
	montant: string;
	frais_de_service: boolean;
	frais_de_service_valeur: string | null;
	frais_de_service_type: ServiceFeeType;
	frais_de_service_montant: string;
	supplier: number | null;
	supplier_name: string | null;
	fournisseur: string | null;
	notes: string | null;
	created_by_user: number | null;
	created_by_user_name: string | null;
	date_created: string;
	date_updated: string;
}

export interface ExpenseFormValues {
	project: number | '';
	date: string;
	category: number | '';
	sous_categorie: number | '';
	element: string;
	description: string;
	montant: string;
	frais_de_service: boolean;
	frais_de_service_valeur: string | null;
	frais_de_service_type: ServiceFeeType;
	supplier: number | '';
	fournisseur: string;
	notes: string;
	globalError: string;
}

export interface ClientProjectHistoryType {
	id: number;
	nom: string;
	status: string;
	budget_total: string;
	date_debut: string;
	date_fin: string;
	revenue_total: string;
	depenses_totales: string;
	benefice: string;
}

export interface ClientType {
	id: number;
	nom: string;
	telephone: string | null;
	email: string | null;
	ville: string | null;
	adresse: string | null;
	total_encaisse: string;
	projects_count: number;
	projects: ClientProjectHistoryType[];
	created_by_user: number | null;
	created_by_user_name: string | null;
	date_created: string;
	date_updated: string;
}

export interface ClientFormValues {
	nom: string;
	telephone: string;
	email: string;
	ville: string;
	adresse: string;
	globalError: string;
}

export interface SupplierPaymentHistoryType {
	id: number;
	project: number;
	project_name: string;
	date: string;
	description: string;
	montant: string;
}

export interface SupplierType {
	id: number;
	nom: string;
	contact: string | null;
	specialite: string | null;
	total_paid: string;
	payments_count: number;
	payments: SupplierPaymentHistoryType[];
	created_by_user: number | null;
	created_by_user_name: string | null;
	date_created: string;
	date_updated: string;
}

export interface SupplierFormValues {
	nom: string;
	contact: string;
	specialite: string;
	globalError: string;
}

export interface ProjectPaymentScheduleType {
	id: number;
	project: number;
	project_name: string;
	due_date: string;
	expected_amount: string;
	description: string;
	notes: string | null;
	actual_amount: string;
	expected_cumulative: string;
	actual_cumulative: string;
	variance: string;
	created_by_user: number | null;
	created_by_user_name: string | null;
	date_created: string;
	date_updated: string;
}

export interface ProjectRealBudgetEntryType {
	id: number;
	project: number;
	project_name: string;
	date: string;
	stage: string;
	description: string | null;
	montant_client: string;
	montant_fournisseur: string;
	benefice: string;
	marge: number;
	notes: string | null;
	created_by_user: number | null;
	created_by_user_name: string | null;
	date_created: string;
	date_updated: string;
}

export interface RealBudgetEntryFormValues {
	project: number | '';
	date: string;
	stage: string;
	description: string;
	montant_client: string;
	montant_fournisseur: string;
	notes: string;
	globalError: string;
}

export interface PaymentScheduleFormValues {
	project: number | '';
	due_date: string;
	expected_amount: string;
	description: string;
	notes: string;
	globalError: string;
}

// Dashboard types
export interface DashboardClientTotalType {
	client: string;
	total: string;
}

export interface DashboardCategoryTotalType {
	category__name: string | null;
	total: string;
}

export interface DashboardSubCategoryTotalType {
	sous_categorie__name: string | null;
	total: string;
}

export interface DashboardVendorTotalType {
	fournisseur: string;
	total: string;
}

export interface DashboardHistoryPointType {
	date: string;
	total: string;
}

export interface RealBudgetStageSummaryType {
	stage: string;
	total_revenue: string;
	total_cost: string;
	profit: string;
	margin: number;
}

export interface ProjectDashboardType {
	project_id: number;
	nom: string;
	budget_total: string;
	revenue_total: string;
	depenses_totales: string;
	benefice: string;
	marge: number;
	budget_utilisation: number;
	service_fees?: string;
	revenue_reelle?: string;
	budget_initial?: string;
	real_budget_total_revenue?: string;
	real_budget_total_cost?: string;
	real_budget_profit?: string;
	real_budget_margin?: number;
	budget_gap?: string;
	budget_gap_percent?: number;
	real_budget_by_stage?: RealBudgetStageSummaryType[];
	top_categories: DashboardCategoryTotalType[];
	top_subcategories: DashboardSubCategoryTotalType[];
	top_vendors: DashboardVendorTotalType[];
	expense_history: DashboardHistoryPointType[];
	revenue_history: DashboardHistoryPointType[];
}

export interface ProjectSummaryType {
	id: number;
	nom: string;
	budget_total: string;
	revenue: string;
	expenses: string;
	profit: string;
	budget_initial?: string;
	real_budget_total_revenue?: string;
	real_budget_total_cost?: string;
	real_budget_profit?: string;
	real_budget_margin?: number;
	budget_gap?: string;
	budget_gap_percent?: number;
	real_budget_by_stage?: RealBudgetStageSummaryType[];
	status: ProjectStatusType | string;
}

export interface MultiProjectDashboardType {
	total_projects: number;
	total_budget: string;
	total_revenue: string;
	total_expenses: string;
	total_profit: string;
	total_margin: number;
	budget_utilisation: number;
	total_service_fees?: string;
	total_revenue_reelle?: string;
	budget_initial?: string;
	real_budget_total_revenue?: string;
	real_budget_total_cost?: string;
	real_budget_profit?: string;
	real_budget_margin?: number;
	budget_gap?: string;
	budget_gap_percent?: number;
	real_budget_by_stage?: RealBudgetStageSummaryType[];
	top_expense_clients: DashboardClientTotalType[];
	top_revenue_clients: DashboardClientTotalType[];
	top_categories: DashboardCategoryTotalType[];
	top_subcategories: DashboardSubCategoryTotalType[];
	top_vendors: DashboardVendorTotalType[];
	expense_history: DashboardHistoryPointType[];
	revenue_history: DashboardHistoryPointType[];
	projects: ProjectSummaryType[];
}

export type ClientDashboardType = MultiProjectDashboardType;
