import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/auth';
import CompanyProfileClient from '@/components/pages/settings/company-profile';
import { AUTH_LOGIN } from '@/utils/routes';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.companyProfile.title, description: t.companyProfile.description };
}

const CompanyProfilePage = async () => {
	const session = await auth();
	if (!session) redirect(AUTH_LOGIN);
	return <CompanyProfileClient session={session} />;
};

export default CompanyProfilePage;
