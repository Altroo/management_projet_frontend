import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import ClientFormClient from '@/components/pages/clients/client-form';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.newClientTitle, description: t.metadata.newClientDescription };
}

const ClientAddPage = async () => {
	const session = await auth();
	if (!session) redirect(AUTH_LOGIN);
	return <ClientFormClient session={session} />;
};

export default ClientAddPage;
