import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN, SUPPLIERS_LIST } from '@/utils/routes';
import SupplierFormClient from '@/components/pages/suppliers/supplier-form';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.editSupplierTitle, description: t.metadata.editSupplierDescription };
}

interface Props {
	params: Promise<{ id: string }>;
}

const SupplierEditPage = async ({ params }: Props) => {
	const session = await auth();
	const { id } = await params;
	if (!session) redirect(AUTH_LOGIN);
	if (!id || isNaN(Number(id))) redirect(SUPPLIERS_LIST);
	return <SupplierFormClient session={session} id={Number(id)} />;
};

export default SupplierEditPage;
