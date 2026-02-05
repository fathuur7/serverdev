import superjson from 'superjson';

/**
 * Utility: Serialize complex types (BigInt, Date, Map, Set, etc)
 * Uses SuperJSON for proper serialization/deserialization
 */
export function serializeBigInt(obj: any): any {
    if (obj === null || obj === undefined) return obj;

    // SuperJSON handles: BigInt, Date, Map, Set, RegExp, undefined, NaN, -0
    const serialized = superjson.serialize(obj);
    return serialized.json; // Return only JSON part (no metadata)
}

/**
 * Sanitize data for activity logging
 * - Removes sensitive fields
 * - Converts BigInt to string (via SuperJSON)
 */
export function sanitizeForLogging(data: any): any {
    if (!data || typeof data !== 'object') return data;

    const SENSITIVE_FIELDS = ['passwordHash', 'password', 'token', 'refreshToken', 'accessToken'];

    // First serialize with SuperJSON (handles BigInt, Date, etc)
    const serialized = serializeBigInt(data);

    // Then remove sensitive fields
    if (Array.isArray(serialized)) {
        return serialized;
    }

    const sanitized = { ...serialized };
    SENSITIVE_FIELDS.forEach(field => {
        if (field in sanitized) {
            sanitized[field] = '[REDACTED]';
        }
    });

    return sanitized;
}

/**
 * Deserialize data from activity log
 * Reconstructs BigInt, Date, Map, Set from serialized form
 */
export function deserializeLogData(data: any): any {
    if (!data) return data;

    // SuperJSON deserialize (if metadata exists)
    try {
        return superjson.deserialize({ json: data, meta: undefined });
    } catch {
        return data; // Fallback to raw data
    }
}
