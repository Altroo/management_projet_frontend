import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import CategoryFormClient from '@/components/pages/categories/category-form';
import type { Metadata } from 'next';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.newCategoryTitle, description: t.metadata.newCategoryDescription };
}

const CategoryAddPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <CategoryFormClient session={session} />;
};

export default CategoryAddPage;
