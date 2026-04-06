import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import ExpensesListClient from '@/components/pages/expenses/expenses-list';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.expensesListTitle, description: t.metadata.expensesListDescription };
}

const ExpensesListPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <ExpensesListClient session={session} />;
};

export default ExpensesListPage;
