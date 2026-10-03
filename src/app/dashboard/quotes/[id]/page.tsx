import type { NumericIdPageProps } from '@/types/routeTypes';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, QUOTES_LIST } from '@/utils/routes';
import QuoteViewClient from '@/components/pages/quotes/quote-view';
import type { Metadata } from 'next';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.quotes.quoteDetails };
}

const QuoteDetailPage = async ({ params }: NumericIdPageProps) => {
	const session = await auth();
	const { id } = await params;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id))) {
		redirect(QUOTES_LIST);
	}

	return <QuoteViewClient session={session} id={Number(id)} />;
};

export default QuoteDetailPage;
