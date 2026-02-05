import prisma from "../../utils/prisma";
import type { WorkOrderType, WorkOrderStatus, CreateWorkOrderInput, UpdateWorkOrderInput } from "../../types/workorder.types";

export class WorkOrderService {
    /**
     * Create new work order
     */
    async create(data: CreateWorkOrderInput) {
        // Verify subscription exists
        const subscription = await prisma.subscriptions.findUnique({
            where: { id: data.subscriptionId }
        });
        if (!subscription) {
            throw new Error("Subscription not found");
        }

        // If technicianId provided, verify and set status to ASSIGNED
        let initialStatus: WorkOrderStatus = 'DRAFT';
        if (data.technicianId) {
            const technician = await prisma.technicianProfile.findUnique({
                where: { id: data.technicianId }
            });
            if (!technician) {
                throw new Error("Technician not found");
            }
            initialStatus = 'ASSIGNED';
        }

        const workOrder = await prisma.workOrder.create({
            data: {
                subscriptionId: data.subscriptionId,
                ticketId: data.ticketId,
                woType: data.woType,
                scheduledTime: data.scheduledTime,
                technicianId: data.technicianId,
                status: initialStatus,
            },
            include: {
                subscription: {
                    include: { customer: true, package: true }
                },
                technician: true,
            }
        });

        return workOrder;
    }

    /**
     * Get all work orders with filters
     */
    async getAll(filters?: {
        status?: WorkOrderStatus;
        technicianId?: string;
        woType?: WorkOrderType;
    }) {
        const where: any = {};

        if (filters?.status) where.status = filters.status;
        if (filters?.technicianId) where.technicianId = filters.technicianId;
        if (filters?.woType) where.woType = filters.woType;

        return await prisma.workOrder.findMany({
            where,
            include: {
                subscription: {
                    include: { customer: true, package: true }
                },
                technician: true,
            },
            orderBy: { scheduledTime: 'asc' }
        });
    }

    /**
     * Get work order by ID
     */
    async getById(id: string) {
        return await prisma.workOrder.findUnique({
            where: { id: BigInt(id) },
            include: {
                subscription: {
                    include: { customer: true, package: true }
                },
                technician: true,
                ticket: true,
            }
        });
    }

    /**
     * Get work orders for a technician
     */
    async getMyWorkOrders(technicianId: string, status?: WorkOrderStatus) {
        const where: any = { technicianId };
        if (status) where.status = status;

        return await prisma.workOrder.findMany({
            where,
            include: {
                subscription: {
                    include: { customer: true, package: true }
                },
            },
            orderBy: { scheduledTime: 'asc' }
        });
    }

    /**
     * Assign technician to work order
     */
    async assignTechnician(workOrderId: string, technicianId: string) {
        // Verify technician exists and is available
        const technician = await prisma.technicianProfile.findUnique({
            where: { id: technicianId }
        });
        if (!technician) {
            throw new Error("Technician not found");
        }
        if (technician.currentStatus !== 'IDLE') {
            throw new Error("Technician is not available");
        }

        const workOrder = await prisma.workOrder.update({
            where: { id: BigInt(workOrderId) },
            data: {
                technicianId,
                status: 'ASSIGNED',
            },
            include: {
                subscription: true,
                technician: true,
            }
        });

        return workOrder;
    }

    /**
     * Start work order (technician takes action)
     */
    async startWork(workOrderId: string, technicianId: string) {
        const workOrder = await prisma.workOrder.findUnique({
            where: { id: BigInt(workOrderId) }
        });

        if (!workOrder) {
            throw new Error("Work order not found");
        }
        if (workOrder.technicianId !== technicianId) {
            throw new Error("This work order is not assigned to you");
        }
        if (workOrder.status !== 'ASSIGNED') {
            throw new Error("Work order must be in ASSIGNED status");
        }

        // Update work order and technician status
        const [updated] = await prisma.$transaction([
            prisma.workOrder.update({
                where: { id: BigInt(workOrderId) },
                data: { status: 'IN_PROGRESS' }
            }),
            prisma.technicianProfile.update({
                where: { id: technicianId },
                data: { currentStatus: 'ON_JOB' }
            })
        ]);

        return updated;
    }

    /**
     * Complete work order
     */
    async completeWork(workOrderId: string, technicianId: string, customerSignatureUrl?: string) {
        const workOrder = await prisma.workOrder.findUnique({
            where: { id: BigInt(workOrderId) },
            include: { subscription: true }
        });

        if (!workOrder) {
            throw new Error("Work order not found");
        }
        if (workOrder.technicianId !== technicianId) {
            throw new Error("This work order is not assigned to you");
        }
        if (workOrder.status !== 'IN_PROGRESS') {
            throw new Error("Work order must be in IN_PROGRESS status");
        }

        // Transaction: complete WO, update technician status, optionally activate subscription
        const result = await prisma.$transaction(async (tx) => {
            // 1. Complete work order
            const completedWO = await tx.workOrder.update({
                where: { id: BigInt(workOrderId) },
                data: {
                    status: 'COMPLETED',
                    completionTime: new Date(),
                    customerSignatureUrl,
                }
            });

            // 2. Set technician back to IDLE
            await tx.technicianProfile.update({
                where: { id: technicianId },
                data: { currentStatus: 'IDLE' }
            });

            // 3. If NEW_INSTALLATION and subscription is PENDING_INSTALL, activate it
            if (workOrder.woType === 'NEW_INSTALLATION' && workOrder.subscription.status === 'PENDING_INSTALL') {
                const now = new Date();
                const contractEnd = new Date(now);
                contractEnd.setMonth(contractEnd.getMonth() + 1); // 1 month contract minimum

                await tx.subscriptions.update({
                    where: { id: workOrder.subscriptionId },
                    data: {
                        status: 'ACTIVE',
                        activationDate: now,
                        contractEndDate: contractEnd,
                    }
                });
            }

            return completedWO;
        });

        return result;
    }

    /**
     * Mark work order as failed
     */
    async failWork(workOrderId: string, technicianId: string) {
        const workOrder = await prisma.workOrder.findUnique({
            where: { id: BigInt(workOrderId) }
        });

        if (!workOrder) {
            throw new Error("Work order not found");
        }
        if (workOrder.technicianId !== technicianId) {
            throw new Error("This work order is not assigned to you");
        }

        const [updated] = await prisma.$transaction([
            prisma.workOrder.update({
                where: { id: BigInt(workOrderId) },
                data: { status: 'FAILED' }
            }),
            prisma.technicianProfile.update({
                where: { id: technicianId },
                data: { currentStatus: 'IDLE' }
            })
        ]);

        return updated;
    }

    /**
     * Update work order (admin)
     */
    async update(id: string, data: UpdateWorkOrderInput) {
        return await prisma.workOrder.update({
            where: { id: BigInt(id) },
            data: {
                technicianId: data.technicianId,
                scheduledTime: data.scheduledTime,
                status: data.status,
                customerSignatureUrl: data.customerSignatureUrl,
            },
            include: {
                subscription: true,
                technician: true,
            }
        });
    }
}
