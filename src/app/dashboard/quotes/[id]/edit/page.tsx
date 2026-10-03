import type { NumericIdPageProps } from '@/types/routeTypes';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, QUOTES_LIST } from '@/utils/routes';
import QuoteFormClient from '@/components/pages/quotes/quote-form';
import type { Metadata } from 'next';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.quotes.editQuote };
}

const QuoteEditPage = async ({ params }: NumericIdPageProps) => {
	const session = await auth();
	const { id } = await params;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id))) {
		redirect(QUOTES_LIST);
	}

	return <QuoteFormClient session={session} id={Number(id)} />;
};

export default QuoteEditPage;
