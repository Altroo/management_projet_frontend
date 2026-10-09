import { APP_VERSION } from '@/utils/appVersion';
import reducer, { setWSMaintenance, setWSServerVersion } from './wsSlice';

describe('wsSlice reducer', () => {
	it('should return the initial state when passed an empty action', () => {
		const result = reducer(undefined, { type: '' });
		expect(result).toEqual({
			maintenance: false,
			localVersion: APP_VERSION,
			serverVersion: null,
		});
	});

	it('should handle setWSMaintenance', () => {
		const result = reducer(undefined, setWSMaintenance(true));
		expect(result).toEqual({
			maintenance: true,
			localVersion: APP_VERSION,
			serverVersion: null,
		});
	});
});

it('keeps the bundled version immutable and clears invalid announcements', () => {
	const announced = reducer(undefined, setWSServerVersion('999.0.0'));
	expect(announced.localVersion).toBe(APP_VERSION);
	expect(announced.serverVersion).toBe('999.0.0');
	const invalid = reducer(announced, setWSServerVersion('invalid'));
	expect(invalid.localVersion).toBe(APP_VERSION);
	expect(invalid.serverVersion).toBeNull();
});
