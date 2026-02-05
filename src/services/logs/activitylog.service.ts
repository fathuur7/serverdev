import prisma from "../../utils/prisma";
import type { CreateActivityLogData, ActivityLogFilters } from "../../types/activitylog.types";

export class ActivityLogService {
    /**
     * Create activity log (internal use)
     */
    async create(data: CreateActivityLogData) {
        return await prisma.activityLog.create({
            data: {
                actorUserId: data.actorUserId,
                action: data.action,
                targetTable: data.targetTable,
                targetId: data.targetId,
                oldValue: data.oldValue || null,
                newValue: data.newValue || null,
                ipAddress: data.ipAddress,
            },
            include: {
                actor: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });
    }

    /**
     * Get all activity logs with filters
     */
    async getAll(filters: ActivityLogFilters) {
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (filters.actorUserId) {
            where.actorUserId = filters.actorUserId;
        }

        if (filters.action) {
            where.action = filters.action;
        }

        if (filters.targetTable) {
            where.targetTable = filters.targetTable;
        }

        if (filters.targetId) {
            where.targetId = filters.targetId;
        }

        if (filters.startDate || filters.endDate) {
            where.timestamp = {};
            if (filters.startDate) {
                where.timestamp.gte = filters.startDate;
            }
            if (filters.endDate) {
                where.timestamp.lte = filters.endDate;
            }
        }

        const [logs, total] = await Promise.all([
            prisma.activityLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { timestamp: "desc" },
                include: {
                    actor: {
                        select: {
                            id: true,
                            email: true,
                            role: true,
                        },
                    },
                },
            }),
            prisma.activityLog.count({ where }),
        ]);

        return {
            data: logs,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Get activity log by ID
     */
    async getById(id: number) {
        const log = await prisma.activityLog.findUnique({
            where: { id },
            include: {
                actor: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        if (!log) {
            throw new Error("Activity log not found");
        }

        return log;
    }

    /**
     * Get recent activity (last N logs)
     */
    async getRecent(limit: number = 50) {
        return await prisma.activityLog.findMany({
            take: limit,
            orderBy: { timestamp: "desc" },
            include: {
                actor: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });
    }

    /**
     * Get activity logs by user
     */
    async getByUser(userId: string, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            prisma.activityLog.findMany({
                where: { actorUserId: userId },
                skip,
                take: limit,
                orderBy: { timestamp: "desc" },
            }),
            prisma.activityLog.count({ where: { actorUserId: userId } }),
        ]);

        return {
            data: logs,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Get activity logs by target (table + id)
     */
    async getByTarget(
        targetTable: string,
        targetId: string,
        page: number = 1,
        limit: number = 20
    ) {
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            prisma.activityLog.findMany({
                where: {
                    targetTable,
                    targetId,
                },
                skip,
                take: limit,
                orderBy: { timestamp: "desc" },
                include: {
                    actor: {
                        select: {
                            id: true,
                            email: true,
                            role: true,
                        },
                    },
                },
            }),
            prisma.activityLog.count({ where: { targetTable, targetId } }),
        ]);

        return {
            data: logs,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Get action statistics
     */
    async getActionStats(startDate?: Date, endDate?: Date) {
        const where: any = {};

        if (startDate || endDate) {
            where.timestamp = {};
            if (startDate) where.timestamp.gte = startDate;
            if (endDate) where.timestamp.lte = endDate;
        }

        const stats = await prisma.activityLog.groupBy({
            by: ["action"],
            where,
            _count: {
                id: true,
            },
            orderBy: {
                _count: {
                    id: "desc",
                },
            },
        });

        return stats.map((stat) => ({
            action: stat.action,
            count: stat._count.id || 0,
        }));
    }

    /**
     * Get user activity statistics
     */
    async getUserStats(startDate?: Date, endDate?: Date) {
        const where: any = {};

        if (startDate || endDate) {
            where.timestamp = {};
            if (startDate) where.timestamp.gte = startDate;
            if (endDate) where.timestamp.lte = endDate;
        }

        const stats = await prisma.activityLog.groupBy({
            by: ["actorUserId"],
            where,
            _count: {
                id: true,
            },
            orderBy: {
                _count: {
                    id: "desc",
                },
            },
            take: 10,
        });

        // Get user details
        const userIds = stats.map((s) => s.actorUserId);
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, email: true, role: true },
        });

        const userMap = new Map(users.map((u) => [u.id, u]));

        return stats.map((stat) => ({
            user: userMap.get(stat.actorUserId),
            activityCount: stat._count.id || 0,
        }));
    }
}

export const activityLogService = new ActivityLogService();

/**
 * Helper function to log activity
 */
export async function logActivity(data: CreateActivityLogData) {
    return await activityLogService.create(data);
}
