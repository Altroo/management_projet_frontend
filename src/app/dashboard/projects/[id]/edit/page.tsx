import type { NumericIdPageProps } from '@/types/routeTypes';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, PROJECTS_LIST } from '@/utils/routes';
import ProjectFormClient from '@/components/pages/projects/project-form';
import type { Metadata } from 'next';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.editProjectTitle, description: t.metadata.editProjectDescription };
}

const ProjectEditPage = async ({ params }: NumericIdPageProps) => {
	const session = await auth();
	const { id } = await params;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id))) {
		redirect(PROJECTS_LIST);
	}

	return <ProjectFormClient session={session} id={Number(id)} />;
};

export default ProjectEditPage;
