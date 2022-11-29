declare interface ObjectConstructor {
  keysTyped<T extends UnknownObject>(obj: T): Array<keyof T>;
  entriesTyped<T extends UnknownObject>(obj: T): Array<[keyof T, T[keyof T]]>;
}

// eslint-disable-next-line @typescript-eslint/ban-types
declare type UnknownObject = Object;
// eslint-disable-next-line @typescript-eslint/ban-types
declare type UnknownFunction = Function;

declare type Constructor<T> = new (...args) => T;
