import prisma from "../../utils/prisma";
import type { UpdateTechnicianInput, } from "../../types/technician.types";

export class TechnicianService {

    /**
     * Get all technicians
     */
    async getAll() {
        return await prisma.technicianProfile.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        status: true,
                    }
                }
            },
            orderBy: { fullName: 'asc' }
        });
    }

    /**
     * Get technician by ID
     */
    async getById(id: string) {
        return await prisma.technicianProfile.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        status: true,
                    }
                },
                workOrders: {
                    take: 10,
                    orderBy: { id: 'desc' }
                }
            }
        });
    }

    /**
     * Get technician by userId
     */
    async getByUserId(userId: string) {
        return await prisma.technicianProfile.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        status: true,
                    }
                }
            }
        });
    }

    /**
     * Update technician profile
     */
    async update(id: string, data: UpdateTechnicianInput) {
        return await prisma.technicianProfile.update({
            where: { id },
            data: {
                fullName: data.fullName,
                phoneNumber: data.phoneNumber,
                specialization: data.specialization,
                currentStatus: data.currentStatus,
            }
        });
    }

    /**
     * Get available technicians (IDLE status)
     */
    async getAvailable() {
        return await prisma.technicianProfile.findMany({
            where: {
                currentStatus: "IDLE",
                user: {
                    status: "ACTIVE"
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                    }
                }
            }
        });
    }

    /**
     * Update technician status
     */
    async updateStatus(id: string, status: 'IDLE' | 'ON_JOB' | 'OFF_DUTY') {
        return await prisma.technicianProfile.update({
            where: { id },
            data: { currentStatus: status }
        });
    }
}
