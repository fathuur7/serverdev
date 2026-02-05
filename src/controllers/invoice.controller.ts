/**
 * Invoice Controller
 * Handles invoice-related endpoints for customers
 */

import { Context } from "elysia";
import { InvoiceService } from "../services/Invoices/invoice.service";

const invoiceService = new InvoiceService();

export class InvoiceController {
    /**
     * Get my invoices (for authenticated customer)
     * GET /invoices/me
     */
    getMyInvoices = async ({ query, userId, set }: Context & { userId?: string }) => {
        if (!userId) {
            set.status = 401;
            return { success: false, message: "Unauthorized" };
        }

        try {
            const status = (query as any).status as string | undefined;
            const invoices = await invoiceService.getMyInvoices(userId, status);

            return {
                success: true,
                data: invoices,
            };
        } catch (error) {
            set.status = 400;
            return {
                success: false,
                message: (error as Error).message,
            };
        }
    };

    /**
     * Get current unpaid invoice (for billing page)
     * GET /invoices/current
     */
    getCurrentUnpaid = async ({ userId, set }: Context & { userId?: string }) => {
        if (!userId) {
            set.status = 401;
            return { success: false, message: "Unauthorized" };
        }

        try {
            const invoice = await invoiceService.getCurrentUnpaidInvoice(userId);

            return {
                success: true,
                data: invoice, // null if no unpaid invoice
            };
        } catch (error) {
            set.status = 400;
            return {
                success: false,
                message: (error as Error).message,
            };
        }
    };

    /**
     * Get invoice by ID
     * GET /invoices/:id
     */
    getById = async ({ params, userId, set }: Context & { userId?: string }) => {
        if (!userId) {
            set.status = 401;
            return { success: false, message: "Unauthorized" };
        }

        try {
            const invoice = await invoiceService.getById((params as any).id);

            if (!invoice) {
                set.status = 404;
                return { success: false, message: "Invoice not found" };
            }

            // Security: Check if invoice belongs to user
            if (invoice.subscription?.customerId !== userId) {
                set.status = 403;
                return { success: false, message: "Access denied" };
            }

            return {
                success: true,
                data: invoice,
            };
        } catch (error) {
            set.status = 400;
            return {
                success: false,
                message: (error as Error).message,
            };
        }
    };
}
