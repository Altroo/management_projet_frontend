// Site root
export const SITE_ROOT = `${process.env.NEXT_PUBLIC_DOMAIN_URL_PREFIX}/`;
export const BACKEND_SITE_ADMIN = `${process.env.NEXT_PUBLIC_API_URL}/gestion-interne-kp56`;
// Auth
export const AUTH_LOGIN = `${SITE_ROOT}/login`;
// Auth forgot password
export const AUTH_RESET_PASSWORD = `${SITE_ROOT}/reset-password`;
export const AUTH_RESET_PASSWORD_ENTER_CODE = `${SITE_ROOT}/reset-password/enter-code`;
export const AUTH_RESET_PASSWORD_SET_PASSWORD = `${SITE_ROOT}/reset-password/set-password`;
export const AUTH_RESET_PASSWORD_COMPLETE = `${SITE_ROOT}/reset-password/set-password-complete`;
// Dashboard
export const DASHBOARD = `${SITE_ROOT}dashboard`;
// Settings
export const DASHBOARD_EDIT_PROFILE = `${SITE_ROOT}dashboard/settings/edit-profile`;
export const DASHBOARD_PASSWORD = `${SITE_ROOT}dashboard/settings/password`;
// Users (staff only)
export const USERS_LIST = `${SITE_ROOT}dashboard/users`;
export const USERS_ADD = `${SITE_ROOT}dashboard/users/new`;
export const USERS_VIEW = (id: number) => `${SITE_ROOT}dashboard/users/${id}`;
export const USERS_EDIT = (id: number) => `${SITE_ROOT}dashboard/users/${id}/edit`;
// Projects
export const PROJECTS_LIST = `${SITE_ROOT}dashboard/projects`;
export const PROJECTS_ADD = `${SITE_ROOT}dashboard/projects/new`;
export const PROJECTS_VIEW = (id: number) => `${SITE_ROOT}dashboard/projects/${id}`;
export const PROJECTS_EDIT = (id: number) => `${SITE_ROOT}dashboard/projects/${id}/edit`;
// Categories
export const CATEGORIES_LIST = `${SITE_ROOT}dashboard/categories`;
export const CATEGORIES_ADD = `${SITE_ROOT}dashboard/categories/new`;
export const CATEGORIES_EDIT = (id: number) => `${SITE_ROOT}dashboard/categories/${id}/edit`;
// Revenues
export const REVENUES_LIST = `${SITE_ROOT}dashboard/revenues`;
export const REVENUES_ADD = `${SITE_ROOT}dashboard/revenues/new`;
export const REVENUES_VIEW = (id: number) => `${SITE_ROOT}dashboard/revenues/${id}`;
export const REVENUES_EDIT = (id: number) => `${SITE_ROOT}dashboard/revenues/${id}/edit`;
// Expenses
export const EXPENSES_LIST = `${SITE_ROOT}dashboard/expenses`;
export const EXPENSES_ADD = `${SITE_ROOT}dashboard/expenses/new`;
export const EXPENSES_VIEW = (id: number) => `${SITE_ROOT}dashboard/expenses/${id}`;
export const EXPENSES_EDIT = (id: number) => `${SITE_ROOT}dashboard/expenses/${id}/edit`;
