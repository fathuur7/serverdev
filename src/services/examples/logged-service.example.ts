import { logged } from '../../utils/logged-prisma';

/**
 * Example User Service
 * Demonstrates auto-logging usage with logged Prisma wrapper
 */
export class ExampleUserService {
    /**
     * CREATE - Automatically logged
     */
    async createUser(data: any) {
        // Instead of: prisma.user.create()
        // Use: logged.user.create()
        const user = await logged.user.create({
            data: {
                email: data.email,
                passwordHash: data.passwordHash,
                name: data.name,
                role: 'CUSTOMER',
                status: 'ACTIVE',
            }
        });

        // ✅ Activity log automatically created:
        // - actorUserId: current user (from AsyncLocalStorage context)
        // - action: "CREATE"
        // - targetTable: "User"
        // - targetId: user.id
        // - newValue: { email, name, role, ... } (passwordHash redacted)
        // - ipAddress: request IP (from context)

        return user;
    }

    /**
     * UPDATE - Automatically logged with old & new values
     */
    async updateUserProfile(userId: string, data: { name?: string; phone?: string }) {
        const updated = await logged.user.update({
            where: { id: userId },
            data
        });

        // ✅ Activity log automatically created:
        // - action: "UPDATE"
        // - oldValue: { name: "Old Name", ... }
        // - newValue: { name: "New Name", ... }

        return updated;
    }

    /**
     * DELETE - Automatically logged
     */
    async deleteUser(userId: string) {
        await logged.user.delete({
            where: { id: userId }
        });

        // ✅ Activity log automatically created:
        // - action: "DELETE"
        // - oldValue: deleted user data
    }

    /**
     * READ operations - Use normal prisma (no logging needed)
     */
    async getUsers(filters?: any) {
        // READ operations tidak perlu di-log
        // Use normal prisma
        return await logged.user.findMany({
            where: filters,
            orderBy: { createdAt: 'desc' }
        });
    }

    async getUserById(userId: string) {
        return await logged.user.findUnique({
            where: { id: userId }
        });
    }
}

/**
 * Example Subscription Service
 */
export class ExampleSubscriptionService {
    async createSubscription(data: any) {
        return await logged.subscription.create({
            data: {
                userId: data.userId,
                packageId: data.packageId,
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                status: 'ACTIVE',
            }
        });
        // ✅ Auto-logged: CREATE Subscription
    }

    async activateSubscription(subId: string) {
        return await logged.subscription.update({
            where: { id: subId },
            data: { status: 'ACTIVE' }
        });
        // ✅ Auto-logged: UPDATE Subscription (with old/new status)
    }

    async cancelSubscription(subId: string) {
        return await logged.subscription.update({
            where: { id: subId },
            data: { status: 'CANCELLED' }
        });
        // ✅ Auto-logged: UPDATE Subscription
    }
}

/**
 * Example Payment Service
 */
export class ExamplePaymentService {
    async recordPayment(data: any) {
        return await logged.payment.create({
            data: {
                userId: data.userId,
                amount: data.amount,
                method: data.method,
                status: 'PENDING',
            }
        });
        // ✅ Auto-logged: CREATE Payment
    }

    async confirmPayment(paymentId: string) {
        return await logged.payment.update({
            where: { id: paymentId },
            data: {
                status: 'COMPLETED',
                confirmedAt: new Date()
            }
        });
        // ✅ Auto-logged: UPDATE Payment (PENDING → COMPLETED)
    }
}
