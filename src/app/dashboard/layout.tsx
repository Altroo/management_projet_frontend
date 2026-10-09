import AppUpdate from '@/components/shared/appUpdate/appUpdate';
import { type ReactNode } from 'react';

const DashboardLayout = ({ children }: { children: ReactNode }) => {
	return (
		<section>
			<AppUpdate />
			{children}
		</section>
	);
};

export default DashboardLayout;
