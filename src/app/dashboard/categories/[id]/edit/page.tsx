import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, CATEGORIES_LIST } from '@/utils/routes';
import CategoryFormClient from '@/components/pages/categories/category-form';
import type { Metadata } from 'next';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.editCategoryTitle, description: t.metadata.editCategoryDescription };
}

interface Props {
	params: Promise<{ id: string }>;
}

const CategoryEditPage = async ({ params }: Props) => {
	const session = await auth();
	const { id } = await params;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id))) {
		redirect(CATEGORIES_LIST);
	}

	return <CategoryFormClient session={session} id={Number(id)} />;
};

export default CategoryEditPage;
