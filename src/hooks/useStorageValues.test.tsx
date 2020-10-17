import { useRef, useEffect } from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { Storage } from '../types';
import { createStorage } from '../helpers/createStorage';
import { useStorageValues } from './useStorageValues';

interface Fields {
  key1: string;
  key2: string;
}

const STORAGE_KEY = 'storage.key';

describe('hooks/useStorageValues', () => {
  it('works', async () => {
    const storage = createStorage<Fields>({
      key: STORAGE_KEY,
    });

    const { result } = renderHook(() => useStorage({ storage, key: 'key1' }));
    expect(result.current).toEqual({
      value: '',
      renderCount: 0,
    });

    // update of watched value rerenders hook
    act(() => storage.set('key1', 'value1'));
    expect(result.current).toEqual({
      value: 'value1',
      renderCount: 1,
    });

    // update of other values doesn't rerender hook
    act(() => storage.set('key2', 'value2'));
    expect(result.current).toEqual({
      value: 'value1',
      renderCount: 1,
    });
  });
});

const useStorage = ({
  storage,
  key,
}: {
  storage: Storage<Fields>;
  key: keyof Fields;
}) => {
  const countRef = useRef(0);
  useEffect(() => {
    countRef.current += 1;
  });

  const [value = ''] = useStorageValues(storage, key);
  return {
    value,
    renderCount: countRef.current,
  };
};
