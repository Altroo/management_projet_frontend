import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import CategoriesListClient from '@/components/pages/categories/categories-list';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.categoriesListTitle, description: t.metadata.categoriesListDescription };
}

const CategoriesListPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <CategoriesListClient session={session} />;
};

export default CategoriesListPage;
