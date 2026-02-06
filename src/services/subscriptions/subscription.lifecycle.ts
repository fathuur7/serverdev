import prisma from "../../utils/prisma";
import { calculateContractEndDate } from "../../utils/subscription.utils";
import { NotificationService } from "../notifications/notification.service";




/**
 * Lifecycle Operations for Subscriptions
 * (activate, isolate, terminate, reactivate, batch operations)
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
 * Reactivate subscription (after payment)
 */
export async function reactivateSubscription(id: string) {
    const subscription = await prisma.subscriptions.findUnique({
        where: { id },
    });

    if (!subscription) {
        throw new Error("Subscription not found");
    }

    if (subscription.status !== "ISOLATED") {
        throw new Error(
            `Cannot reactivate: current status is ${subscription.status}`
        );
    }

    const updated = await prisma.subscriptions.update({
        where: { id },
        data: { status: "ACTIVE" },
        include: {
            customer: true,
            package: true,
        },
    });

    // Send reactivation notification
    NotificationService.sendReactivationNotice(id).catch(err => {
        console.error("Failed to send reactivation notification:", err);
    });

    return updated;
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
 * Also sends isolation notifications
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

    // Get unique subscriptions that are still ACTIVE with their invoices
    const activeOverdueMap = new Map<string, typeof overdueInvoices[0]>();
    for (const inv of overdueInvoices) {
        if (inv.subscription.status === "ACTIVE" && !activeOverdueMap.has(inv.subscriptionId)) {
            activeOverdueMap.set(inv.subscriptionId, inv);
        }
    }

    let isolated = 0;
    const errors: string[] = [];

    for (const [subId, invoice] of activeOverdueMap) {
        try {
            await prisma.subscriptions.update({
                where: { id: subId },
                data: { status: "ISOLATED" },
            });
            isolated++;
            console.log(`🔒 Isolated subscription ${subId} due to overdue invoice`);

            // Send isolation notification
            NotificationService.sendIsolationNotice(subId, invoice).catch(err => {
                console.error(`Failed to send isolation notification for ${subId}:`, err);
            });
        } catch (error) {
            const msg = `Failed to isolate ${subId}: ${(error as Error).message}`;
            errors.push(msg);
            console.error(`❌ ${msg}`);
        }
    }

    return { isolated, errors };
}

