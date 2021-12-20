export interface RowOptions {
  /**
   * If 'true' record will be cleared on clear with inSession param.
   */
  inSession?: boolean;

  /**
   * If 'true' record won't be saved in localStorage (disappear on page refresh).
   */
  inMemory?: boolean;

  /**
   * If specified indicates that the data remains in storage until N seconds after record is created.
   */
  expires?: number;
}

export type Row<
  T extends Record<string, any> = Record<string, any>,
  K extends keyof T = keyof T
> = {
  /**
   * Key of variable.
   */
  key: K;

  /**
   * Value of variable.
   */
  value: T[K];

  /**
   * Creation timestamp.
   */
  createdAt: number;
} & RowOptions;

export interface CreateStorageOptions<T> {
  key: string;
  onEvent?: (event: StorageEvent<T>) => void;
}

export interface Storage<T extends Record<string, any> = Record<string, any>> {
  set: <K extends keyof T>(key: K, value: T[K], options?: RowOptions) => void;
  get: <K extends keyof T>(key: K) => T[K] | undefined;
  getAll: () => Row<T>[];
  remove: (key: keyof T) => void;
  clear: (options?: { inSession: boolean }) => void;
  subscribe: (callback: (event: StorageEvent<T>) => void) => () => void;
}

export interface StorageEvent<T> {
  code: string;
  modifiedKeys?: (keyof T)[];
  payload?: any;
}
