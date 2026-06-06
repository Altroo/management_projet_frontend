import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN, SUPPLIERS_LIST } from '@/utils/routes';
import SupplierViewClient from '@/components/pages/suppliers/supplier-view';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.supplierDetailsTitle, description: t.metadata.supplierDetailsDescription };
}

interface Props {
	params: Promise<{ id: string }>;
}

const SupplierDetailPage = async ({ params }: Props) => {
	const session = await auth();
	const { id } = await params;
	if (!session) redirect(AUTH_LOGIN);
	if (!id || isNaN(Number(id))) redirect(SUPPLIERS_LIST);
	return <SupplierViewClient session={session} id={Number(id)} />;
};

export default SupplierDetailPage;
