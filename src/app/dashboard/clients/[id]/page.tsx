import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN, CLIENTS_LIST } from '@/utils/routes';
import ClientViewClient from '@/components/pages/clients/client-view';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.clientDetailsTitle, description: t.metadata.clientDetailsDescription };
}

interface Props {
	params: Promise<{ id: string }>;
}

const ClientDetailPage = async ({ params }: Props) => {
	const session = await auth();
	const { id } = await params;
	if (!session) redirect(AUTH_LOGIN);
	if (!id || isNaN(Number(id))) redirect(CLIENTS_LIST);
	return <ClientViewClient session={session} id={Number(id)} />;
};

export default ClientDetailPage;
