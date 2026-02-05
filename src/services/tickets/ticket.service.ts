import prisma from "../../utils/prisma";
import type { TicketCategory, TicketPriority, TicketStatus, CreateTicketInput, UpdateTicketInput } from "../../types/ticket.types";

export class TicketService {
    /**
     * Create new ticket (by customer or admin)
     */
    async create(userId: string, data: CreateTicketInput) {
        // Verify subscription exists and belongs to user (if customer)
        const subscription = await prisma.subscriptions.findUnique({
            where: { id: data.subscriptionId },
            include: { customer: true }
        });

        if (!subscription) {
            throw new Error("Subscription not found");
        }

        // Check if user is authorized (customer owns subscription or is admin)
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { customerProfile: true }
        });

        if (!user) {
            throw new Error("User not found");
        }

        if (user.role === 'CUSTOMER') {
            if (!user.customerProfile || subscription.customerId !== user.customerProfile.id) {
                throw new Error("You can only create tickets for your own subscriptions");
            }
        }

        const ticket = await prisma.ticket.create({
            data: {
                subscriptionId: data.subscriptionId,
                category: data.category,
                priority: data.priority,
                subject: data.subject,
                description: data.description,
                createdByUserId: userId,
                status: 'OPEN',
            },
            include: {
                subscription: {
                    include: { package: true, customer: true }
                },
                creator: {
                    select: { id: true, email: true, role: true }
                }
            }
        });

        return ticket;
    }

    /**
     * Get all tickets (admin only) with filters
     */
    async getAll(filters?: {
        status?: TicketStatus;
        category?: TicketCategory;
        priority?: TicketPriority;
    }) {
        const where: any = {};

        if (filters?.status) where.status = filters.status;
        if (filters?.category) where.category = filters.category;
        if (filters?.priority) where.priority = filters.priority;

        return await prisma.ticket.findMany({
            where,
            include: {
                subscription: {
                    include: { package: true, customer: true }
                },
                creator: {
                    select: { id: true, email: true, role: true }
                }
            },
            orderBy: [
                { priority: 'desc' }, // CRITICAL first
                { createdAt: 'desc' }
            ]
        });
    }

    /**
     * Get my tickets (customer)
     */
    async getMyTickets(userId: string, status?: TicketStatus) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { customerProfile: true }
        });

        if (!user?.customerProfile) {
            throw new Error("Customer profile not found");
        }

        const where: any = {
            subscription: {
                customerId: user.customerProfile.id
            }
        };

        if (status) where.status = status;

        return await prisma.ticket.findMany({
            where,
            include: {
                subscription: {
                    include: { package: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Get ticket by ID
     */
    async getById(id: string) {
        return await prisma.ticket.findUnique({
            where: { id },
            include: {
                subscription: {
                    include: { package: true, customer: true }
                },
                creator: {
                    select: { id: true, email: true, role: true }
                },
                workOrders: {
                    include: { technician: true }
                }
            }
        });
    }

    /**
     * Update ticket status (admin)
     */
    async updateStatus(id: string, status: TicketStatus) {
        const data: any = { status };

        // If resolving, set resolvedAt
        if (status === 'RESOLVED' || status === 'CLOSED') {
            data.resolvedAt = new Date();
        }

        return await prisma.ticket.update({
            where: { id },
            data,
            include: {
                subscription: true,
                creator: {
                    select: { id: true, email: true }
                }
            }
        });
    }

    /**
     * Update ticket (admin)
     */
    async update(id: string, data: UpdateTicketInput) {
        const updateData: any = {};

        if (data.category) updateData.category = data.category;
        if (data.priority) updateData.priority = data.priority;
        if (data.subject) updateData.subject = data.subject;
        if (data.description) updateData.description = data.description;
        if (data.status) {
            updateData.status = data.status;
            if (data.status === 'RESOLVED' || data.status === 'CLOSED') {
                updateData.resolvedAt = new Date();
            }
        }

        return await prisma.ticket.update({
            where: { id },
            data: updateData,
            include: {
                subscription: true,
                creator: {
                    select: { id: true, email: true }
                }
            }
        });
    }

    /**
     * Get ticket statistics (admin dashboard)
     */
    async getStats() {
        const [total, open, inProgress, resolved, byCategory, byPriority] = await Promise.all([
            prisma.ticket.count(),
            prisma.ticket.count({ where: { status: 'OPEN' } }),
            prisma.ticket.count({ where: { status: 'IN_PROGRESS' } }),
            prisma.ticket.count({ where: { status: 'RESOLVED' } }),
            prisma.ticket.groupBy({
                by: ['category'],
                _count: { category: true }
            }),
            prisma.ticket.groupBy({
                by: ['priority'],
                _count: { priority: true }
            })
        ]);

        return {
            total,
            byStatus: { open, inProgress, resolved },
            byCategory: byCategory.reduce((acc, cat) => {
                acc[cat.category] = cat._count.category;
                return acc;
            }, {} as Record<string, number>),
            byPriority: byPriority.reduce((acc, pri) => {
                acc[pri.priority] = pri._count.priority;
                return acc;
            }, {} as Record<string, number>)
        };
    }

    /**
     * Create work order from ticket (admin)
     */
    async createWorkOrderFromTicket(
        ticketId: string,
        data: {
            woType: 'REPAIR' | 'DISMANTLE';
            scheduledTime: Date;
            technicianId?: string;
        }
    ) {
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId }
        });

        if (!ticket) {
            throw new Error("Ticket not found");
        }

        // Create work order linked to ticket
        const workOrder = await prisma.workOrder.create({
            data: {
                ticketId: ticketId,
                subscriptionId: ticket.subscriptionId,
                woType: data.woType,
                scheduledTime: data.scheduledTime,
                technicianId: data.technicianId,
                status: data.technicianId ? 'ASSIGNED' : 'DRAFT',
            },
            include: {
                subscription: true,
                technician: true,
                ticket: true,
            }
        });

        // Update ticket status to IN_PROGRESS
        await prisma.ticket.update({
            where: { id: ticketId },
            data: { status: 'IN_PROGRESS' }
        });

        return workOrder;
    }
}
