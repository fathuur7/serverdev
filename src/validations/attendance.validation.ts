import { t } from "elysia";

// Clock In validation
export const clockInSchema = t.Object({
    geoLat: t.Number(),
    geoLong: t.Number(),
    photoUrl: t.Optional(t.String()),
    workOrderId: t.Optional(t.Number()),
    notes: t.Optional(t.String()),
});

// Clock Out validation
export const clockOutSchema = t.Object({
    geoLat: t.Number(),
    geoLong: t.Number(),
    photoUrl: t.Optional(t.String()),
    notes: t.Optional(t.String()),
});

// Get All Attendances Query Filters
export const attendanceFiltersSchema = t.Optional(
    t.Object({
        technicianId: t.Optional(t.String()),
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
        status: t.Optional(t.String()),
        workOrderId: t.Optional(t.String()),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
    })
);

// ID Param validation
export const attendanceIdParamSchema = t.Object({
    id: t.String(),
});

// Technician ID Param validation
export const technicianIdParamSchema = t.Object({
    technicianId: t.String(),
});

// Update Status validation
export const updateAttendanceStatusSchema = t.Object({
    status: t.String(),
    notes: t.Optional(t.String()),
});

// Summary Query validation
export const summaryQuerySchema = t.Object({
    startDate: t.String(),
    endDate: t.String(),
});
