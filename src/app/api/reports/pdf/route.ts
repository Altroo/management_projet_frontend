import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { financialReportFilename } from '@/utils/fileDownload';
import { REPORTS_PDF, type PdfLanguage } from '@/utils/routes';

const pdfLanguage = (value: string | null): PdfLanguage | null =>
	value === 'fr' || value === 'en' ? value : null;

export async function GET(request: NextRequest) {
	const session = await auth();
	if (!session?.accessToken) {
		return NextResponse.json({ detail: 'Authentication required.' }, { status: 401 });
	}

	const language = pdfLanguage(request.nextUrl.searchParams.get('language'));
	if (!language) {
		return NextResponse.json({ detail: 'Invalid PDF language.' }, { status: 400 });
	}

	const dateFrom = request.nextUrl.searchParams.get('date_from') || undefined;
	const dateTo = request.nextUrl.searchParams.get('date_to') || undefined;
	const rawProjectId = request.nextUrl.searchParams.get('project_id');
	const projectId = rawProjectId ? Number(rawProjectId) : undefined;
	if (projectId !== undefined && (!Number.isInteger(projectId) || projectId <= 0)) {
		return NextResponse.json({ detail: 'Invalid project.' }, { status: 400 });
	}

	try {
		const upstream = await fetch(REPORTS_PDF(language, { dateFrom, dateTo, projectId }), {
			headers: { Authorization: `Bearer ${session.accessToken}` },
			cache: 'no-store',
		});
		if (!upstream.ok) {
			return new NextResponse(upstream.body, {
				status: upstream.status,
				headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json' },
			});
		}

		const filename = financialReportFilename({
			projectName: request.nextUrl.searchParams.get('project_name') || undefined,
			dateFrom,
			dateTo,
			language,
		});
		const headers = new Headers({
			'Cache-Control': 'no-store, no-cache, must-revalidate',
			'Content-Disposition': `attachment; filename="${filename}"`,
			'Content-Type': 'application/pdf',
			Pragma: 'no-cache',
		});
		const contentLength = upstream.headers.get('content-length');
		if (contentLength) headers.set('Content-Length', contentLength);

		return new NextResponse(upstream.body, { status: 200, headers });
	} catch {
		return NextResponse.json({ detail: 'Unable to generate the PDF.' }, { status: 502 });
	}
}
