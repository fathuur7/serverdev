import prisma from "../../utils/prisma";
import { GenerateInvoiceInput } from "../../types/invoice.types";
import { generateInvoiceNumber } from "../../utils/invoice.utils";
import { addMonths, startOfMonth, endOfMonth } from "date-fns";
import { EmailService } from "../auth/email.service";
import { WhatsAppService } from "../notifications/whatsapp.service";

export class InvoiceService {
    /**
     * Generate First Invoice (Activation) or Monthly Invoice
     */
    async generateInvoice(data: GenerateInvoiceInput) {
        // 1. Validate subscription
        const subscription = await prisma.subscriptions.findUnique({
            where: { id: data.subscriptionId },
            include: { package: true },
        });

        if (!subscription) {
            throw new Error("Subscription not found");
        }

        if (subscription.status !== "ACTIVE" && subscription.status !== "PENDING_INSTALL") {
            // Note: usually we generate invoice before activation or just after?
            // Let's assume we can generate if Active or Pending (First Bill)
            throw new Error(`Cannot generate invoice for status ${subscription.status}`);
        }

        // 2. Set Billing Period
        const billingDate = data.billingPeriod || new Date();
        const periodStart = startOfMonth(billingDate);
        const periodEnd = endOfMonth(billingDate);

        // 3. Check for Duplicate Invoice in this period
        const existingInvoice = await prisma.invoice.findFirst({
            where: {
                subscriptionId: subscription.id,
                billingPeriod: {
                    gte: periodStart,
                    lte: periodEnd,
                },
                status: {
                    not: "CANCELLED",
                },
            },
        });

        if (existingInvoice) {
            throw new Error("DUPLICATE: Invoice for this billing period already exists");
        }

        // 4. Calculate Amounts (sementara tanpa tax/discount/penalty)
        const amountBasic = Number(subscription.package.monthlyPrice);
        const amountTax = 0;        // TODO: Implement tax calculation
        const amountDiscount = 0;   // TODO: Implement discount calculation
        const penaltyFee = 0;       // TODO: Implement penalty calculation
        const totalAmount = amountBasic;

        // 5. Generate Invoice Number
        const invoiceNumber = await generateInvoiceNumber();

        // 6. Due date: 7 days from billing date
        const dueDate = new Date(billingDate);
        dueDate.setDate(dueDate.getDate() + 7);

        const newInvoice = await prisma.invoice.create({
            data: {
                subscriptionId: subscription.id,
                invoiceNumber,
                billingPeriod: billingDate,
                dueDate,
                amountBasic: amountBasic,
                amountTax: amountTax,
                amountDiscount: amountDiscount,
                penaltyFee: penaltyFee,
                totalAmount: totalAmount,
                status: "UNPAID",
            },
        });

        // 7. Send Email Notification
        const fullSubscription = await prisma.subscriptions.findUnique({
            where: { id: subscription.id },
            include: {
                customer: {
                    include: { user: true }
                }
            }
        });

        if (fullSubscription?.customer?.user?.email) {
            // Fire and forget email
            EmailService.sendInvoiceEmail(fullSubscription.customer.user.email, newInvoice).catch(err => {
                console.error("Failed to send invoice email:", err);
            });
        }

        if (fullSubscription?.customer?.phoneNumber) {
            // Fire and forget WhatsApp
            WhatsAppService.sendInvoiceNotification(fullSubscription.customer.phoneNumber, newInvoice).catch(err => {
                console.error("Failed to send WhatsApp notification:", err);
            });
        }

        return newInvoice;
    }

    /**
     * Get Invoice by ID
     */
    async getById(id: string) {
        return await prisma.invoice.findUnique({
            where: { id },
            include: {
                subscription: {
                    include: { customer: true, package: true },
                },
                payments: true,
            },
        });
    }

    /**
     * Get Invoices for a specific customer (by userId)
     */
    async getMyInvoices(userId: string, status?: string) {
        const where: any = {
            subscription: {
                customer: {
                    userId: userId,
                },
            },
        };

        if (status) {
            where.status = status;
        }

        return await prisma.invoice.findMany({
            where,
            include: {
                subscription: {
                    include: { package: true },
                },
            },
            orderBy: { id: 'desc' },
            take: 20, // Limit to last 20 invoices
        });
    }

    /**
     * Get current unpaid invoice for customer (by userId)
     */
    async getCurrentUnpaidInvoice(userId: string) {
        return await prisma.invoice.findFirst({
            where: {
                subscription: {
                    customer: {
                        userId: userId,
                    },
                },
                status: 'UNPAID',
            },
            include: {
                subscription: {
                    include: { package: true },
                },
            },
            orderBy: { dueDate: 'asc' }, // Get the one due soonest
        });
    }

    /**
     * [CRON Task A] Generate invoices for subscriptions due in 7 days
     * Runs daily at 01:00 AM
     * Optimized: Uses parallel processing with Promise.allSettled
     */
    async generateMonthlyInvoices(): Promise<{ generated: number; skipped: number; errors: string[] }> {
        const today = new Date();
        const targetDay = new Date(today);
        targetDay.setDate(targetDay.getDate() + 7);

        const dayToBill = targetDay.getDate();
        const isLastDayOfMonth = endOfMonth(targetDay).getDate() === dayToBill;

        console.log(`🔍 [Debug] Billing Generation:`);
        console.log(`   Today: ${today.toISOString()} (Local Date: ${today.getDate()})`);
        console.log(`   Target: ${targetDay.toISOString()} (Local Date: ${targetDay.getDate()})`);
        console.log(`   Day to Bill: ${dayToBill}`);

        // 1. Efficient DB query with filtering
        const subscriptions = await prisma.$queryRaw<any[]>`
            SELECT id, service_id as "serviceId", activation_date FROM subscriptions 
            WHERE status = 'ACTIVE' 
            AND (
                EXTRACT(DAY FROM activation_date) = ${dayToBill}
                OR (
                    ${isLastDayOfMonth} = true 
                    AND EXTRACT(DAY FROM activation_date) > ${dayToBill}
                )
            )
        `;

        console.log(`   Found ${subscriptions.length} Eligible Subscriptions.`);
        if (subscriptions.length > 0) {
            console.log(`   Sample Sub: ${JSON.stringify(subscriptions[0])}`);
        }

        if (subscriptions.length === 0) {
            return { generated: 0, skipped: 0, errors: [] };
        }

        // 2. Parallel processing with Promise.allSettled (no N+1)
        const results = await Promise.allSettled(
            subscriptions.map((sub) =>
                this.generateInvoice({
                    subscriptionId: sub.id,
                    billingPeriod: targetDay,
                })
            )
        );

        // 3. Count results
        let generated = 0;
        let skipped = 0;
        const errors: string[] = [];

        results.forEach((result, index) => {
            if (result.status === "fulfilled") {
                generated++;
            } else {
                const errorMsg = result.reason?.message || "Unknown error";
                // Check if it's a duplicate (not an error, just skipped)
                if (errorMsg.startsWith("DUPLICATE:")) {
                    skipped++;
                    console.log(`   ⏭️ Skipped ${subscriptions[index].serviceId}: Already has invoice for this period`);
                } else {
                    errors.push(`Sub ${subscriptions[index].serviceId}: ${errorMsg}`);
                    console.error(`   ❌ Error ${subscriptions[index].serviceId}: ${errorMsg}`);
                }
            }
        });

        console.log(`📊 Summary: ${generated} generated, ${skipped} skipped (existing), ${errors.length} errors`);
        return { generated, skipped, errors };
    }
}
