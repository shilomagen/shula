import { snakeCase, camelCase } from 'change-case';

/**
 * Converts an object's keys from camelCase to snake_case recursively
 * @param obj - The object to convert
 * @returns A new object with snake_case keys
 */
export function camelToSnakeCase<T = any>(
  obj: Record<string, any>
): T {
  // Dynamically import the change-case package

  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj as T;
  }

  const result: Record<string, any> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeCaseKey = snakeCase(key);
      const value = obj[key];

      if (value === null || typeof value !== 'object') {
        result[snakeCaseKey] = value;
      } else if (Array.isArray(value)) {
        result[snakeCaseKey] = value.map((item) =>
          typeof item === 'object' && item !== null
            ? camelToSnakeCase(item)
            : item
        )
      } else {
        result[snakeCaseKey] = camelToSnakeCase(value);
      }
    }
  }

  return result as T;
}

/**
 * Converts an object's keys from snake_case to camelCase recursively
 * @param obj - The object to convert
 * @returns A new object with camelCase keys
 */
export function snakeToCamelCase<T = any>(
  obj: Record<string, any>
): T {
  // Dynamically import the change-case package

  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj as T;
  }

  const result: Record<string, any> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelCaseKey = camelCase(key);
      const value = obj[key];

      if (value === null || typeof value !== 'object') {
        result[camelCaseKey] = value;
      } else if (Array.isArray(value)) {
        result[camelCaseKey] = value.map((item) =>
          typeof item === 'object' && item !== null
            ? snakeToCamelCase(item)
            : item
        )
      } else {
        result[camelCaseKey] = snakeToCamelCase(value);
      }
    }
  }

  return result as T;
}
