import type { Context } from 'elysia';
import { runInContext } from '../utils/context';

/**
 * Elysia Plugin untuk inject request context
 * 
 * Usage di index.ts:
 *   app.use(requestContextPlugin)
 * 
 * Plugin ini akan:
 * 1. Extract userId dari JWT (jika ada)
 * 2. Extract IP address dari headers
 * 3. Store ke AsyncLocalStorage
 * 4. Tersedia di semua service methods via getRequestContext()
 */
export const requestContextPlugin = (app: any) => {
    return app.derive(async ({ headers, userId, request }: Context & { userId?: string }) => {
        // Extract IP address
        const ipAddress =
            headers['x-forwarded-for'] ||
            headers['x-real-ip'] ||
            request?.headers?.get('x-forwarded-for') ||
            request?.headers?.get('x-real-ip') ||
            'unknown';

        // Create context object
        const context = {
            userId: userId?.toString(), // Convert BigInt to string if needed
            ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
        };

        // Store in AsyncLocalStorage
        // Note: We return a wrapped handler, bukan langsung modify context
        return {
            requestContext: context,
        };
    }).onBeforeHandle(async ({ requestContext }: any) => {
        // Wrap execution in AsyncLocalStorage context
        // This ensures context is available in all downstream code
        if (requestContext) {
            return runInContext(requestContext, () => {
                // Continue with normal request handling
                return undefined; // Return undefined = continue
            });
        }
    });
};
