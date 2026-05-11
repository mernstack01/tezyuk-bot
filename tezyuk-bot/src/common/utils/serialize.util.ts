export const serializeBigInts = <T>(value: T): T => {
  if (typeof value === 'bigint') {
    return value.toString() as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeBigInts(item)) as T;
  }

  if (value instanceof Date || value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        serializeBigInts(nestedValue),
      ]),
    ) as T;
  }

  return value;
};
