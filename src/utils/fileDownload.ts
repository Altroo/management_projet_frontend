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

interface DownloadFileBlobOptions {
	onResponseReady?: () => void;
}

export const downloadFileBlob = async (url: string, options: DownloadFileBlobOptions = {}): Promise<void> => {
	const response = await fetch(url, { credentials: 'same-origin', cache: 'no-store' });
	if (!response.ok) {
		let data: unknown;
		if (response.headers.get('content-type')?.includes('application/json')) {
			data = await response.json();
		}
		const downloadError = new Error('Unable to download file.');
		Object.assign(downloadError, { data });
		throw downloadError;
	}

	options.onResponseReady?.();
	const blob = await response.blob();
	const objectUrl = URL.createObjectURL(blob);
	const disposition = response.headers.get('content-disposition') ?? '';
	const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] ?? 'download.pdf';
	const link = document.createElement('a');
	link.href = objectUrl;
	link.download = filename;
	link.rel = 'noopener';
	link.style.display = 'none';
	document.body.appendChild(link);
	try {
		link.click();
	} finally {
		link.remove();
		URL.revokeObjectURL(objectUrl);
	}
};
