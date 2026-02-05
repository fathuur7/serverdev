import prisma from "../../utils/prisma";
import type { CustomerProfileInput, UpdateProfileInput } from "../../types/auth.type";

export class ProfileService {
    /**
     * Get user profile (with customer or technician profile)
     */
    async getProfile(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                customerProfile: true,
                technicianProfile: true,
            },
        });

        if (!user) {
            throw new Error("User not found");
        }

        const { passwordHash, otp, otpExpiresAt, ...userWithoutSensitive } = user;
        return userWithoutSensitive;
    }

    /**
     * Create customer profile
     */
    async createCustomerProfile(userId: string, data: CustomerProfileInput) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { customerProfile: true },
        });

        if (!user) {
            throw new Error("User not found");
        }

        if (user.customerProfile) {
            throw new Error("Customer profile already exists");
        }

        return await prisma.customerProfile.create({
            data: {
                userId,
                ...data,
            },
        });
    }

    /**
     * Update customer profile
     */
    async updateProfile(userId: string, data: UpdateProfileInput) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { customerProfile: true },
        });

        if (!user) {
            throw new Error("User not found");
        }

        if (!user.customerProfile) {
            throw new Error("Customer profile not found");
        }

        return await prisma.customerProfile.update({
            where: { userId },
            data,
        });
    }
}

export const profileService = new ProfileService();
