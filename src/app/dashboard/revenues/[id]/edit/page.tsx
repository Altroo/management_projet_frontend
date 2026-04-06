import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, REVENUES_LIST } from '@/utils/routes';
import RevenueFormClient from '@/components/pages/revenues/revenue-form';
import type { Metadata } from 'next';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.editRevenueTitle, description: t.metadata.editRevenueDescription };
}

interface Props {
	params: Promise<{ id: string }>;
}

const RevenueEditPage = async ({ params }: Props) => {
	const session = await auth();
	const { id } = await params;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id))) {
		redirect(REVENUES_LIST);
	}

	return <RevenueFormClient session={session} id={Number(id)} />;
};

export default RevenueEditPage;
