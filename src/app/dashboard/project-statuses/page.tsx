import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import ProjectStatusesListClient from '@/components/pages/project-statuses/project-statuses-list';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.projectStatusesListTitle, description: t.metadata.projectStatusesListDescription };
}

const ProjectStatusesListPage = async () => {
	const session = await auth();
	if (!session) redirect(AUTH_LOGIN);
	return <ProjectStatusesListClient session={session} />;
};

export default ProjectStatusesListPage;
