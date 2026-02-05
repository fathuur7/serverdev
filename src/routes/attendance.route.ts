import { Elysia, t } from "elysia";
import { attendanceController } from "../controllers/attendance.controller";
import { adminOnly, technicianOnly } from "../middlewares/auth.middleware";

export const attendanceRoute = new Elysia({ prefix: "/attendance" })
    /**
     * POST /attendance/clock-in
     * Clock in for work (Technician only)
     */
    .post("/clock-in", attendanceController.clockIn, {
        beforeHandle: technicianOnly,
        body: t.Object({
            geoLat: t.Number(),
            geoLong: t.Number(),
            photoUrl: t.Optional(t.String()),
            workOrderId: t.Optional(t.Number()),
            notes: t.Optional(t.String()),
        }),
        detail: {
            tags: ["Attendance"],
            summary: "Clock in for work",
            description: "Technician clocks in with GPS location and optional photo",
        },
    })

    /**
     * POST /attendance/clock-out
     * Clock out from work (Technician only)
     */
    .post("/clock-out", attendanceController.clockOut, {
        beforeHandle: technicianOnly,
        body: t.Object({
            geoLat: t.Number(),
            geoLong: t.Number(),
            photoUrl: t.Optional(t.String()),
            notes: t.Optional(t.String()),
        }),
        detail: {
            tags: ["Attendance"],
            summary: "Clock out from work",
            description: "Technician clocks out with GPS location and optional photo",
        },
    })

    /**
     * GET /attendance/today
     * Get today's attendance status (Technician only)
     */
    .get("/today", attendanceController.getTodayStatus, {
        beforeHandle: technicianOnly,
        detail: {
            tags: ["Attendance"],
            summary: "Get today's attendance status",
            description: "Get current user's attendance status for today",
        },
    })

    /**
     * GET /attendance
     * Get all attendances with filters (Admin only)
     */
    .get("/", attendanceController.getAll, {
        beforeHandle: adminOnly,
        query: t.Optional(
            t.Object({
                technicianId: t.Optional(t.String()),
                startDate: t.Optional(t.String()),
                endDate: t.Optional(t.String()),
                status: t.Optional(t.String()),
                workOrderId: t.Optional(t.String()),
                page: t.Optional(t.String()),
                limit: t.Optional(t.String()),
            })
        ),
        detail: {
            tags: ["Attendance"],
            summary: "Get all attendances",
            description: "Get all attendance records with optional filters (Admin only)",
        },
    })

    /**
     * GET /attendance/:id
     * Get attendance by ID (Admin only)
     */
    .get("/:id", attendanceController.getById, {
        beforeHandle: adminOnly,
        params: t.Object({
            id: t.String(),
        }),
        detail: {
            tags: ["Attendance"],
            summary: "Get attendance by ID",
            description: "Get detailed attendance record by ID (Admin only)",
        },
    })

    /**
     * PATCH /attendance/:id/status
     * Update attendance status (Admin only)
     */
    .patch("/:id/status", attendanceController.updateStatus, {
        beforeHandle: adminOnly,
        params: t.Object({
            id: t.String(),
        }),
        body: t.Object({
            status: t.String(),
            notes: t.Optional(t.String()),
        }),
        detail: {
            tags: ["Attendance"],
            summary: "Update attendance status",
            description: "Update attendance status manually (Admin only)",
        },
    })

    /**
     * GET /attendance/summary/:technicianId
     * Get attendance summary (Admin only)
     */
    .get("/summary/:technicianId", attendanceController.getSummary, {
        beforeHandle: adminOnly,
        params: t.Object({
            technicianId: t.String(),
        }),
        query: t.Object({
            startDate: t.String(),
            endDate: t.String(),
        }),
        detail: {
            tags: ["Attendance"],
            summary: "Get attendance summary",
            description: "Get attendance summary for a technician within date range (Admin only)",
        },
    });
