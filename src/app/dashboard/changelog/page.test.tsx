import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Page from './page';
import Changelog from '@/components/pages/dashboard/changelog/changelog';
import { AUTH_LOGIN } from '@/utils/routes';

jest.mock('@/auth', () => ({ auth: jest.fn() }));
jest.mock('next/navigation', () => ({
	redirect: jest.fn(() => {
		throw new Error('redirect');
	}),
}));
jest.mock('@/components/pages/dashboard/changelog/changelog', () => ({ __esModule: true, default: () => null }));
beforeEach(() => jest.clearAllMocks());
it('requires a signed-in user', async () => {
	(auth as jest.Mock).mockResolvedValue(null);
	await expect(Page()).rejects.toThrow('redirect');
	expect(redirect).toHaveBeenCalledWith(AUTH_LOGIN);
});
it('is available to an ordinary signed-in user', async () => {
	(auth as jest.Mock).mockResolvedValue({ user: { is_staff: false } });
	expect((await Page()).type).toBe(Changelog);
	expect(redirect).not.toHaveBeenCalled();
});
