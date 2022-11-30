export type ReturnValue<T extends Function> = T extends (...args: any[]) => infer R ? R : never;

export type ResolvedValue<T extends Promise<unknown>> = T extends Promise<infer R> ? R : never;

export type ExcludeProps<T, F> = {
  [P in keyof T]: T[P] extends F ? never : T[P];
};

export type OmitType<T, O> = {
  [K in keyof T as T[K] extends O ? never : K]: T[K];
};

export type PickType<T, P> = {
  [K in keyof T as T[K] extends P | undefined ? K : never]: T[K];
};
