import { Elysia, t } from "elysia";
import { TicketService } from "../services/tickets/ticket.service";
import { jwtPlugin, deriveUser, adminOnly, authenticated } from "../middlewares/auth.middleware";

const ticketService = new TicketService();

// Helper to serialize BigInt in work orders
const serializeTicket = (ticket: any) => {
    if (!ticket) return null;
    return {
        ...ticket,
        workOrders: ticket.workOrders?.map((wo: any) => ({
            ...wo,
            id: wo.id.toString(),
        }))
    };
};

export const ticketRoutes = new Elysia({ prefix: "/tickets" })
    .use(jwtPlugin)
    .derive(deriveUser)

    // Create ticket (Customer or Admin)
    .post(
        "/",
        async ({ userId, body, set }: any) => {
            try {
                const result = await ticketService.create(userId, body);
                set.status = 201;
                return {
                    success: true,
                    message: "Ticket created successfully",
                    data: serializeTicket(result)
                };
            } catch (error: any) {
                set.status = 400;
                return {
                    success: false,
                    message: error.message || "Failed to create ticket"
                };
            }
        },
        {
            beforeHandle: authenticated,
            body: t.Object({
                subscriptionId: t.String(),
                category: t.Union([
                    t.Literal("NO_INTERNET"),
                    t.Literal("SLOW_CONNECTION"),
                    t.Literal("BILLING_ISSUE"),
                    t.Literal("REQUEST_MOVE"),
                ]),
                priority: t.Union([
                    t.Literal("LOW"),
                    t.Literal("MEDIUM"),
                    t.Literal("HIGH"),
                    t.Literal("CRITICAL"),
                ]),
                subject: t.String({ minLength: 1 }),
                description: t.String({ minLength: 1 }),
            }),
        }
    )

    // Get all tickets (Admin only)
    .get(
        "/",
        async ({ query, set }: any) => {
            try {
                const tickets = await ticketService.getAll({
                    status: query.status,
                    category: query.category,
                    priority: query.priority,
                });
                return {
                    success: true,
                    data: tickets.map(serializeTicket)
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
                category: t.Optional(t.String()),
                priority: t.Optional(t.String()),
            }),
        }
    )

    // Get ticket statistics (Admin only)
    .get(
        "/stats",
        async ({ set }: any) => {
            try {
                const stats = await ticketService.getStats();
                return {
                    success: true,
                    data: stats
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

    // Get my tickets (Customer)
    .get(
        "/my",
        async ({ userId, query, set }: any) => {
            try {
                const tickets = await ticketService.getMyTickets(userId, query.status);
                return {
                    success: true,
                    data: tickets.map(serializeTicket)
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
            beforeHandle: authenticated,
            query: t.Object({
                status: t.Optional(t.String()),
            }),
        }
    )

    // Get ticket by ID (Admin or ticket owner)
    .get(
        "/:id",
        async ({ params, set }: any) => {
            try {
                const ticket = await ticketService.getById(params.id);
                if (!ticket) {
                    set.status = 404;
                    return {
                        success: false,
                        message: "Ticket not found"
                    };
                }
                return {
                    success: true,
                    data: serializeTicket(ticket)
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
            beforeHandle: authenticated,
            params: t.Object({
                id: t.String(),
            }),
        }
    )

    // Update ticket status (Admin only)
    .patch(
        "/:id/status",
        async ({ params, body, set }: any) => {
            try {
                const result = await ticketService.updateStatus(params.id, body.status);
                return {
                    success: true,
                    message: "Ticket status updated",
                    data: serializeTicket(result)
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
                status: t.Union([
                    t.Literal("OPEN"),
                    t.Literal("IN_PROGRESS"),
                    t.Literal("WAITING_CUSTOMER"),
                    t.Literal("RESOLVED"),
                    t.Literal("CLOSED"),
                ]),
            }),
        }
    )

    // Update ticket (Admin only)
    .put(
        "/:id",
        async ({ params, body, set }: any) => {
            try {
                const result = await ticketService.update(params.id, body);
                return {
                    success: true,
                    message: "Ticket updated",
                    data: serializeTicket(result)
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
                category: t.Optional(t.Union([
                    t.Literal("NO_INTERNET"),
                    t.Literal("SLOW_CONNECTION"),
                    t.Literal("BILLING_ISSUE"),
                    t.Literal("REQUEST_MOVE"),
                ])),
                priority: t.Optional(t.Union([
                    t.Literal("LOW"),
                    t.Literal("MEDIUM"),
                    t.Literal("HIGH"),
                    t.Literal("CRITICAL"),
                ])),
                subject: t.Optional(t.String()),
                description: t.Optional(t.String()),
                status: t.Optional(t.Union([
                    t.Literal("OPEN"),
                    t.Literal("IN_PROGRESS"),
                    t.Literal("WAITING_CUSTOMER"),
                    t.Literal("RESOLVED"),
                    t.Literal("CLOSED"),
                ])),
            }),
        }
    )

    // Create work order from ticket (Admin only)
    .post(
        "/:id/work-order",
        async ({ params, body, set }: any) => {
            try {
                const result = await ticketService.createWorkOrderFromTicket(params.id, {
                    woType: body.woType,
                    scheduledTime: new Date(body.scheduledTime),
                    technicianId: body.technicianId,
                });
                return {
                    success: true,
                    message: "Work order created from ticket",
                    data: {
                        ...result,
                        id: result.id.toString(),
                    }
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
                woType: t.Union([
                    t.Literal("REPAIR"),
                    t.Literal("DISMANTLE"),
                ]),
                scheduledTime: t.String(), // ISO date
                technicianId: t.Optional(t.String()),
            }),
        }
    );
