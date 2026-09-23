import type { AccountGenderCodeValueType, PasswordResetCodeField } from '@/types/accountTypes';

export const fields: PasswordResetCodeField[] = ['one', 'two', 'three', 'four', 'five', 'six'];
import type { TranslationDictionary } from '@/types/languageTypes';
import type { ProjectStatusType } from '@/types/projectTypes';

export const genderItemsList = (t: TranslationDictionary): Array<AccountGenderCodeValueType> => [
	{ code: 'H', value: t.rawData.genders.male },
	{ code: 'F', value: t.rawData.genders.female },
];

export const projectStatusItemsList = (t: TranslationDictionary): Array<{ code: ProjectStatusType; value: string }> => [
	{ code: 'Complété', value: t.rawData.projectStatuses.completed },
	{ code: 'En cours', value: t.rawData.projectStatuses.inProgress },
	{ code: 'Pas commencé', value: t.rawData.projectStatuses.notStarted },
	{ code: 'En attente', value: t.rawData.projectStatuses.onHold },
	{ code: 'En pause', value: t.rawData.projectStatuses.paused },
	{ code: 'Annulé', value: t.rawData.projectStatuses.cancelled },
	{ code: 'En attente de démarrage', value: t.rawData.projectStatuses.waitingStart },
	{ code: 'Livré', value: t.rawData.projectStatuses.delivered },
];

export type StatusChipColor = 'success' | 'warning' | 'default' | 'info' | 'error';

export const STATUS_CHIP_COLORS: Record<string, StatusChipColor> = {
	Complété: 'success',
	'En cours': 'info',
	'Pas commencé': 'default',
	'En attente': 'warning',
	'En pause': 'warning',
	Annulé: 'error',
	'En attente de démarrage': 'info',
	Livré: 'success',
};

export const CHART_COLORS = {
	primary: 'rgba(25, 118, 210, 0.8)',
	primaryLight: 'rgba(25, 118, 210, 0.15)',
	secondary: 'rgba(46, 125, 50, 0.8)',
	secondaryLight: 'rgba(46, 125, 50, 0.15)',
	warning: 'rgba(237, 108, 2, 0.8)',
	warningLight: 'rgba(237, 108, 2, 0.15)',
	error: 'rgba(211, 47, 47, 0.8)',
	errorLight: 'rgba(211, 47, 47, 0.15)',
	info: 'rgba(2, 136, 209, 0.8)',
	infoLight: 'rgba(2, 136, 209, 0.15)',
	purple: 'rgba(156, 39, 176, 0.8)',
	purpleLight: 'rgba(156, 39, 176, 0.15)',
};

export const PROJECT_COLORS = [
	'rgba(25, 118, 210, 0.8)',
	'rgba(46, 125, 50, 0.8)',
	'rgba(237, 108, 2, 0.8)',
	'rgba(156, 39, 176, 0.8)',
	'rgba(2, 136, 209, 0.8)',
	'rgba(255, 193, 7, 0.8)',
	'rgba(211, 47, 47, 0.8)',
	'rgba(0, 150, 136, 0.8)',
];

export const CHART_OPTS = { responsive: true, maintainAspectRatio: false } as const;

export const doughnutPalette = ['#1d4ed8', '#047857', '#b91c1c', '#c2410c', '#6d28d9', '#0f766e', '#be123c', '#4d7c0f'];

export const ALL_PROJECTS_CODE = '__all_projects__';

export const doughnutOptions = {
	...CHART_OPTS,
	cutout: '62%',
	plugins: {
		legend: {
			position: 'bottom' as const,
			labels: { boxWidth: 10, padding: 12 },
		},
	},
};

export const horizontalBarOptions = {
	...CHART_OPTS,
	indexAxis: 'y' as const,
	plugins: { legend: { display: false } },
	scales: {
		x: { beginAtZero: true },
		y: { grid: { display: false } },
	},
};

export const areaChartOptions = {
	...CHART_OPTS,
	interaction: { mode: 'index' as const, intersect: false },
	plugins: { legend: { position: 'top' as const } },
	scales: {
		x: { grid: { color: 'rgba(0, 0, 0, 0.04)' } },
		y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.06)' } },
	},
};

export const groupedBarOptions = {
	...CHART_OPTS,
	plugins: { legend: { position: 'top' as const } },
	scales: {
		x: { grid: { display: false } },
		y: {
			beginAtZero: true,
			position: 'left' as const,
			grid: { color: 'rgba(0, 0, 0, 0.06)' },
		},
		yMargin: {
			beginAtZero: true,
			position: 'right' as const,
			grid: { drawOnChartArea: false },
			ticks: { callback: (value: string | number) => `${value}%` },
		},
	},
};

export const ITEM_HEIGHT = 48;

export const ITEM_PADDING_TOP = 8;

export const MenuProps = {
	slotProps: {
		paper: {
			style: {
				maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
				width: 250,
			},
		},
	},
};

export const fileInputSx = {
	clip: 'rect(0 0 0 0)',
	clipPath: 'inset(50%)',
	height: 1,
	overflow: 'hidden',
	position: 'absolute',
	bottom: 0,
	left: 0,
	whiteSpace: 'nowrap',
	width: 1,
} as const;
