import { downloadFileUrl, financialReportFilename } from './fileDownload';

describe('financialReportFilename', () => {
	it('names an all-project report with its period and language', () => {
		expect(
			financialReportFilename({
				dateFrom: '2026-01-01',
				dateTo: '2026-12-31',
				language: 'fr',
			}),
		).toBe('rapport-financier-tous-les-projets-du-2026-01-01-au-2026-12-31-fr.pdf');
	});

	it('uses a safe, meaningful project name', () => {
		expect(
			financialReportFilename({
				projectName: 'Rénovation & Décoration – Cœur de ville',
				language: 'en',
			}),
		).toBe('rapport-financier-renovation-decoration-coeur-de-ville-en.pdf');
	});
});

describe('downloadFileUrl', () => {
	it('starts a normal HTTP download without creating a blob URL', () => {
		const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation();
		const appendChild = jest.spyOn(document.body, 'appendChild');

		downloadFileUrl('/api/reports/pdf?language=fr&project_id=7');

		const link = appendChild.mock.calls[0][0] as HTMLAnchorElement;
		expect(link.getAttribute('href')).toBe('/api/reports/pdf?language=fr&project_id=7');
		expect(link.download).toBe('');
		expect(click).toHaveBeenCalledTimes(1);
		expect(link.isConnected).toBe(false);
	});
});
