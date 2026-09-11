import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/auth';
import ReportsClient from '@/components/pages/reports/reports';
import { AUTH_LOGIN } from '@/utils/routes';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.reports.title, description: t.reports.description };
}

const ReportsPage = async () => {
	const session = await auth();
	if (!session) redirect(AUTH_LOGIN);
	return <ReportsClient session={session} />;
};

export default ReportsPage;
