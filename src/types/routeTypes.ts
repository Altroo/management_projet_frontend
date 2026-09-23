import type { ReactNode } from 'react';

export type NumericIdPageProps = {
	params: Promise<{ id: string }>;
};

export type RootLayoutProps = {
	children: ReactNode;
};
