import type { AttendanceStatus } from "@prisma/client";

export interface ClockInData {
    technicianId: string;
    geoLat: number;
    geoLong: number;
    photoUrl?: string;
    workOrderId?: number;
    notes?: string;
}

export interface ClockOutData {
    geoLat: number;
    geoLong: number;
    photoUrl?: string;
    notes?: string;
}

export interface AttendanceFilters {
    technicianId?: string;
    startDate?: Date;
    endDate?: Date;
    status?: AttendanceStatus;
    workOrderId?: number;
    page?: number;
    limit?: number;
}
