import { CronJob } from "cron";
import { InvoiceService } from "../services/Invoices/invoice.service";
import { SubscriptionService } from "../services/subscriptions/subscription.service";

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
        // return result;
    } catch (error) {
        console.error("❌ [Task B] Error:", error);
    }
}

/**
 * Start Billing Worker with Cron Jobs
 */
export function startBillingWorker() {
    console.log("🚀 Billing Worker started");

    // Task A: Invoice Generator at 01:00 AM daily
    // Cron format: second minute hour dayOfMonth month dayOfWeek
    const invoiceJob = new CronJob(
        "0 0 1 * * *", // Every second for testing
        runInvoiceGenerator,
        null,
        true,
        "Asia/Jakarta"
    );
    console.log("⏰ [Invoice Generator] Scheduled: 01:00 AM daily (Asia/Jakarta)");

    // Task B: Subscription Enforcer at 00:01 AM daily
    const enforcerJob = new CronJob(
        "0 1 0 * * *", // Every day at 00:01:00
        runSubscriptionEnforcer,
        null,
        true,
        "Asia/Jakarta"
    );
    console.log("⏰ [Subscription Enforcer] Scheduled: 00:01 AM daily (Asia/Jakarta)");

    return { invoiceJob, enforcerJob };
}

// Run if executed directly
if (import.meta.main) {
    startBillingWorker();
    console.log("💤 Worker is running. Press Ctrl+C to stop.");
}
