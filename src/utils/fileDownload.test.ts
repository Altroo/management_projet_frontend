import { downloadFileBlob, downloadFileUrl, financialReportFilename } from './fileDownload';

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

describe('downloadFileBlob', () => {
	const createObjectURL = jest.fn(() => 'blob:report');
	const revokeObjectURL = jest.fn();

	beforeEach(() => {
		jest.restoreAllMocks();
		Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
		Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
	});

	it('waits for the response and downloads the returned blob filename', async () => {
		const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
		const onResponseReady = jest.fn();
		global.fetch = jest.fn().mockResolvedValue({
			ok: true,
			blob: async () => new Blob(['pdf'], { type: 'application/pdf' }),
			headers: new Headers({
				'content-type': 'application/pdf',
				'content-disposition': 'attachment; filename="report-en.pdf"',
			}),
		});

		await downloadFileBlob('/api/reports/pdf?language=en', { onResponseReady });

		expect(onResponseReady).toHaveBeenCalledTimes(1);
		expect(click).toHaveBeenCalledTimes(1);
		expect(createObjectURL).toHaveBeenCalledTimes(1);
		expect(revokeObjectURL).toHaveBeenCalledWith('blob:report');
	});

	it('exposes a backend JSON error instead of downloading a partial file', async () => {
		global.fetch = jest.fn().mockResolvedValue({
			ok: false,
			json: async () => ({ message: 'Model unavailable' }),
			headers: new Headers({ 'content-type': 'application/json' }),
		});

		await expect(downloadFileBlob('/api/reports/pdf?language=en')).rejects.toMatchObject({
			message: 'Unable to download file.',
			data: { message: 'Model unavailable' },
		});
	});
});

describe('translation preparation', () => {
	afterEach(() => jest.useRealTimers());
	const pending = (code: string) => ({
		ok: false,
		status: 409,
		headers: new Headers({ 'content-type': 'application/json' }),
		clone: () => ({ json: async () => ({ details: { code } }) }),
	});
	it('waits for a pending translation then downloads without an error', async () => {
		jest.useFakeTimers();
		jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation();
		global.fetch = jest
			.fn()
			.mockResolvedValueOnce(pending('pdf_translation_pending'))
			.mockResolvedValueOnce({ ok: true, status: 200, blob: async () => new Blob(['pdf']), headers: new Headers() });
		const onResponseReady = jest.fn();
		const task = downloadFileBlob('/api/reports/pdf?language=en', { onResponseReady });
		await jest.advanceTimersByTimeAsync(2000);
		await task;
		expect(fetch).toHaveBeenCalledTimes(2);
		expect(onResponseReady).toHaveBeenCalledTimes(1);
	});
	it('stops polling a quota wait without downloading a partial file', async () => {
		global.fetch = jest.fn().mockResolvedValue(pending('pdf_translation_deferred'));
		await expect(downloadFileBlob('/api/reports/pdf?language=en')).rejects.toMatchObject({
			name: 'PdfTranslationDeferredError',
		});
		expect(fetch).toHaveBeenCalledTimes(1);
	});
	it('bounds how long newly queued text can keep the spinner active', async () => {
		jest.useFakeTimers();
		global.fetch = jest.fn().mockResolvedValue(pending('pdf_translation_pending'));
		const result = downloadFileBlob('/api/reports/pdf?language=en').catch((error: Error) => error.name);
		await jest.advanceTimersByTimeAsync(182000);
		expect(await result).toBe('PdfTranslationDeferredError');
		expect(fetch).toHaveBeenCalledTimes(91);
	});
});
