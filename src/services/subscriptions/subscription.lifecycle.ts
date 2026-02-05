import prisma from "../../utils/prisma";
import { calculateContractEndDate } from "../../utils/subscription.utils";




/**
 * Lifecycle Operations for Subscriptions
 * (activate, isolate, terminate, batch operations)
 */

/**
 *  role admin and technician
 *  Activate subscription
 */
export async function activateSubscription(id: string) {
    const subscription = await prisma.subscriptions.findUnique({
        where: { id },
        include: { package: true },
    });

    if (!subscription) {
        throw new Error("Subscription not found");
    }

    if (subscription.status !== "PENDING_INSTALL") {
        throw new Error(
            `Cannot activate: current status is ${subscription.status}`
        );
    }

    const activationDate = new Date();
    const contractEndDate = calculateContractEndDate(
        activationDate,
    );

    return await prisma.subscriptions.update({
        where: { id },
        data: {
            status: "ACTIVE",
            activationDate,
            contractEndDate,
        },
        include: {
            customer: true,
            package: true,
        },
    });
}

/**
 * Isolate subscription (due to unpaid bills, etc.)
 */
export async function isolateSubscription(id: string) {
    const subscription = await prisma.subscriptions.findUnique({
        where: { id },
    });

    if (!subscription) {
        throw new Error("Subscription not found");
    }

    if (subscription.status !== "ACTIVE") {
        throw new Error(
            `Cannot isolate: current status is ${subscription.status}`
        );
    }

    return await prisma.subscriptions.update({
        where: { id },
        data: { status: "ISOLATED" },
        include: {
            customer: true,
            package: true,
        },
    });
}

/**
 * Terminate subscription permanently
 */
export async function terminateSubscription(id: string) {
    const subscription = await prisma.subscriptions.findUnique({
        where: { id },
    });

    if (!subscription) {
        throw new Error("Subscription not found");
    }

    if (subscription.status === "TERMINATED") {
        throw new Error("Subscription is already terminated");
    }

    return await prisma.subscriptions.update({
        where: { id },
        data: { status: "TERMINATED" },
        include: {
            customer: true,
            package: true,
        },
    });
}

/**
 * [CRON Task B] Isolate subscriptions with overdue unpaid invoices
 * Runs daily at 00:01 AM
 */
export async function isolateOverdueSubscriptions(): Promise<{
    isolated: number;
    errors: string[];
}> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all UNPAID invoices where dueDate < today
    const overdueInvoices = await prisma.invoice.findMany({
        where: {
            status: "UNPAID",
            dueDate: { lt: today },
        },
        include: {
            subscription: true,
        },
    });

    // Get unique subscription IDs that are still ACTIVE
    const subscriptionIds = [
        ...new Set(
            overdueInvoices
                .filter((inv) => inv.subscription.status === "ACTIVE")
                .map((inv) => inv.subscriptionId)
        ),
    ];

    let isolated = 0;
    const errors: string[] = [];

    for (const subId of subscriptionIds) {
        try {
            await prisma.subscriptions.update({
                where: { id: subId },
                data: { status: "ISOLATED" },
            });
            isolated++;
            console.log(`🔒 Isolated subscription ${subId} due to overdue invoice`);
        } catch (error) {
            const msg = `Failed to isolate ${subId}: ${(error as Error).message}`;
            errors.push(msg);
            console.error(`❌ ${msg}`);
        }
    }

    return { isolated, errors };
}
