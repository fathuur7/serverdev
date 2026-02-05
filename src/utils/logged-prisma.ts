import prisma from './prisma';
import { getRequestContext } from './context';
import { sanitizeForLogging } from './serialize';
import { logActivity } from '../services/logs/activitylog.service';

/**
 * Tables yang di-log activity-nya
 * Exclude: ActivityLog (prevent recursion), Session, RefreshToken (too noisy)
 */
const LOGGABLE_MODELS = [
    'User',
    'Subscription',
    'Payment',
    'SupportTicket',
    'WorkOrder',
    'StockItem',
    'AssetTracking',
    'Invoice',
    'TechnicalSupport',
];

/**
 * Check if model should be logged
 */
function shouldLog(modelName: string): boolean {
    return LOGGABLE_MODELS.includes(modelName);
}

/**
 * Auto-logging wrapper untuk CREATE operations
 * 
 * Usage:
 *   const user = await loggedCreate('User', { data: { email, ... } });
 */
export async function loggedCreate<T>(
    modelName: string,
    args: any
): Promise<T> {
    // Execute create
    const result = await (prisma as any)[modelName.toLowerCase()].create(args);

    // Log if applicable
    if (shouldLog(modelName)) {
        const context = getRequestContext();

        await logActivity({
            actorUserId: context?.userId || 'system',
            action: 'CREATE',
            targetTable: modelName,
            targetId: result?.id?.toString() || 'unknown',
            newValue: sanitizeForLogging(result),
            ipAddress: context?.ipAddress || 'unknown',
        }).catch(err => console.error('Activity log failed:', err));
    }

    return result;
}

/**
 * Auto-logging wrapper untuk UPDATE operations
 * 
 * Usage:
 *   const user = await loggedUpdate('User', { 
 *     where: { id: userId }, 
 *     data: { name: newName } 
 *   });
 */
export async function loggedUpdate<T>(
    modelName: string,
    args: any
): Promise<T> {
    // Fetch old value first
    let oldValue = null;
    if (args.where?.id && shouldLog(modelName)) {
        try {
            oldValue = await (prisma as any)[modelName.toLowerCase()].findUnique({
                where: { id: args.where.id }
            });
        } catch (e) {
            // Continue without old value
        }
    }

    // Execute update
    const result = await (prisma as any)[modelName.toLowerCase()].update(args);

    // Log if applicable
    if (shouldLog(modelName)) {
        const context = getRequestContext();

        await logActivity({
            actorUserId: context?.userId || 'system',
            action: 'UPDATE',
            targetTable: modelName,
            targetId: args.where?.id?.toString() || 'unknown',
            oldValue: sanitizeForLogging(oldValue),
            newValue: sanitizeForLogging(result),
            ipAddress: context?.ipAddress || 'unknown',
        }).catch(err => console.error('Activity log failed:', err));
    }

    return result;
}

/**
 * Auto-logging wrapper untuk DELETE operations
 * 
 * Usage:
 *   await loggedDelete('User', { where: { id: userId } });
 */
export async function loggedDelete<T>(
    modelName: string,
    args: any
): Promise<T> {
    // Fetch value before delete
    let oldValue = null;
    if (args.where?.id && shouldLog(modelName)) {
        try {
            oldValue = await (prisma as any)[modelName.toLowerCase()].findUnique({
                where: { id: args.where.id }
            });
        } catch (e) {
            // Continue without old value
        }
    }

    // Execute delete
    const result = await (prisma as any)[modelName.toLowerCase()].delete(args);

    // Log if applicable
    if (shouldLog(modelName)) {
        const context = getRequestContext();

        await logActivity({
            actorUserId: context?.userId || 'system',
            action: 'DELETE',
            targetTable: modelName,
            targetId: args.where?.id?.toString() || 'unknown',
            oldValue: sanitizeForLogging(oldValue || result),
            ipAddress: context?.ipAddress || 'unknown',
        }).catch(err => console.error('Activity log failed:', err));
    }

    return result;
}

/**
 * Logged Prisma Client
 * Wrapper object yang automatically logs CRUD operations
 * 
 * Usage:
 *   import { logged } from '@/utils/logged-prisma';
 *   
 *   // Instead of: prisma.user.create(...)
 *   // Use: logged.user.create(...)
 */
export const logged = new Proxy({} as any, {
    get(target, modelName: string) {
        return {
            create: (args: any) => loggedCreate(modelName.charAt(0).toUpperCase() + modelName.slice(1), args),
            update: (args: any) => loggedUpdate(modelName.charAt(0).toUpperCase() + modelName.slice(1), args),
            delete: (args: any) => loggedDelete(modelName.charAt(0).toUpperCase() + modelName.slice(1), args),
            // Pass-through untuk methods lain (findMany, findUnique, etc)
            findMany: (...args: any[]) => (prisma as any)[modelName].findMany(...args),
            findUnique: (...args: any[]) => (prisma as any)[modelName].findUnique(...args),
            findFirst: (...args: any[]) => (prisma as any)[modelName].findFirst(...args),
            count: (...args: any[]) => (prisma as any)[modelName].count(...args),
            // Add more as needed
        };
    }
});
