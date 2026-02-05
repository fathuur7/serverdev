import type { Context } from "elysia";
import { activityLogService } from "../services/logs/activitylog.service";

export class ActivityLogController {
    /**
     * GET /activity-logs
     * Get all activity logs with filters
     */
    getAll = async ({ query, set }: Context) => {
        try {
            const {
                actorUserId,
                action,
                targetTable,
                targetId,
                startDate,
                endDate,
                page,
                limit,
            } = query as any;

            const filters: any = {
                page: page ? parseInt(page) : 1,
                limit: limit ? parseInt(limit) : 20,
            };

            if (actorUserId) filters.actorUserId = actorUserId;
            if (action) filters.action = action;
            if (targetTable) filters.targetTable = targetTable;
            if (targetId) filters.targetId = targetId;
            if (startDate) filters.startDate = new Date(startDate);
            if (endDate) filters.endDate = new Date(endDate);

            const result = await activityLogService.getAll(filters);

            return {
                success: true,
                ...result,
            };
        } catch (error) {
            set.status = 500;
            return {
                success: false,
                message: (error as Error).message,
            };
        }
    };

    /**
     * GET /activity-logs/:id
     * Get activity log by ID
     */
    getById = async ({ params, set }: Context) => {
        try {
            const id = parseInt((params as any).id);
            const log = await activityLogService.getById(id);

            return {
                success: true,
                data: log,
            };
        } catch (error) {
            set.status = 404;
            return {
                success: false,
                message: (error as Error).message,
            };
        }
    };

    /**
     * GET /activity-logs/recent
     * Get recent activity logs
     */
    getRecent = async ({ query, set }: Context) => {
        try {
            const { limit } = query as any;
            const logs = await activityLogService.getRecent(
                limit ? parseInt(limit) : 50
            );

            return {
                success: true,
                data: logs,
            };
        } catch (error) {
            set.status = 500;
            return {
                success: false,
                message: (error as Error).message,
            };
        }
    };

    /**
     * GET /activity-logs/user/:userId
     * Get activity logs by user
     */
    getByUser = async ({ params, query, set }: Context) => {
        try {
            const userId = (params as any).userId;
            const { page, limit } = query as any;

            const result = await activityLogService.getByUser(
                userId,
                page ? parseInt(page) : 1,
                limit ? parseInt(limit) : 20
            );

            return {
                success: true,
                ...result,
            };
        } catch (error) {
            set.status = 500;
            return {
                success: false,
                message: (error as Error).message,
            };
        }
    };

    /**
     * GET /activity-logs/target/:table/:id
     * Get activity logs by target
     */
    getByTarget = async ({ params, query, set }: Context) => {
        try {
            const { table, id } = params as any;
            const { page, limit } = query as any;

            const result = await activityLogService.getByTarget(
                table,
                id,
                page ? parseInt(page) : 1,
                limit ? parseInt(limit) : 20
            );

            return {
                success: true,
                ...result,
            };
        } catch (error) {
            set.status = 500;
            return {
                success: false,
                message: (error as Error).message,
            };
        }
    };

    /**
     * GET /activity-logs/stats/actions
     * Get action statistics
     */
    getActionStats = async ({ query, set }: Context) => {
        try {
            const { startDate, endDate } = query as any;

            const stats = await activityLogService.getActionStats(
                startDate ? new Date(startDate) : undefined,
                endDate ? new Date(endDate) : undefined
            );

            return {
                success: true,
                data: stats,
            };
        } catch (error) {
            set.status = 500;
            return {
                success: false,
                message: (error as Error).message,
            };
        }
    };

    /**
     * GET /activity-logs/stats/users
     * Get user activity statistics
     */
    getUserStats = async ({ query, set }: Context) => {
        try {
            const { startDate, endDate } = query as any;

            const stats = await activityLogService.getUserStats(
                startDate ? new Date(startDate) : undefined,
                endDate ? new Date(endDate) : undefined
            );

            return {
                success: true,
                data: stats,
            };
        } catch (error) {
            set.status = 500;
            return {
                success: false,
                message: (error as Error).message,
            };
        }
    };
}

export const activityLogController = new ActivityLogController();
