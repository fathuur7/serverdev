import type { Context } from "elysia";
import { attendanceService } from "../services/attendance/attendance.service"
import type { AttendanceStatus } from "@prisma/client";

export class AttendanceController {
    /**
     * POST /attendance/clock-in
     * Clock in for work
     */
    clockIn = async ({ body, userId, set }: Context & { userId?: string }) => {
        try {
            if (!userId) {
                set.status = 401;
                return { success: false, message: "Unauthorized" };
            }

            const {
                geoLat,
                geoLong,
                photoUrl,
                workOrderId,
                notes,
            } = body as {
                geoLat: number;
                geoLong: number;
                photoUrl?: string;
                workOrderId?: number;
                notes?: string;
            };

            if (!geoLat || !geoLong) {
                set.status = 400;
                return {
                    success: false,
                    message: "GPS coordinates (geoLat, geoLong) are required",
                };
            }

            const attendance = await attendanceService.clockIn({
                technicianId: userId,
                geoLat,
                geoLong,
                photoUrl,
                workOrderId,
                notes,
            });

            return {
                success: true,
                message: "Clocked in successfully",
                data: attendance,
            };
        } catch (error) {
            set.status = 400;
            return {
                success: false,
                message: (error as Error).message,
            };
        }
    };

    /**
     * POST /attendance/clock-out
     * Clock out from work
     */
    clockOut = async ({ body, userId, set }: Context & { userId?: string }) => {
        try {
            if (!userId) {
                set.status = 401;
                return { success: false, message: "Unauthorized" };
            }

            const {
                geoLat,
                geoLong,
                photoUrl,
                notes,
            } = body as {
                geoLat: number;
                geoLong: number;
                photoUrl?: string;
                notes?: string;
            };

            if (!geoLat || !geoLong) {
                set.status = 400;
                return {
                    success: false,
                    message: "GPS coordinates (geoLat, geoLong) are required",
                };
            }

            const attendance = await attendanceService.clockOut(userId, {
                geoLat,
                geoLong,
                photoUrl,
                notes,
            });

            return {
                success: true,
                message: "Clocked out successfully",
                data: attendance,
            };
        } catch (error) {
            set.status = 400;
            return {
                success: false,
                message: (error as Error).message,
            };
        }
    };

    /**
     * GET /attendance
     * Get all attendances with filters
     */
    getAll = async ({ query, set }: Context) => {
        try {
            const {
                technicianId,
                startDate,
                endDate,
                status,
                workOrderId,
                page,
                limit,
            } = query as any;

            const filters: any = {
                page: page ? parseInt(page) : 1,
                limit: limit ? parseInt(limit) : 10,
            };

            if (technicianId) filters.technicianId = technicianId;
            if (status) filters.status = status as AttendanceStatus;
            if (workOrderId) filters.workOrderId = parseInt(workOrderId);
            if (startDate) filters.startDate = new Date(startDate);
            if (endDate) filters.endDate = new Date(endDate);

            const result = await attendanceService.getAll(filters);

            return {
                success: true,
                ...result,
            };
        } catch (error) {
            set.status = 400;
            return {
                success: false,
                message: (error as Error).message,
            };
        }
    };

    /**
     * GET /attendance/:id
     * Get attendance by ID
     */
    getById = async ({ params, set }: Context) => {
        try {
            const id = parseInt((params as any).id);
            const attendance = await attendanceService.getById(id);

            return {
                success: true,
                data: attendance,
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
     * PATCH /attendance/:id/status
     * Update attendance status (admin only)
     */
    updateStatus = async ({ params, body, set }: Context) => {
        try {
            const id = parseInt((params as any).id);
            const { status, notes } = body as {
                status: AttendanceStatus;
                notes?: string;
            };

            if (!status) {
                set.status = 400;
                return {
                    success: false,
                    message: "Status is required",
                };
            }

            const attendance = await attendanceService.updateStatus(id, status, notes);

            return {
                success: true,
                message: "Attendance status updated",
                data: attendance,
            };
        } catch (error) {
            set.status = 400;
            return {
                success: false,
                message: (error as Error).message,
            };
        }
    };

    /**
     * GET /attendance/summary/:technicianId
     * Get attendance summary for a technician
     */
    getSummary = async ({ params, query, set }: Context) => {
        try {
            const technicianId = (params as any).technicianId;
            const { startDate, endDate } = query as any;

            if (!startDate || !endDate) {
                set.status = 400;
                return {
                    success: false,
                    message: "startDate and endDate are required",
                };
            }

            const summary = await attendanceService.getSummary(
                technicianId,
                new Date(startDate),
                new Date(endDate)
            );

            return {
                success: true,
                data: summary,
            };
        } catch (error) {
            set.status = 400;
            return {
                success: false,
                message: (error as Error).message,
            };
        }
    };

    /**
     * GET /attendance/today
     * Get today's attendance status for current user
     */
    getTodayStatus = async ({ userId, set }: Context & { userId?: string }) => {
        try {
            if (!userId) {
                set.status = 401;
                return { success: false, message: "Unauthorized" };
            }

            const attendance = await attendanceService.getTodayStatus(userId);

            return {
                success: true,
                data: attendance,
            };
        } catch (error) {
            set.status = 400;
            return {
                success: false,
                message: (error as Error).message,
            };
        }
    };
}

export const attendanceController = new AttendanceController();
