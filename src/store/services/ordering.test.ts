import { usersApi } from './account';
import { projectApi } from './project';
import { setupApiStore } from '@/store/setupApiStore';

jest.mock('@/utils/axiosBaseQuery', () => {
	const baseQuery = jest.fn(async () => ({ data: { count: 0, results: [] } }));
	return { axiosBaseQuery: () => baseQuery, mockOrderingBaseQuery: baseQuery };
});
const { mockOrderingBaseQuery } = jest.requireMock('@/utils/axiosBaseQuery') as { mockOrderingBaseQuery: jest.Mock };

describe('getUsersList ordering', () => {
	const storeRef = setupApiStore(usersApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(usersApi.endpoints.getUsersList.initiate(params));
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});

describe('getProjectsList ordering', () => {
	const storeRef = setupApiStore(projectApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(projectApi.endpoints.getProjectsList.initiate(params));
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});

describe('getClients ordering', () => {
	const storeRef = setupApiStore(projectApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(projectApi.endpoints.getClients.initiate(params));
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});

describe('getSuppliers ordering', () => {
	const storeRef = setupApiStore(projectApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(projectApi.endpoints.getSuppliers.initiate(params));
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});

describe('getCategories ordering', () => {
	const storeRef = setupApiStore(projectApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(projectApi.endpoints.getCategories.initiate(params));
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});

describe('getExpenses ordering', () => {
	const storeRef = setupApiStore(projectApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(projectApi.endpoints.getExpenses.initiate(params));
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});

describe('getRevenues ordering', () => {
	const storeRef = setupApiStore(projectApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(projectApi.endpoints.getRevenues.initiate(params));
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});

describe('getQuotes ordering', () => {
	const storeRef = setupApiStore(projectApi);
	it.each(['name', '-name'])('forwards %s to the API', async (ordering) => {
		mockOrderingBaseQuery.mockClear();
		const params = {
			company_id: 1,
			store: 1,
			page: 2,
			pageSize: 5,
			search: 'keep-filter',
			ordering,
		};
		const request = storeRef.store.dispatch(projectApi.endpoints.getQuotes.initiate(params));
		await request;
		expect(mockOrderingBaseQuery).toHaveBeenCalled();
		expect(mockOrderingBaseQuery.mock.calls.at(-1)?.[0].params).toEqual(expect.objectContaining({ ordering }));
		request.unsubscribe();
	});
});
