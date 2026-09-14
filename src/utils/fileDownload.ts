import type { PdfLanguage } from '@/utils/routes';

interface FinancialReportFilenameOptions {
	projectName?: string;
	dateFrom?: string;
	dateTo?: string;
	language: PdfLanguage;
}

const filenameSlug = (value: string): string =>
	value
		.toLocaleLowerCase('fr-FR')
		.replaceAll('œ', 'oe')
		.replaceAll('æ', 'ae')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

export const financialReportFilename = ({
	projectName,
	dateFrom,
	dateTo,
	language,
}: FinancialReportFilenameOptions): string => {
	const scope = projectName ? filenameSlug(projectName) || 'projet' : 'tous-les-projets';
	const period = dateFrom && dateTo ? `-du-${dateFrom}-au-${dateTo}` : '';

	return `rapport-financier-${scope}${period}-${language}.pdf`;
};

export const downloadFileUrl = (url: string): void => {
	const link = document.createElement('a');
	link.href = url;
	link.download = '';
	link.rel = 'noopener';
	link.style.display = 'none';
	document.body.appendChild(link);
	link.click();
	link.remove();
};
