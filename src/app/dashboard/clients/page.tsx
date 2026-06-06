import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import ClientsListClient from '@/components/pages/clients/clients-list';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.clientsListTitle, description: t.metadata.clientsListDescription };
}

const ClientsListPage = async () => {
	const session = await auth();
	if (!session) redirect(AUTH_LOGIN);
	return <ClientsListClient session={session} />;
};

export default ClientsListPage;
