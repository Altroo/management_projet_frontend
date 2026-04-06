import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import RevenueFormClient from '@/components/pages/revenues/revenue-form';
import type { Metadata } from 'next';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.newRevenueTitle, description: t.metadata.newRevenueDescription };
}

const RevenueAddPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <RevenueFormClient session={session} />;
};

export default RevenueAddPage;
