import { Elysia, t } from "elysia";
import { TechnicianService } from "../services/technicians/technician.service";
import { jwtPlugin, deriveUser, adminOnly, adminOrTechnician, authenticated } from "../middlewares/auth.middleware";

const technicianService = new TechnicianService();

// Guard for technician only
const technicianOnly = ({ userId, role, set }: any) => {
    if (!userId) {
        set.status = 401;
        return { success: false, message: "Unauthorized" };
    }
    if (role !== "TECHNICIAN") {
        set.status = 403;
        return { success: false, message: "Forbidden: Technician only" };
    }
};

export const technicianRoutes = new Elysia({ prefix: "/technicians" })
    .use(jwtPlugin)
    .derive(deriveUser)

    // Create technician (Admin only)
    .post(
        "/",
        async ({ body, set }: any) => {
            try {
                const result = await technicianService.create(body);
                set.status = 201;
                return {
                    success: true,
                    message: "Technician created successfully",
                    data: {
                        id: result.technician.id,
                        employeeId: result.technician.employeeId,
                        fullName: result.technician.fullName,
                        email: result.user.email,
                    }
                };
            } catch (error: any) {
                set.status = 400;
                return {
                    success: false,
                    message: error.message || "Failed to create technician"
                };
            }
        },
        {
            beforeHandle: adminOnly,
            body: t.Object({
                email: t.String({ format: "email" }),
                password: t.String({ minLength: 6 }),
                employeeId: t.String({ minLength: 1 }),
                fullName: t.String({ minLength: 1 }),
                phoneNumber: t.String({ minLength: 10 }),
                specialization: t.String({ minLength: 1 }),
            }),
        }
    )

    // Get all technicians (Admin only)
    .get(
        "/",
        async ({ set }: any) => {
            try {
                const technicians = await technicianService.getAll();
                return {
                    success: true,
                    data: technicians
                };
            } catch (error: any) {
                set.status = 500;
                return {
                    success: false,
                    message: error.message
                };
            }
        },
        {
            beforeHandle: adminOnly,
        }
    )

    // Get available technicians (Admin only)
    .get(
        "/available",
        async ({ set }: any) => {
            try {
                const technicians = await technicianService.getAvailable();
                return {
                    success: true,
                    data: technicians
                };
            } catch (error: any) {
                set.status = 500;
                return {
                    success: false,
                    message: error.message
                };
            }
        },
        {
            beforeHandle: adminOnly,
        }
    )

    // Get my profile (Technician only)
    .get(
        "/me",
        async ({ userId, set }: any) => {
            try {
                const technician = await technicianService.getByUserId(userId);
                if (!technician) {
                    set.status = 404;
                    return {
                        success: false,
                        message: "Technician profile not found"
                    };
                }
                return {
                    success: true,
                    data: technician
                };
            } catch (error: any) {
                set.status = 500;
                return {
                    success: false,
                    message: error.message
                };
            }
        },
        {
            beforeHandle: technicianOnly,
        }
    )

    // Get technician by ID (Admin only)
    .get(
        "/:id",
        async ({ params, set }: any) => {
            try {
                const technician = await technicianService.getById(params.id);
                if (!technician) {
                    set.status = 404;
                    return {
                        success: false,
                        message: "Technician not found"
                    };
                }
                return {
                    success: true,
                    data: technician
                };
            } catch (error: any) {
                set.status = 500;
                return {
                    success: false,
                    message: error.message
                };
            }
        },
        {
            beforeHandle: adminOnly,
            params: t.Object({
                id: t.String(),
            }),
        }
    )

    // Update technician (Admin only)
    .put(
        "/:id",
        async ({ params, body, set }: any) => {
            try {
                const technician = await technicianService.update(params.id, body);
                return {
                    success: true,
                    message: "Technician updated successfully",
                    data: technician
                };
            } catch (error: any) {
                set.status = 400;
                return {
                    success: false,
                    message: error.message
                };
            }
        },
        {
            beforeHandle: adminOnly,
            params: t.Object({
                id: t.String(),
            }),
            body: t.Object({
                fullName: t.Optional(t.String()),
                phoneNumber: t.Optional(t.String()),
                specialization: t.Optional(t.String()),
                currentStatus: t.Optional(t.Union([
                    t.Literal("IDLE"),
                    t.Literal("ON_JOB"),
                    t.Literal("OFF_DUTY"),
                ])),
            }),
        }
    )

    // Update my status (Technician only)
    .patch(
        "/me/status",
        async ({ userId, body, set }: any) => {
            try {
                const technician = await technicianService.getByUserId(userId);
                if (!technician) {
                    set.status = 404;
                    return {
                        success: false,
                        message: "Technician profile not found"
                    };
                }

                const updated = await technicianService.updateStatus(technician.id, body.status);
                return {
                    success: true,
                    message: "Status updated successfully",
                    data: { status: updated.currentStatus }
                };
            } catch (error: any) {
                set.status = 400;
                return {
                    success: false,
                    message: error.message
                };
            }
        },
        {
            beforeHandle: technicianOnly,
            body: t.Object({
                status: t.Union([
                    t.Literal("IDLE"),
                    t.Literal("ON_JOB"),
                    t.Literal("OFF_DUTY"),
                ]),
            }),
        }
    );
