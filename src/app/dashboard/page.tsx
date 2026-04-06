import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import ProjectDashboardClient from '@/components/pages/dashboard/project-dashboard';

const DashboardPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <ProjectDashboardClient session={session} />;
};

export default DashboardPage;
