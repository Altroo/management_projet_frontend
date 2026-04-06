export type ProjectStatusType = 'Complété' | 'En cours' | 'Pas commencé' | 'En attente';

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

export interface ProjectListType {
	id: number;
	nom: string;
	budget_total: string;
	date_debut: string;
	date_fin: string;
	status: ProjectStatusType | string;
	chef_de_projet: string;
	nom_client: string;
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
	notes: string | null;
}

export interface ProjectFormValues {
	nom: string;
	description: string;
	budget_total: string;
	date_debut: string;
	date_fin: string;
	status: string;
	chef_de_projet: string;
	nom_client: string;
	telephone_client: string;
	email_client: string;
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
	fournisseur: string;
	notes: string;
	globalError: string;
}

// Dashboard types
export interface ProjectDashboardType {
	project_id: number;
	nom: string;
	budget_total: string;
	revenue_total: string;
	depenses_totales: string;
	benefice: string;
	marge: number;
	budget_utilisation: number;
	top_categories: Array<{ category__name: string | null; total: string }>;
	top_subcategories: Array<{ sous_categorie__name: string | null; total: string }>;
	top_vendors: Array<{ fournisseur: string; total: string }>;
	expense_history: Array<{ date: string; total: string }>;
	revenue_history: Array<{ date: string; total: string }>;
}

export interface ProjectSummaryType {
	id: number;
	nom: string;
	budget_total: string;
	revenue: string;
	expenses: string;
	profit: string;
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
	projects: ProjectSummaryType[];
}
