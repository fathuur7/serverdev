/**
 * Midtrans Payment Service
 * Handles Snap token creation and webhook processing
 */

import prisma from "../../utils/prisma";
import { NotificationService } from "../notifications/notification.service";
import type { SnapTransactionResponse, MidtransNotification } from "../../types/payment.types";

/**
 * Create Midtrans Snap Transaction Token
 */
export async function createSnapTransaction(invoiceId: string): Promise<SnapTransactionResponse> {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

    if (!serverKey) {
        throw new Error("Midtrans Server Key not configured");
    }

    // Get invoice with subscription and customer details
    const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
            subscription: {
                include: {
                    customer: {
                        include: { user: true }
                    },
                    package: true
                }
            }
        }
    });

    if (!invoice) {
        throw new Error("Invoice not found");
    }

    if (invoice.status !== 'UNPAID') {
        throw new Error("Invoice sudah dibayar atau dibatalkan");
    }

    const baseUrl = isProduction
        ? 'https://app.midtrans.com/snap/v1/transactions'
        : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

    // Base64 encode server key for Basic Auth
    const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64');

    const customer = invoice.subscription?.customer;
    const pkg = invoice.subscription?.package;

    const payload = {
        transaction_details: {
            order_id: invoice.invoiceNumber,
            gross_amount: Number(invoice.totalAmount),
        },
        customer_details: {
            first_name: customer?.fullName || 'Customer',
            email: customer?.user?.email || '',
        },
        item_details: [
            {
                id: pkg?.id || 'PKG',
                price: Number(invoice.amountBasic),
                quantity: 1,
                name: pkg?.name || 'Internet Subscription',
            },
            {
                id: 'TAX',
                price: Number(invoice.amountTax),
                quantity: 1,
                name: 'Pajak',
            }
        ],
        expiry: {
            unit: 'hours',
            duration: 24
        }
    };

    const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Midtrans Error:', errorData);
        throw new Error(errorData.error_messages?.[0] || 'Failed to create payment');
    }

    const result = await response.json() as SnapTransactionResponse;
    return result;
}

/**
 * Verify Midtrans webhook signature
 * Formula: SHA512(order_id + status_code + gross_amount + server_key)
 * Returns true if signature is valid
 */
export function verifySignature(notification: MidtransNotification): boolean {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;

    if (!serverKey) {
        console.error('MIDTRANS_SERVER_KEY not configured');
        return false;
    }

    const { order_id, status_code, gross_amount, signature_key } = notification;

    if (!signature_key) {
        console.error('Missing signature_key in notification');
        return false;
    }

    // Midtrans signature formula: SHA512(order_id + status_code + gross_amount + server_key)
    const payload = order_id + status_code + gross_amount + serverKey;
    const hasher = new Bun.CryptoHasher("sha512");
    hasher.update(payload);
    const expectedSignature = hasher.digest("hex");

    const isValid = signature_key === expectedSignature;

    if (!isValid) {
        console.error(`⚠️ Invalid webhook signature for order ${order_id}`);
        console.error(`Expected: ${expectedSignature}`);
        console.error(`Received: ${signature_key}`);
    }

    return isValid;
}

/**
 * Handle Midtrans Webhook Notification
 * PAY-005: Now includes signature verification
 */
