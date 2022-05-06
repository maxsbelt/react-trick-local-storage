import { CreateStorageOptions, Storage, StorageEvent, Row } from '../types';

export const createStorage = <
  T extends Record<string, any> = Record<string, any>
>(
  options: CreateStorageOptions<T>,
): Storage<T> => {
  let subscribers: ((event: StorageEvent<T>) => void)[] = [];
  const triggerEvent = (event: StorageEvent<T>) => {
    if (options.onEvent) options.onEvent(event);
    subscribers.forEach((subscriber) => subscriber(event));
  };
  let rows = load<T>({
    key: options.key,
    onEvent: triggerEvent,
  });

  const save = (newRows: Row<T>[]) => {
    const serialized = JSON.stringify(newRows.filter((row) => !row.inMemory));
    try {
      window.localStorage.setItem(options.key, serialized);
    } catch {
      triggerEvent({
        code: 'warning',
        payload: {
          message: 'localStorage API is not available.',
        },
      });
    }
    rows = newRows;

    triggerEvent({
      code: 'save',
      payload: { rows: newRows },
    });
  };

  const exclude = (key: keyof T) =>
    rows.filter((row) => {
      if (row.key !== key) return true;
      return false;
    });

  return {
    get: <K extends keyof T>(key: K) => {
      const result = rows.find((row) => {
        if (row.key !== key) return false;
        return row;
      });

      let value = result ? (result.value as T[Exclude<K, string>]) : undefined;

      if (result && result.expires) {
        const time = (Date.now() - result.createdAt) / 1000;
        if (time > result.expires) {
          value = undefined;
        }
      }

      triggerEvent({
        code: 'get',
        payload: { key, value },
      });
      return value;
    },

    getAll: () => rows,

    set: (
      key,
      value,
      { inSession = false, inMemory = false, expires } = {},
    ) => {
      rows = exclude(key);

      const row: Row<T> = {
        key,
        value,
        createdAt: Date.now(),
      };
      if (inSession) row.inSession = true;
      if (inMemory) row.inMemory = true;
      if (typeof expires === 'number' && expires > 0) {
        row.expires = expires;
      }

      save([...rows, row]);
      triggerEvent({
        code: 'set',
        modifiedKeys: [key],
        payload: { row },
      });
    },

    remove: (key) => {
      save(exclude(key));
      triggerEvent({
        code: 'remove',
        modifiedKeys: [key],
      });
    },

    clear: ({ inSession } = { inSession: false }) => {
      const modifiedKeys: (keyof T)[] = [];
      save(
        rows.filter((row) => {
          if (!inSession || row.inSession) {
            modifiedKeys.push(row.key);
            return false;
          }
          return true;
        }),
      );
      triggerEvent({
        code: 'clear',
        modifiedKeys,
        payload: { inSession },
      });
    },

    subscribe: (subscriber) => {
      subscribers = [...subscribers, subscriber];
      return () => {
        subscribers = subscribers.filter((sub) => sub !== subscriber);
      };
    },
  };
};

const load = <T>({ key, onEvent }: Required<CreateStorageOptions<T>>) => {
  let item: string | null = null;

  try {
    item = window.localStorage.getItem(key);
  } catch {
    onEvent({
      code: 'warning',
      payload: {
        message: 'localStorage API is not available.',
      },
    });
  }

  let rows: Row<T>[] = [];

  try {
    rows = JSON.parse(item || '[]');
  } catch {
    onEvent({
      code: 'loadError',
      payload: {
        message: 'Unexpected data in localStorage',
      },
    });
  }

  if (!Array.isArray(rows)) {
    onEvent({
      code: 'loadError',
      payload: {
        message: 'Unexpected data in localStorage',
      },
    });
    rows = [];
  }

  onEvent({
    code: 'load',
    payload: { rows },
  });
  return rows;
};
