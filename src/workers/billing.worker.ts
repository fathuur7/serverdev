import { CronJob } from "cron";
import { InvoiceService } from "../services/Invoices/invoice.service";
import { SubscriptionService } from "../services/subscriptions/subscription.service";
import { NotificationService } from "../services/notifications/notification.service";
import prisma from "../utils/prisma";

const invoiceService = new InvoiceService();
const subscriptionService = new SubscriptionService();

/**
 * Task A: Invoice Generator
 * Generates invoices 7 days before billing cycle
 */
async function runInvoiceGenerator() {
    console.log("🧾 [Task A] Starting Invoice Generator...");
    try {
        const result = await invoiceService.generateMonthlyInvoices();
        console.log(
            `🧾 [Task A] Completed: ${result.generated} generated, ${result.skipped} skipped, ${result.errors.length} errors`
        );
        if (result.errors.length > 0) {
            result.errors.forEach(err => console.error(`   ❌ ${err}`));
        }
    } catch (error) {
        console.error("❌ [Task A] Error:", error);
    }
}

/**
 * Task B: Subscription Enforcer
 * Isolates subscriptions with overdue unpaid invoices
 */
async function runSubscriptionEnforcer() {
    console.log("🔒 [Task B] Starting Subscription Enforcer...");
    try {
        const result = await subscriptionService.isolateOverdueSubscriptions();
        console.log(
            `🔒 [Task B] Completed: ${result.isolated} subscriptions isolated, ${result.errors.length} errors`
        );
    } catch (error) {
        console.error("❌ [Task B] Error:", error);
    }
}

/**
 * Task C: Payment Reminder
 * Sends reminders for unpaid invoices H-3 and H-1 before due date
 */
async function runPaymentReminder() {
    console.log("🔔 [Task C] Starting Payment Reminder...");
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find unpaid invoices due in 3 days or 1 day
        const invoices = await prisma.invoice.findMany({
            where: {
                status: "UNPAID",
                dueDate: {
                    gte: today,
                },
            },
            include: {
                subscription: true,
            },
        });

        let h3Sent = 0;
        let h1Sent = 0;

        for (const invoice of invoices) {
            const dueDate = new Date(invoice.dueDate);
            dueDate.setHours(0, 0, 0, 0);

            const diffTime = dueDate.getTime() - today.getTime();
            const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (daysLeft === 3) {
                await NotificationService.sendPaymentReminder(invoice, 3);
                h3Sent++;
            } else if (daysLeft === 1) {
                await NotificationService.sendPaymentReminder(invoice, 1);
                h1Sent++;
            }
        }

        console.log(`🔔 [Task C] Completed: H-3: ${h3Sent}, H-1: ${h1Sent} reminders sent`);
    } catch (error) {
        console.error("❌ [Task C] Error:", error);
    }
}

/**
 * Task D: Overdue Alert
 * Sends alerts for invoices that are overdue (H+1)
 */
async function runOverdueAlert() {
    console.log("🚨 [Task D] Starting Overdue Alert...");
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find overdue unpaid invoices
        const invoices = await prisma.invoice.findMany({
            where: {
                status: "UNPAID",
                dueDate: {
                    lt: today, // Due date is in the past
                },
            },
            include: {
                subscription: true,
            },
        });

        let alertsSent = 0;

        for (const invoice of invoices) {
            const dueDate = new Date(invoice.dueDate);
            dueDate.setHours(0, 0, 0, 0);

            const diffTime = today.getTime() - dueDate.getTime();
            const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Only send on H+1 (not every day)
            if (daysOverdue === 1) {
                await NotificationService.sendOverdueAlert(invoice, daysOverdue);
                alertsSent++;
            }
        }

        console.log(`🚨 [Task D] Completed: ${alertsSent} overdue alerts sent`);
    } catch (error) {
        console.error("❌ [Task D] Error:", error);
    }
}

/**
 * Start Billing Worker with Cron Jobs
 */
export function startBillingWorker() {
    console.log("🚀 Billing Worker started");

    // Task A: Invoice Generator at 01:00 AM daily
    const invoiceJob = new CronJob(
        "0 0 1 * * *",
        runInvoiceGenerator,
        null,
        true,
        "Asia/Jakarta"
    );
    console.log("⏰ [Task A: Invoice Generator] Scheduled: 01:00 AM daily");

    // Task B: Subscription Enforcer at 00:01 AM daily
    const enforcerJob = new CronJob(
        "0 1 0 * * *",
        runSubscriptionEnforcer,
        null,
        true,
        "Asia/Jakarta"
    );
    console.log("⏰ [Task B: Subscription Enforcer] Scheduled: 00:01 AM daily");

    // Task C: Payment Reminder at 09:00 AM daily
    const reminderJob = new CronJob(
        "0 0 9 * * *",
        runPaymentReminder,
        null,
        true,
        "Asia/Jakarta"
    );
    console.log("⏰ [Task C: Payment Reminder] Scheduled: 09:00 AM daily");

    // Task D: Overdue Alert at 09:00 AM daily
    const overdueJob = new CronJob(
        "0 0 9 * * *",
        runOverdueAlert,
        null,
        true,
        "Asia/Jakarta"
    );
    console.log("⏰ [Task D: Overdue Alert] Scheduled: 09:00 AM daily");

    return { invoiceJob, enforcerJob, reminderJob, overdueJob };
}

// Export tasks for manual testing
export { runPaymentReminder, runOverdueAlert };

// Run if executed directly
if (import.meta.main) {
    startBillingWorker();
    console.log("💤 Worker is running. Press Ctrl+C to stop.");
}

