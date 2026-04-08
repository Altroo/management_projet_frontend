import type { WSMaintenanceAction, WSNotificationAction, WSUserAvatarAction, WSReconnectedAction } from '@/store/actions/wsActions';

export interface WSMaintenanceBootstrap {
	maintenance: boolean;
}

export type WSAction =
	| ReturnType<typeof WSUserAvatarAction>
	| ReturnType<typeof WSMaintenanceAction>
	| ReturnType<typeof WSNotificationAction>
	| ReturnType<typeof WSReconnectedAction>;

type WSMessage = {
	type: string;
	pk?: number;
	avatar?: string;
	maintenance?: boolean;
	id?: number;
	title?: string;
	message?: string;
	notification_type?: string;
	object_id?: number | null;
	reservation_id?: number | null;
	is_read?: boolean;
	date_created?: string;
};

export type WSEnvelope = {
	message: WSMessage;
};
