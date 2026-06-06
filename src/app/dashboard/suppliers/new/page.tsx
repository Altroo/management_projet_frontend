import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import SupplierFormClient from '@/components/pages/suppliers/supplier-form';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.newSupplierTitle, description: t.metadata.newSupplierDescription };
}

const SupplierAddPage = async () => {
	const session = await auth();
	if (!session) redirect(AUTH_LOGIN);
	return <SupplierFormClient session={session} />;
};

export default SupplierAddPage;