export async function handleMidtransNotification(notification: MidtransNotification) {
    // CRITICAL: Verify signature first
    if (!verifySignature(notification)) {
        console.error('❌ Webhook signature verification failed!');
        return { success: false, message: 'Invalid signature' };
    }

    const { transaction_status, order_id, fraud_status } = notification;

    // Find invoice by order_id (which is invoiceNumber)
    const invoice = await prisma.invoice.findFirst({
        where: { invoiceNumber: order_id },
        include: { subscription: true }
    });

    if (!invoice) {
        console.error(`Invoice not found for order_id: ${order_id}`);
        return { success: false, message: 'Invoice not found' };
    }

    // Skip if invoice is already PAID (prevent duplicate/stale webhook updates)
    if (invoice.status === 'PAID') {
        console.log(`⏭️ Invoice ${order_id} already PAID, skipping webhook update`);
        return { success: true, message: 'Invoice already paid', invoice };
    }

    // Determine new status based on Midtrans transaction_status
    let newStatus: 'PAID' | 'UNPAID' | 'CANCELLED' = 'UNPAID';

    if (transaction_status === 'capture' || transaction_status === 'settlement') {
        // For credit card, check fraud_status
        if (fraud_status === 'accept' || !fraud_status) {
            newStatus = 'PAID';
        }
    } else if (transaction_status === 'pending') {
        newStatus = 'UNPAID'; // Still waiting for payment
    } else if (['deny', 'cancel', 'expire'].includes(transaction_status)) {
        newStatus = 'CANCELLED';
    }

    // PAY-004: Update invoice with OPTIMISTIC LOCKING to prevent race condition
    const updatedInvoice = await prisma.$transaction(async (tx) => {
        // 1. Atomic update with version check (optimistic locking)
        const updateResult = await tx.invoice.updateMany({
            where: {
                id: invoice.id,
                status: 'UNPAID',           // Only update if still UNPAID
                version: invoice.version    // And version matches (no concurrent update)
            },
            data: {
                status: newStatus,
                version: { increment: 1 }   // Increment version on update
            }
        });

        // If no rows updated, another request already processed this invoice
        if (updateResult.count === 0) {
            console.log(`⏭️ Invoice ${order_id} already processed by another request`);
            return null;  // Return null to indicate duplicate/race condition
        }

        // 2. Fetch the updated invoice
        const inv = await tx.invoice.findUnique({
            where: { id: invoice.id }
        });

        // 3. If PAID, create Payment record
        if (newStatus === 'PAID' && inv) {
            const paymentMethod = notification.payment_type || 'unknown_midtrans';
            const gatewayTrxId = notification.transaction_id || notification.approval_code || '';
            const paidAt = notification.settlement_time ? new Date(notification.settlement_time) : new Date();

            const payment = await tx.payment.create({
                data: {
                    invoiceId: invoice.id,
                    amountPaid: Number(notification.gross_amount),
                    paymentMethod: paymentMethod,
                    paymentGatewayTrxId: gatewayTrxId,
                    paidAt: paidAt,
                }
            });
            console.log(`💰 Payment record created for Invoice ${order_id}`);

            // Send payment success notification
            NotificationService.sendPaymentSuccess(invoice, payment).catch(err => {
                console.error(`Failed to send payment success notification for ${order_id}:`, err);
            });
        }

        return inv;
    });

    // Handle race condition case
    if (!updatedInvoice) {
        return { success: true, message: 'Invoice already processed', duplicate: true };
    }

    // If paid and subscription is PENDING_INSTALL, auto-create WorkOrder for installation
    if (newStatus === 'PAID' && invoice.subscription?.status === 'PENDING_INSTALL') {
        console.log(`✅ Invoice ${order_id} PAID. Creating installation work order for subscription ${invoice.subscription.id}...`);
        try {
            // Operating hours: 9 AM - 5 PM (17:00)
            const now = new Date();
            const currentHour = now.getHours();
            const OPEN_HOUR = 9;
            const CLOSE_HOUR = 17;

            let scheduledTime = new Date();

            if (currentHour >= OPEN_HOUR && currentHour < CLOSE_HOUR) {
                // Within operating hours - schedule for today (ASAP)
                // Add 1 hour buffer for preparation
                scheduledTime.setHours(currentHour + 1, 0, 0, 0);
                console.log(`🕐 Payment within operating hours. Scheduling for today.`);
            } else {
                // Outside operating hours - schedule for next day 9 AM
                scheduledTime.setDate(scheduledTime.getDate() + 1);
                scheduledTime.setHours(OPEN_HOUR, 0, 0, 0);
                console.log(`🌙 Payment outside operating hours. Scheduling for next day 9 AM.`);
            }

            const workOrder = await prisma.workOrder.create({
                data: {
                    subscriptionId: invoice.subscription.id,
                    woType: 'NEW_INSTALLATION',
                    scheduledTime: scheduledTime,
                    status: 'DRAFT',
                }
            });

            console.log(`📋 WorkOrder #${workOrder.id} created for installation. Scheduled: ${scheduledTime.toISOString()}`);
        } catch (error) {
            console.error(`❌ Failed to create work order for subscription ${invoice.subscription.id}:`, error);
        }
    }

    return { success: true, invoice: updatedInvoice };
}

/**
 * Get Midtrans Client Key (for frontend)
 */
export function getClientKey(): string {
    return process.env.MIDTRANS_CLIENT_KEY || '';
}

/**
 * Check if Midtrans is in Production mode
 */
export function isProductionMode(): boolean {
    return process.env.MIDTRANS_IS_PRODUCTION === 'true';
}

/**
 * Manually check transaction status from Midtrans API
 * Useful for debugging or when webhook is not available (localhost)
 */
export async function getTransactionStatus(orderId: string) {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

    const baseUrl = isProduction
        ? `https://api.midtrans.com/v2/${orderId}/status`
        : `https://api.sandbox.midtrans.com/v2/${orderId}/status`;

    const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64');

    const response = await fetch(baseUrl, {
        method: 'GET',
        headers: {
            'Authorization': authHeader,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
    });

    const data = await response.json();
    return data;
}
