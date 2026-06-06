import { redirect } from 'next/navigation';
import { type Metadata } from 'next';
import { auth } from '@/auth';
import { AUTH_LOGIN, PROJECT_STATUSES_LIST } from '@/utils/routes';
import ProjectStatusFormClient from '@/components/pages/project-statuses/project-status-form';
import { getServerTranslations } from '@/utils/serverTranslations';

export async function generateMetadata(): Promise<Metadata> {
	const t = await getServerTranslations();
	return { title: t.metadata.editProjectStatusTitle, description: t.metadata.editProjectStatusDescription };
}

interface Props {
	params: Promise<{ id: string }>;
}

const ProjectStatusEditPage = async ({ params }: Props) => {
	const session = await auth();
	const { id } = await params;
	if (!session) redirect(AUTH_LOGIN);
	if (!id || isNaN(Number(id))) redirect(PROJECT_STATUSES_LIST);
	return <ProjectStatusFormClient session={session} id={Number(id)} />;
};

export default ProjectStatusEditPage;
