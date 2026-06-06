import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import SuppliersListClient from '@/components/pages/suppliers/suppliers-list';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.suppliersListTitle, description: t.metadata.suppliersListDescription };
}

const SuppliersListPage = async () => {
	const session = await auth();
	if (!session) redirect(AUTH_LOGIN);
	return <SuppliersListClient session={session} />;
};

export default SuppliersListPage;
