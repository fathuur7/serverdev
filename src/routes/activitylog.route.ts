import { Elysia, t } from "elysia";
import { activityLogController } from "../controllers/activitylog.controller";
import { jwtPlugin, deriveUser, adminOnly } from "../middlewares/auth.middleware";

export const activityLogRoutes = new Elysia({ prefix: "/activity-logs" })
    .use(jwtPlugin)
    .derive(deriveUser)
    /**
     * GET /activity-logs
     * Get all activity logs with filters
     */
    .get("/", activityLogController.getAll, {
        beforeHandle: adminOnly,
        query: t.Optional(
            t.Object({
                actorUserId: t.Optional(t.String()),
                action: t.Optional(t.String()),
                targetTable: t.Optional(t.String()),
                targetId: t.Optional(t.String()),
                startDate: t.Optional(t.String()),
                endDate: t.Optional(t.String()),
                page: t.Optional(t.String()),
                limit: t.Optional(t.String()),
            })
        ),
        detail: {
            tags: ["Activity Logs"],
            summary: "Get all activity logs",
            description: "Get activity logs with optional filters (Admin only)",
        },
    })

    /**
     * GET /activity-logs/recent
     * Get recent activity logs
     */
    .get("/recent", activityLogController.getRecent, {
        beforeHandle: adminOnly,
        query: t.Optional(
            t.Object({
                limit: t.Optional(t.String()),
            })
        ),
        detail: {
            tags: ["Activity Logs"],
            summary: "Get recent activity logs",
            description: "Get most recent activity logs (Admin only)",
        },
    })

    /**
     * GET /activity-logs/stats/actions
     * Get action statistics
     */
    .get("/stats/actions", activityLogController.getActionStats, {
        beforeHandle: adminOnly,
        query: t.Optional(
            t.Object({
                startDate: t.Optional(t.String()),
                endDate: t.Optional(t.String()),
            })
        ),
        detail: {
            tags: ["Activity Logs"],
            summary: "Get action statistics",
            description: "Get statistics grouped by action type (Admin only)",
        },
    })

    /**
     * GET /activity-logs/stats/users
     * Get user activity statistics
     */
    .get("/stats/users", activityLogController.getUserStats, {
        beforeHandle: adminOnly,
        query: t.Optional(
            t.Object({
                startDate: t.Optional(t.String()),
                endDate: t.Optional(t.String()),
            })
        ),
        detail: {
            tags: ["Activity Logs"],
            summary: "Get user activity statistics",
            description: "Get top 10 most active users (Admin only)",
        },
    })

    /**
     * GET /activity-logs/:id
     * Get activity log by ID
     */
    .get("/:id", activityLogController.getById, {
        beforeHandle: adminOnly,
        params: t.Object({
            id: t.String(),
        }),
        detail: {
            tags: ["Activity Logs"],
            summary: "Get activity log by ID",
            description: "Get detailed activity log by ID (Admin only)",
        },
    })

    /**
     * GET /activity-logs/user/:userId
     * Get activity logs by user
     */
    .get("/user/:userId", activityLogController.getByUser, {
        beforeHandle: adminOnly,
        params: t.Object({
            userId: t.String(),
        }),
        query: t.Optional(
            t.Object({
                page: t.Optional(t.String()),
                limit: t.Optional(t.String()),
            })
        ),
        detail: {
            tags: ["Activity Logs"],
            summary: "Get activity logs by user",
            description: "Get all activity logs for a specific user (Admin only)",
        },
    })

    /**
     * GET /activity-logs/target/:table/:id
     * Get activity logs by target
     */
    .get("/target/:table/:id", activityLogController.getByTarget, {
        beforeHandle: adminOnly,
        params: t.Object({
            table: t.String(),
            id: t.String(),
        }),
        query: t.Optional(
            t.Object({
                page: t.Optional(t.String()),
                limit: t.Optional(t.String()),
            })
        ),
        detail: {
            tags: ["Activity Logs"],
            summary: "Get activity logs by target",
            description:
                "Get all activity logs for a specific record (e.g., subscriptions/123) (Admin only)",
        },
    });
