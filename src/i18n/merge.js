export function deepMerge(...objects) {
  const result = {};
  for (const obj of objects) {
    if (!obj || typeof obj !== 'object') continue;
    for (const [key, value] of Object.entries(obj)) {
      if (
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        result[key] &&
        typeof result[key] === 'object' &&
        !Array.isArray(result[key])
      ) {
        result[key] = deepMerge(result[key], value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}
