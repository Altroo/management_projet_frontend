import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, EXPENSES_LIST } from '@/utils/routes';
import ExpenseViewClient from '@/components/pages/expenses/expense-view';
import type { Metadata } from 'next';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.expenseDetailsTitle, description: t.metadata.expenseDetailsDescription };
}

interface Props {
	params: Promise<{ id: string }>;
}

const ExpenseDetailPage = async ({ params }: Props) => {
	const session = await auth();
	const { id } = await params;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id))) {
		redirect(EXPENSES_LIST);
	}

	return <ExpenseViewClient session={session} id={Number(id)} />;
};

export default ExpenseDetailPage;
