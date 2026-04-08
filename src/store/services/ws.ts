import type { EventChannel } from 'redux-saga';
import { eventChannel } from 'redux-saga';
import { WSMaintenanceAction, WSUserAvatarAction, WSReconnectedAction, WSNotificationAction } from '@/store/actions/wsActions';
import type { WSAction, WSEnvelope } from '@/types/wsTypes';
import type { NotificationType } from '@/types/managementNotificationTypes';

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
	return typeof value === 'object' && value !== null;
};

const isWSEnvelope = (value: unknown): value is WSEnvelope => {
	if (!isObjectRecord(value)) {
		return false;
	}

	const message = value.message;
	if (!isObjectRecord(message)) {
		return false;
	}

	return typeof message.type === 'string';
};

const isNotificationTypeValue = (value: unknown): value is NotificationType['notification_type'] => {
	return (
		value === 'budget_overrun' ||
		value === 'budget_threshold' ||
		value === 'deadline_approaching' ||
		value === 'project_overdue' ||
		value === 'status_change'
	);
};

let ws: WebSocket;

const WS_MAX_RECONNECT_DELAY_MS = 30000;
const WS_INITIAL_RECONNECT_DELAY_MS = 1000;

export function initWebsocket(getToken: () => Promise<string | null>): EventChannel<WSAction> {
	return eventChannel<WSAction>((emitter) => {
		let reconnectDelay = WS_INITIAL_RECONNECT_DELAY_MS;
		let hasConnectedBefore = false;

		async function createWs() {
			const wsUrl = `${process.env.NEXT_PUBLIC_ROOT_WS_URL}`;
			if (typeof window !== 'undefined') {
				const token = await getToken();
				if (!token) {
					// Token not available yet — retry with backoff
					setTimeout(() => {
						void createWs();
					}, reconnectDelay);
					reconnectDelay = Math.min(reconnectDelay * 2, WS_MAX_RECONNECT_DELAY_MS);
					return;
				}
				ws = new WebSocket(`${wsUrl}?token=${token}`);
				ws.onopen = () => {
					reconnectDelay = WS_INITIAL_RECONNECT_DELAY_MS;
					if (hasConnectedBefore) {
						emitter(WSReconnectedAction());
					}
					hasConnectedBefore = true;
				};
				ws.onerror = () => {
					// let onclose handle retries
				};
				ws.onmessage = (e: MessageEvent) => {
					try {
						const parsedMessage: unknown = JSON.parse(e.data as string);
						if (isWSEnvelope(parsedMessage)) {
							const { message } = parsedMessage;
							const signalType = message.type;
							if (signalType === 'USER_AVATAR') {
								if (typeof message.pk === 'number' && typeof message.avatar === 'string') {
									emitter(WSUserAvatarAction(message.pk, message.avatar));
								}
							} else if (signalType === 'MAINTENANCE') {
								if (typeof message.maintenance === 'boolean') {
									emitter(WSMaintenanceAction(message.maintenance));
								}
							} else if (signalType === 'NOTIFICATION') {
								if (typeof message.id === 'number' && typeof message.title === 'string') {
									const notification: NotificationType = {
										id: message.id,
										title: message.title,
										message: typeof message.message === 'string' ? message.message : '',
										notification_type: isNotificationTypeValue(message.notification_type)
											? message.notification_type
											: 'status_change',
										object_id: typeof message.object_id === 'number' ? message.object_id : null,
										is_read: typeof message.is_read === 'boolean' ? message.is_read : false,
										date_created: typeof message.date_created === 'string' ? message.date_created : new Date().toISOString(),
									};
									emitter(WSNotificationAction(notification));
								}
							}
						}
					} catch {
						// Skip malformed message and continue listening
					}
				};
				ws.onclose = () => {
					setTimeout(() => {
						void createWs();
					}, reconnectDelay);
					reconnectDelay = Math.min(reconnectDelay * 2, WS_MAX_RECONNECT_DELAY_MS);
				};
			}
		}

		void createWs();
		return () => {
			try {
				ws.close();
			} catch {
				// ignore
			}
		};
	});
}
