import prisma from "../../utils/prisma";

export class UserManagementService {
    /**
     * Get all users
     */
    async getUsers() {
        return await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                emailVerified: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
        });
    }

    /**
     * Get user by ID
     */
    async getUserById(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                role: true,
                emailVerified: true,
                createdAt: true,
            },
        });

        if (!user) {
            throw new Error("User not found");
        }

        return user;
    }

    /**
     * Set email verified status (Admin only)
     */
    async setEmailVerified(userId: string, verified: boolean) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new Error("User not found");
        }

        return await prisma.user.update({
            where: { id: userId },
            data: { emailVerified: verified },
            select: {
                id: true,
                email: true,
                role: true,
                emailVerified: true,
            },
        });
    }

    /**
     * Change user role (Admin only)
     */
    async changeUserRole(
        userId: string,
        newRole: "ADMIN" | "CUSTOMER" | "TECHNICIAN"
    ) {
        // Validate role
        const validRoles = ["ADMIN", "CUSTOMER", "TECHNICIAN"];
        if (!validRoles.includes(newRole)) {
            throw new Error("Invalid role. Must be ADMIN, CUSTOMER, or TECHNICIAN");
        }

        // Get user
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new Error("User not found");
        }

        // Update role
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { role: newRole },
            select: {
                id: true,
                email: true,
                role: true,
                emailVerified: true,
                createdAt: true,
            },
        });

        return {
            message: `User role updated successfully from ${user.role} to ${newRole}`,
            user: updatedUser,
        };
    }
}

export const userManagementService = new UserManagementService();
