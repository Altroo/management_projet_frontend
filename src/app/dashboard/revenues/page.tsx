import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import RevenuesListClient from '@/components/pages/revenues/revenues-list';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.revenuesListTitle, description: t.metadata.revenuesListDescription };
}

const RevenuesListPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <RevenuesListClient session={session} />;
};

export default RevenuesListPage;
