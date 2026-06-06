import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN, CLIENTS_LIST } from '@/utils/routes';
import ClientFormClient from '@/components/pages/clients/client-form';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.editClientTitle, description: t.metadata.editClientDescription };
}

interface Props {
	params: Promise<{ id: string }>;
}

const ClientEditPage = async ({ params }: Props) => {
	const session = await auth();
	const { id } = await params;
	if (!session) redirect(AUTH_LOGIN);
	if (!id || isNaN(Number(id))) redirect(CLIENTS_LIST);
	return <ClientFormClient session={session} id={Number(id)} />;
};

export default ClientEditPage;
