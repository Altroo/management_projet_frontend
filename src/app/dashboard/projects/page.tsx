import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import ProjectsListClient from '@/components/pages/projects/projects-list';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.projectsListTitle, description: t.metadata.projectsListDescription };
}

const ProjectsListPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <ProjectsListClient session={session} />;
};

export default ProjectsListPage;
