/**
 * Utility functions for handling BigInt serialization in JSON responses
 */

/**
 * Recursively converts BigInt values to numbers in an object
 * This is needed because JSON.stringify cannot serialize BigInt values
 */
export function serializeBigInts<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'bigint') {
    return Number(obj) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeBigInts) as unknown as T;
  }

  if (typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeBigInts(value);
    }
    return result as T;
  }

  return obj;
}

/**
 * Safely serialize an object to JSON, handling BigInt values
 */
export function safeJsonResponse<T>(obj: T): string {
  const serialized = serializeBigInts(obj);
  return JSON.stringify(serialized);
}
