import { downloadBlobFile, financialReportFilename } from './fileDownload';

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

describe('downloadBlobFile', () => {
	it('downloads the blob with the requested filename', () => {
		const blob = new Blob(['pdf'], { type: 'application/pdf' });
		const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation();
		const appendChild = jest.spyOn(document.body, 'appendChild');
		Object.defineProperty(window.URL, 'createObjectURL', {
			configurable: true,
			value: jest.fn(() => 'blob:report'),
		});
		Object.defineProperty(window.URL, 'revokeObjectURL', {
			configurable: true,
			value: jest.fn(),
		});

		downloadBlobFile(blob, 'rapport-financier-projet-alpha-fr.pdf');

		const link = appendChild.mock.calls[0][0] as HTMLAnchorElement;
		expect(link.href).toBe('blob:report');
		expect(link.download).toBe('rapport-financier-projet-alpha-fr.pdf');
		expect(click).toHaveBeenCalledTimes(1);
		expect(link.isConnected).toBe(false);
	});
});
