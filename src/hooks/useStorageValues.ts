import { useReducer, useRef, useEffect } from 'react';
import { Storage } from '../types';

export const useStorageValues = <
  S,
  K extends (keyof T)[],
  T = S extends Storage<infer TT>
    ? TT extends Record<string, any>
      ? TT
      : Record<string, any>
    : Record<string, any>
>(
  storage: S,
  ...keys: K
): { [I in keyof K]: T[keyof T & K[I]] | undefined } => {
  const typedStorage = (storage as unknown) as Storage<T>;
  const [, forceRerender] = useReducer((prev) => prev + 1, 0);
  const keysRef = useRef(keys);
  keysRef.current = keys;

  useEffect(
    () =>
      typedStorage.subscribe((event) => {
        if (!event.modifiedKeys) return;
        const triggerRerender = event.modifiedKeys.some((key) =>
          keysRef.current.includes(key),
        );
        if (triggerRerender) forceRerender();
      }),
    [typedStorage],
  );

  return keys.map((key) => typedStorage.get(key)) as any;
};
