import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import ExpenseFormClient from '@/components/pages/expenses/expense-form';
import type { Metadata } from 'next';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.newExpenseTitle, description: t.metadata.newExpenseDescription };
}

const ExpenseAddPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <ExpenseFormClient session={session} />;
};

export default ExpenseAddPage;
