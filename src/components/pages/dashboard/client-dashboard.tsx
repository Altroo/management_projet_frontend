'use client';

import React from 'react';
import type { SessionProps } from '@/types/_initTypes';
import ProjectDashboardClient from './project-dashboard';

const ClientDashboardClient: React.FC<SessionProps> = ({ session }) => (
	<ProjectDashboardClient session={session} clientFacing />
);

export default ClientDashboardClient;
