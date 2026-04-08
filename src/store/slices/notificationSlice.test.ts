import reducer, { incrementUnreadCount, setLatestNotification, setUnreadCount } from './notificationSlice';
import type { NotificationType } from '@/types/managementNotificationTypes';

describe('notification slice', () => {
	const sampleNotification: NotificationType = {
		id: 1,
		title: 'Budget dépassé',
		message: 'Le projet 10 a dépassé son budget.',
		notification_type: 'budget_overrun',
		object_id: 10,
		is_read: false,
		date_created: '2026-04-01T10:00:00Z',
	};

	it('returns the initial state when given undefined state', () => {
		expect(reducer(undefined, { type: '@@INIT' })).toEqual({
			unreadCount: 0,
			latestNotification: null,
		});
	});

	it('setUnreadCount sets the unread count', () => {
		expect(reducer(undefined, setUnreadCount(5)).unreadCount).toBe(5);
	});

	it('incrementUnreadCount increments the count by one', () => {
		const state = { unreadCount: 2, latestNotification: null };
		expect(reducer(state, incrementUnreadCount()).unreadCount).toBe(3);
	});

	it('setLatestNotification stores the latest notification', () => {
		expect(reducer(undefined, setLatestNotification(sampleNotification)).latestNotification).toEqual(sampleNotification);
	});

	it('setLatestNotification overwrites the previous notification', () => {
		const next = reducer(
			{ unreadCount: 1, latestNotification: sampleNotification },
			setLatestNotification({ ...sampleNotification, id: 2, notification_type: 'deadline_approaching' }),
		);

		expect(next.latestNotification?.id).toBe(2);
		expect(next.latestNotification?.notification_type).toBe('deadline_approaching');
	});
});