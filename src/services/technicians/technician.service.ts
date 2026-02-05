import prisma from "../../utils/prisma";
import type { CreateTechnicianInput, UpdateTechnicianInput, TechnicianStatus } from "../../types/technician.types";

export class TechnicianService {
    /**
     * Create new technician with User account
     */
    async create(data: CreateTechnicianInput) {
        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email }
        });
        if (existingUser) {
            throw new Error("Email already registered");
        }

        // Check if employeeId already exists
        const existingEmployee = await prisma.technicianProfile.findUnique({
            where: { employeeId: data.employeeId }
        });
        if (existingEmployee) {
            throw new Error("Employee ID already exists");
        }

        // Create user and technician profile in transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create User with TECHNICIAN role
            const user = await tx.user.create({
                data: {
                    email: data.email,
                    passwordHash: await Bun.password.hash(data.password),
                    role: "TECHNICIAN",
                    emailVerified: true, // Auto-verified for admin-created accounts
                }
            });

            // 2. Create TechnicianProfile
            const technician = await tx.technicianProfile.create({
                data: {
                    userId: user.id,
                    employeeId: data.employeeId,
                    fullName: data.fullName,
                    phoneNumber: data.phoneNumber,
                    specialization: data.specialization,
                    currentStatus: "IDLE",
                }
            });

            return { user, technician };
        });

        return result;
    }

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
