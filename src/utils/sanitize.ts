/**
 * Input Sanitization Utility
 * Protects against XSS and other injection attacks
 */

/**
 * Sanitize string to prevent XSS attacks
 * Escapes HTML special characters
 */
export function sanitizeHtml(input: string): string {
    if (!input || typeof input !== 'string') return input;

    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize object recursively (for API responses)
 * Use this when returning user-generated content to frontend
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
    if (!obj || typeof obj !== 'object') return obj;

    const sanitized: any = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
        const value = obj[key];

        if (typeof value === 'string') {
            sanitized[key] = sanitizeHtml(value);
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeObject(value);
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
}

/**
 * Strip potentially dangerous characters from filenames
 */
export function sanitizeFilename(filename: string): string {
    if (!filename) return filename;

    return filename
        .replace(/[<>:"/\\|?*]/g, '_')  // Windows forbidden chars
        .replace(/\.\./g, '_')           // Path traversal
        .replace(/^\./, '_')             // Hidden files
        .substring(0, 255);              // Max filename length
}

/**
 * Validate and sanitize UUID format
 * Returns null if invalid
 */
export function sanitizeUuid(uuid: string): string | null {
    if (!uuid) return null;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const cuidRegex = /^c[a-z0-9]{24,}$/i;  // Prisma CUID format

    if (uuidRegex.test(uuid) || cuidRegex.test(uuid)) {
        return uuid;
    }

    return null;
}

/**
 * Sanitize SQL-like input (extra layer, Prisma already handles this)
 * This is a defense-in-depth measure
 */
export function sanitizeSqlInput(input: string): string {
    if (!input || typeof input !== 'string') return input;

    // Remove SQL comment syntax
    return input
        .replace(/--/g, '')
        .replace(/;/g, '')
        .replace(/\/\*/g, '')
        .replace(/\*\//g, '');
}
