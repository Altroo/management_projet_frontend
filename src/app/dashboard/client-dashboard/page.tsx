import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AUTH_LOGIN } from '@/utils/routes';
import ClientDashboardClient from '@/components/pages/dashboard/client-dashboard';

const ClientDashboardPage = async () => {
	const session = await auth();

	if (!session) {
		redirect(AUTH_LOGIN);
	}

	return <ClientDashboardClient session={session} />;
};

export default ClientDashboardPage;
