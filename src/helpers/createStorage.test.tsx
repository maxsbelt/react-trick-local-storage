import { Storage, Row } from '../types';
import { createStorage } from './createStorage';

type MockedRow = Omit<Row, 'createdAt'>;

const STORAGE_KEY = 'storage.key';

const localStorageMock = {
  initRecords: () => {
    const rows: MockedRow[] = [
      { key: 'key1', value: 'value1' },
      { key: 'key2', value: 'value2', inSession: true },
    ];
    const actualRows: Row[] = rows.map((row) => ({
      ...row,
      createdAt: Date.now(),
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(actualRows));
  },
  initCustom: (data: any) => localStorage.setItem(STORAGE_KEY, data),
  read: () => {
    const string = localStorage.getItem(STORAGE_KEY);
    const rows: Row[] = string ? JSON.parse(string) : [];
    return excludeCreatedAt(rows);
  },
};

const excludeCreatedAt = (rows: Row[]) =>
  rows.map(({ createdAt, ...row }) => row);

describe('helpers/createStorage', () => {
  let storage: Storage;
  let onEvent: jest.Mock;

  const initStorage = () => {
    onEvent = jest.fn();
    storage = createStorage({
      key: STORAGE_KEY,
      onEvent,
    });
  };
  const getAllKeys = () => excludeCreatedAt(storage.getAll());

  beforeEach(initStorage);

  afterEach(() => {
    storage.clear();
  });

  describe('initialization', () => {
    describe('corrupted data', () => {
      it('triggers loadError event and uses [] as default', () => {
        const values = [undefined, '{}'];
        values.forEach((value) => {
          localStorageMock.initCustom(value);
          initStorage();

          expect(getAllKeys()).toEqual([]);
          expect(onEvent.mock.calls.length).toBe(2);
          expect(onEvent.mock.calls[0][0].code).toEqual('loadError');
          expect(onEvent.mock.calls[1][0].code).toEqual('load');
        });
      });
    });
  });

  describe('set', () => {
    it('sets key and saves it to localStorage', () => {
      storage.set('key', 'value');

      const expectedResult: MockedRow[] = [{ key: 'key', value: 'value' }];
      expect(getAllKeys()).toEqual(expectedResult);
      expect(localStorageMock.read()).toEqual(expectedResult);

      expect(onEvent.mock.calls.length).toBe(3);
      expect(onEvent.mock.calls[0][0].code).toEqual('load');
      expect(onEvent.mock.calls[1][0].code).toEqual('save');
      expect(onEvent.mock.calls[2][0]).toEqual(
        expect.objectContaining({
          code: 'set',
          modifiedKeys: ['key'],
        }),
      );
    });

    it('sets key in memory', () => {
      storage.set('key', 'value', {
        inMemory: true,
      });

      const expectedResult: MockedRow[] = [
        { key: 'key', value: 'value', inMemory: true },
      ];
      expect(getAllKeys()).toEqual(expectedResult);
      expect(localStorageMock.read()).toEqual([]);
    });

    it('sets key in session', () => {
      storage.set('key', 'value', {
        inSession: true,
      });

      const expectedResult: MockedRow[] = [
        { key: 'key', value: 'value', inSession: true },
      ];
      expect(getAllKeys()).toEqual(expectedResult);
      expect(localStorageMock.read()).toEqual(expectedResult);
    });

    it('sets correct types', () => {
      const s = createStorage<{ key1: string }>({ key: 'any' });
      // @ts-expect-error
      s.set('key1', true);
      s.set('key1', 'value');
    });

    it('sets expires', () => {
      storage.set('key', 'value', {
        expires: 100,
      });

      const expectedResult: MockedRow[] = [
        { key: 'key', value: 'value', expires: 100 },
      ];
      expect(getAllKeys()).toEqual(expectedResult);
      expect(localStorageMock.read()).toEqual(expectedResult);
    });
  });

  describe('get', () => {
    it('returns added key', () => {
      storage.set('key', 'value');
      expect(storage.get('key')).toEqual('value');
    });

    it('returns key saved in localStorage', () => {
      localStorageMock.initRecords();
      initStorage();
      expect(storage.get('key2')).toEqual('value2');
    });

    it('returns undefined', () => {
      expect(storage.get('key1')).toBeUndefined();
    });

    it('returns correct types', () => {
      const s = createStorage<{ key1: string }>({ key: 'any' });
      // @ts-expect-error
      const result1 = s.get('key1') as boolean; // eslint-disable-line @typescript-eslint/no-unused-vars
      const result2 = s.get('key1') as string;
      expect(result2).toEqual('value');
    });

    it('returns undefined if data is expired', () => {
      const dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => 0);

      const s = createStorage<{ key: string }>({ key: 'any' });
      s.set('key', 'value', { expires: 61 });

      let value = s.get('key');
      expect(value).toEqual('value');

      dateNowSpy.mockImplementation(() => 60000);
      value = s.get('key') as string;
      expect(value).toEqual('value');

      dateNowSpy.mockImplementation(() => 62000);
      value = s.get('key');
      expect(value).toBeUndefined();

      dateNowSpy.mockRestore();
    });
  });

  describe('remove', () => {
    it('removes key from localStorage', () => {
      localStorageMock.initRecords();
      initStorage();

      storage.remove('key1');

      const expectedResult: MockedRow[] = [
        { key: 'key2', value: 'value2', inSession: true },
      ];
      expect(getAllKeys()).toEqual(expectedResult);
      expect(localStorageMock.read()).toEqual(expectedResult);

      expect(onEvent.mock.calls.length).toBe(3);
      expect(onEvent.mock.calls[0][0].code).toEqual('load');
      expect(onEvent.mock.calls[1][0].code).toEqual('save');
      expect(onEvent.mock.calls[2][0]).toEqual(
        expect.objectContaining({
          code: 'remove',
          modifiedKeys: ['key1'],
        }),
      );
    });
  });

  describe('clear', () => {
    it('clears all data', () => {
      localStorageMock.initRecords();
      initStorage();

      storage.set('key3', 'value3', { inMemory: true });
      storage.clear();

      expect(getAllKeys()).toEqual([]);
      expect(localStorageMock.read()).toEqual([]);

      expect(onEvent.mock.calls.length).toBe(5);
      expect(onEvent.mock.calls[0][0].code).toEqual('load');
      expect(onEvent.mock.calls[1][0].code).toEqual('save');
      expect(onEvent.mock.calls[2][0].code).toEqual('set');
      expect(onEvent.mock.calls[3][0].code).toEqual('save');
      expect(onEvent.mock.calls[4][0]).toEqual(
        expect.objectContaining({
          code: 'clear',
          modifiedKeys: ['key1', 'key2', 'key3'],
        }),
      );
    });

    it('clears only session data', () => {
      localStorageMock.initRecords();
      initStorage();

      storage.set('key3', 'value3', { inMemory: true });
      storage.clear({ inSession: true });

      const expectedResult: MockedRow[] = [
        { key: 'key1', value: 'value1' },
        { key: 'key3', value: 'value3', inMemory: true },
      ];
      expect(getAllKeys()).toEqual(expectedResult);
      expect(localStorageMock.read()).toEqual(
        expectedResult.filter((row) => !row.inMemory),
      );

      expect(onEvent.mock.calls.length).toBe(5);
      expect(onEvent.mock.calls[0][0].code).toEqual('load');
      expect(onEvent.mock.calls[1][0].code).toEqual('save');
      expect(onEvent.mock.calls[2][0].code).toEqual('set');
      expect(onEvent.mock.calls[3][0].code).toEqual('save');
      expect(onEvent.mock.calls[4][0]).toEqual(
        expect.objectContaining({
          code: 'clear',
          modifiedKeys: ['key2'],
        }),
      );
    });
  });
});
