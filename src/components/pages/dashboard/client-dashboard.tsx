'use client';

import { type FC } from 'react';
import type { SessionProps } from '@/types/_initTypes';
import ProjectDashboardClient from './project-dashboard';

const ClientDashboardClient: FC<SessionProps> = ({ session }) => (
	<ProjectDashboardClient session={session} clientFacing />
);

export default ClientDashboardClient;
