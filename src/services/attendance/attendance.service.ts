import prisma from "../../utils/prisma";
import type { AttendanceStatus } from "@prisma/client";
import type { ClockInData, ClockOutData, AttendanceFilters } from "../../types/attendance.types";

export class AttendanceService {
    /**
     * Clock In - Technician starts work
     */
    async clockIn(data: ClockInData) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if already clocked in today
        const existingAttendance = await prisma.attendance.findUnique({
            where: {
                technicianId_date: {
                    technicianId: data.technicianId,
                    date: today,
                },
            },
        });

        if (existingAttendance && existingAttendance.clockIn) {
            throw new Error("Already clocked in today");
        }

        const clockInTime = new Date();

        // Define work start time (e.g., 8:00 AM)
        const workStartTime = new Date(today);
        workStartTime.setHours(8, 0, 0, 0);

        const isLate = clockInTime > workStartTime;

        if (existingAttendance) {
            // Update existing PENDING attendance
            return await prisma.attendance.update({
                where: { id: existingAttendance.id },
                data: {
                    clockIn: clockInTime,
                    geoLatIn: data.geoLat,
                    geoLongIn: data.geoLong,
                    photoInUrl: data.photoUrl,
                    workOrderId: data.workOrderId,
                    notes: data.notes,
                    status: "CHECKED_IN",
                    isLate,
                },
                include: {
                    technician: {
                        select: {
                            fullName: true,
                            employeeId: true,
                        },
                    },
                    workOrder: true,
                },
            });
        }

        // Create new attendance
        return await prisma.attendance.create({
            data: {
                technicianId: data.technicianId,
                date: today,
                clockIn: clockInTime,
                geoLatIn: data.geoLat,
                geoLongIn: data.geoLong,
                photoInUrl: data.photoUrl,
                workOrderId: data.workOrderId,
                notes: data.notes,
                status: "CHECKED_IN",
                isLate,
            },
            include: {
                technician: {
                    select: {
                        fullName: true,
                        employeeId: true,
                    },
                },
                workOrder: true,
            },
        });
    }

    /**
     * Clock Out - Technician ends work
     */
    async clockOut(technicianId: string, data: ClockOutData) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await prisma.attendance.findUnique({
            where: {
                technicianId_date: {
                    technicianId,
                    date: today,
                },
            },
        });

        if (!attendance) {
            throw new Error("No clock-in record found for today");
        }

        if (!attendance.clockIn) {
            throw new Error("Must clock in before clocking out");
        }

        if (attendance.clockOut) {
            throw new Error("Already clocked out today");
        }

        const clockOutTime = new Date();

        // Calculate work duration in minutes
        const durationMs = clockOutTime.getTime() - attendance.clockIn.getTime();
        const durationMinutes = Math.floor(durationMs / (1000 * 60));

        return await prisma.attendance.update({
            where: { id: attendance.id },
            data: {
                clockOut: clockOutTime,
                geoLatOut: data.geoLat,
                geoLongOut: data.geoLong,
                photoOutUrl: data.photoUrl,
                workDuration: durationMinutes,
                status: "CHECKED_OUT",
                notes: data.notes || attendance.notes,
            },
            include: {
                technician: {
                    select: {
                        fullName: true,
                        employeeId: true,
                    },
                },
                workOrder: true,
            },
        });
    }

    /**
     * Get all attendances with filters
     */
    async getAll(filters: AttendanceFilters) {
        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (filters.technicianId) {
            where.technicianId = filters.technicianId;
        }

        if (filters.status) {
            where.status = filters.status;
        }

        if (filters.workOrderId) {
            where.workOrderId = filters.workOrderId;
        }

        if (filters.startDate || filters.endDate) {
            where.date = {};
            if (filters.startDate) {
                where.date.gte = filters.startDate;
            }
            if (filters.endDate) {
                where.date.lte = filters.endDate;
            }
        }

        const [attendances, total] = await Promise.all([
            prisma.attendance.findMany({
                where,
                skip,
                take: limit,
                orderBy: { date: "desc" },
                include: {
                    technician: {
                        select: {
                            fullName: true,
                            employeeId: true,
                            phoneNumber: true,
                        },
                    },
                    workOrder: {
                        select: {
                            id: true,
                            woType: true,
                            status: true,
                        },
                    },
                },
            }),
            prisma.attendance.count({ where }),
        ]);

        return {
            data: attendances,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Get attendance by ID
     */
    async getById(id: number) {
        const attendance = await prisma.attendance.findUnique({
            where: { id },
            include: {
                technician: true,
                workOrder: true,
            },
        });

        if (!attendance) {
            throw new Error("Attendance not found");
        }

        return attendance;
    }

    /**
     * Update attendance status (for manual corrections)
     */
    async updateStatus(id: number, status: AttendanceStatus, notes?: string) {
        return await prisma.attendance.update({
            where: { id },
            data: {
                status,
                notes,
            },
            include: {
                technician: {
                    select: {
                        fullName: true,
                        employeeId: true,
                    },
                },
            },
        });
    }

    /**
     * Get attendance summary for a technician
     */
    async getSummary(technicianId: string, startDate: Date, endDate: Date) {
        const attendances = await prisma.attendance.findMany({
            where: {
                technicianId,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });

        const summary = {
            totalDays: attendances.length,
            checkedIn: attendances.filter((a) => a.status === "CHECKED_IN" || a.status === "CHECKED_OUT").length,
            checkedOut: attendances.filter((a) => a.status === "CHECKED_OUT").length,
            lateCount: attendances.filter((a) => a.isLate).length,
            absent: attendances.filter((a) => a.status === "ABSENT").length,
            sickLeave: attendances.filter((a) => a.status === "SICK_LEAVE").length,
            permission: attendances.filter((a) => a.status === "PERMISSION").length,
            totalWorkMinutes: attendances.reduce((sum, a) => sum + (a.workDuration || 0), 0),
            totalWorkHours: 0,
        };

        summary.totalWorkHours = Math.round((summary.totalWorkMinutes / 60) * 10) / 10;

        return summary;
    }

    /**
     * Get today's attendance status for a technician
     */
    async getTodayStatus(technicianId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return await prisma.attendance.findUnique({
            where: {
                technicianId_date: {
                    technicianId,
                    date: today,
                },
            },
            include: {
                workOrder: {
                    select: {
                        id: true,
                        woType: true,
                        status: true,
                    },
                },
            },
        });
    }
}

export const attendanceService = new AttendanceService();
