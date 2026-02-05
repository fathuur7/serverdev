import { Elysia, t } from "elysia";
import { WorkOrderService } from "../services/workorders/workorder.service";
import { jwtPlugin, deriveUser, adminOnly, adminOrTechnician } from "../middlewares/auth.middleware";
import prisma from "../utils/prisma";

const workOrderService = new WorkOrderService();

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

// Helper to serialize BigInt
const serializeWorkOrder = (wo: any) => {
    if (!wo) return null;
    return {
        ...wo,
        id: wo.id.toString(),
    };
};

export const workOrderRoutes = new Elysia({ prefix: "/work-orders" })
    .use(jwtPlugin)
    .derive(deriveUser)

    // Create work order (Admin only)
    .post(
        "/",
        async ({ body, set }: any) => {
            try {
                const result = await workOrderService.create({
                    ...body,
                    scheduledTime: new Date(body.scheduledTime),
                });
                set.status = 201;
                return {
                    success: true,
                    message: "Work order created successfully",
                    data: serializeWorkOrder(result)
                };
            } catch (error: any) {
                set.status = 400;
                return {
                    success: false,
                    message: error.message || "Failed to create work order"
                };
            }
        },
        {
            beforeHandle: adminOnly,
            body: t.Object({
                subscriptionId: t.String(),
                ticketId: t.Optional(t.String()),
                woType: t.Union([
                    t.Literal("NEW_INSTALLATION"),
                    t.Literal("REPAIR"),
                    t.Literal("DISMANTLE"),
                ]),
                scheduledTime: t.String(), // ISO date string
                technicianId: t.Optional(t.String()),
            }),
        }
    )

    // Get all work orders (Admin only)
    .get(
        "/",
        async ({ query, set }: any) => {
            try {
                const workOrders = await workOrderService.getAll({
                    status: query.status,
                    technicianId: query.technicianId,
                    woType: query.woType,
                });
                return {
                    success: true,
                    data: workOrders.map(serializeWorkOrder)
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
            query: t.Object({
                status: t.Optional(t.String()),
                technicianId: t.Optional(t.String()),
                woType: t.Optional(t.String()),
            }),
        }
    )

    // Get my work orders (Technician only)
    .get(
        "/my",
        async ({ userId, query, set }: any) => {
            try {
                // Get technician profile from userId
                const technician = await prisma.technicianProfile.findUnique({
                    where: { userId }
                });
                if (!technician) {
                    set.status = 404;
                    return {
                        success: false,
                        message: "Technician profile not found"
                    };
                }

                const workOrders = await workOrderService.getMyWorkOrders(
                    technician.id,
                    query.status
                );
                return {
                    success: true,
                    data: workOrders.map(serializeWorkOrder)
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
            query: t.Object({
                status: t.Optional(t.String()),
            }),
        }
    )

    // Get work order by ID (Admin or Technician)
    .get(
        "/:id",
        async ({ params, set }: any) => {
            try {
                const workOrder = await workOrderService.getById(params.id);
                if (!workOrder) {
                    set.status = 404;
                    return {
                        success: false,
                        message: "Work order not found"
                    };
                }
                return {
                    success: true,
                    data: serializeWorkOrder(workOrder)
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
            beforeHandle: adminOrTechnician,
            params: t.Object({
                id: t.String(),
            }),
        }
    )

    // Assign technician to work order (Admin only)
    .patch(
        "/:id/assign",
        async ({ params, body, set }: any) => {
            try {
                const result = await workOrderService.assignTechnician(params.id, body.technicianId);
                return {
                    success: true,
                    message: "Technician assigned successfully",
                    data: serializeWorkOrder(result)
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
                technicianId: t.String(),
            }),
        }
    )

    // Start work (Technician only)
    .patch(
        "/:id/start",
        async ({ params, userId, set }: any) => {
            try {
                const technician = await prisma.technicianProfile.findUnique({
                    where: { userId }
                });
                if (!technician) {
                    set.status = 404;
                    return {
                        success: false,
                        message: "Technician profile not found"
                    };
                }

                const result = await workOrderService.startWork(params.id, technician.id);
                return {
                    success: true,
                    message: "Work started",
                    data: serializeWorkOrder(result)
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
            params: t.Object({
                id: t.String(),
            }),
        }
    )

    // Complete work (Technician only)
    .patch(
        "/:id/complete",
        async ({ params, body, userId, set }: any) => {
            try {
                const technician = await prisma.technicianProfile.findUnique({
                    where: { userId }
                });
                if (!technician) {
                    set.status = 404;
                    return {
                        success: false,
                        message: "Technician profile not found"
                    };
                }

                const result = await workOrderService.completeWork(
                    params.id,
                    technician.id,
                    body.customerSignatureUrl
                );
                return {
                    success: true,
                    message: "Work completed successfully",
                    data: serializeWorkOrder(result)
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
            params: t.Object({
                id: t.String(),
            }),
            body: t.Object({
                customerSignatureUrl: t.Optional(t.String()),
            }),
        }
    )

    // Fail work (Technician only)
    .patch(
        "/:id/fail",
        async ({ params, userId, set }: any) => {
            try {
                const technician = await prisma.technicianProfile.findUnique({
                    where: { userId }
                });
                if (!technician) {
                    set.status = 404;
                    return {
                        success: false,
                        message: "Technician profile not found"
                    };
                }

                const result = await workOrderService.failWork(params.id, technician.id);
                return {
                    success: true,
                    message: "Work order marked as failed",
                    data: serializeWorkOrder(result)
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
            params: t.Object({
                id: t.String(),
            }),
        }
    )

    // Update work order (Admin only)
    .put(
        "/:id",
        async ({ params, body, set }: any) => {
            try {
                const result = await workOrderService.update(params.id, {
                    ...body,
                    scheduledTime: body.scheduledTime ? new Date(body.scheduledTime) : undefined,
                });
                return {
                    success: true,
                    message: "Work order updated",
                    data: serializeWorkOrder(result)
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
                technicianId: t.Optional(t.String()),
                scheduledTime: t.Optional(t.String()),
                status: t.Optional(t.Union([
                    t.Literal("DRAFT"),
                    t.Literal("ASSIGNED"),
                    t.Literal("IN_PROGRESS"),
                    t.Literal("COMPLETED"),
                    t.Literal("FAILED"),
                ])),
                customerSignatureUrl: t.Optional(t.String()),
            }),
        }
    );
