import { AsyncLocalStorage } from 'async_hooks';

/**
 * Request Context Type
 * Stores userId and ipAddress for current request
 */
export interface RequestContext {
    userId?: string;
    ipAddress?: string;
}

/**
 * AsyncLocalStorage untuk menyimpan request context
 * Setiap request punya context sendiri (thread-safe)
 */
export const requestContextStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Get current request context
 * @returns RequestContext or undefined jika di luar request scope
 */
export function getRequestContext(): RequestContext | undefined {
    return requestContextStorage.getStore();
}

/**
 * Set request context (biasanya dipanggil oleh middleware)
 */
export function setRequestContext(context: RequestContext): void {
    const store = requestContextStorage.getStore();
    if (store) {
        Object.assign(store, context);
    }
}

/**
 * Run function dalam request context scope
 * Ini dipanggil oleh Elysia plugin di setiap request
 */
export function runInContext<T>(context: RequestContext, fn: () => T): T {
    return requestContextStorage.run(context, fn);
}
