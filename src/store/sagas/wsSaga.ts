import { call, put, select, take } from 'redux-saga/effects';
import { initWebsocket } from '@/store/services/ws';
import { getAccessToken } from '@/store/selectors';
import type { RootState } from '@/store/store';
import type { Action } from 'redux';
import type { EventChannel, SagaIterator } from 'redux-saga';
import * as Types from '@/store/actions';
import { setWSMaintenance } from '@/store/slices/wsSlice';
import { initMaintenanceSaga } from '@/store/sagas/_initSaga';

type WSChannelAction = Action & {
	maintenance?: boolean;
};

function* monitorToken(
	selector: (state: RootState) => string | null,
	previousValue: string | null,
	takePattern = '*',
): SagaIterator<string | null> {
	while (true) {
		const nextValue: string | null = yield select(selector);
		if (nextValue !== previousValue) {
			return nextValue;
		}
		yield take(takePattern);
	}
}

export function* watchWS(): SagaIterator<void> {
	const token: string | null = yield call(monitorToken, getAccessToken, null);

	if (token) {
		const channel: EventChannel<WSChannelAction> = yield call(initWebsocket, token);

		while (true) {
			const action: WSChannelAction = yield take(channel);
			if (action.type === Types.WS_MAINTENANCE && typeof action.maintenance === 'boolean') {
				yield put(setWSMaintenance(action.maintenance));
			} else if (action.type === Types.WS_RECONNECTED) {
				yield call(initMaintenanceSaga);
			} else {
				yield put(action);
			}
		}
	}
}
