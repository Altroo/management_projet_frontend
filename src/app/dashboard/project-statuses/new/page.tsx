import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import ProjectStatusFormClient from '@/components/pages/project-statuses/project-status-form';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.newProjectStatusTitle, description: t.metadata.newProjectStatusDescription };
}

const ProjectStatusAddPage = async () => {
	const session = await auth();
	if (!session) redirect(AUTH_LOGIN);
	return <ProjectStatusFormClient session={session} />;
};

export default ProjectStatusAddPage;
