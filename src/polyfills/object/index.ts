if (!Object.keysTyped) {
  Object.keysTyped = function <T extends UnknownObject>(obj: T): Array<keyof T> {
    return Object.keys(obj) as Array<keyof T>;
  };
}

if (!Object.entriesTyped) {
  Object.entriesTyped = function <T extends UnknownObject>(obj: T): Array<[keyof T, T[keyof T]]> {
    return Object.entries(obj) as Array<[keyof T, T[keyof T]]>;
  };
}
