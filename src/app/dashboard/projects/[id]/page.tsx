import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN, PROJECTS_LIST } from '@/utils/routes';
import ProjectViewClient from '@/components/pages/projects/project-view';
import type { Metadata } from 'next';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.projectDetailsTitle, description: t.metadata.projectDetailsDescription };
}

interface Props {
	params: Promise<{ id: string }>;
}

const ProjectDetailPage = async ({ params }: Props) => {
	const session = await auth();
	const { id } = await params;

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	if (!id || isNaN(Number(id))) {
		redirect(PROJECTS_LIST);
	}

	return <ProjectViewClient session={session} id={Number(id)} />;
};

export default ProjectDetailPage;
