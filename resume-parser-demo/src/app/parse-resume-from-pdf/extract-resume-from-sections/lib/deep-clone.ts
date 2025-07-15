// Simple deep clone utility using JSON methods (sufficient for plain objects/arrays)
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
} 