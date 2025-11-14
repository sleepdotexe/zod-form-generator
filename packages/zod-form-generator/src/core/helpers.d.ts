type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

type DeepNullable<T> = {
  [K in keyof T]: T[K] extends Array<unknown>
    ? T[K] | null
    : T[K] extends object
    ? T[K] extends Date
      ? T[K] | null
      : T[K] extends Function
      ? T[K] | null
      : DeepNullable<T[K]>
    : T[K] | null;
};
