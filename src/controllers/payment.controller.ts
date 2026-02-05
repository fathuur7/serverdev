/**
 * Payment Controller
 * Handles payment creation and webhook callbacks
 */

import { Context } from "elysia";
import * as midtransService from "../services/payment/midtrans.service";

export class PaymentController {
    /**
     * Create Snap Payment Token
     * POST /payments/create
     */
    createPayment = async ({ body, userId, set }: Context & { userId?: string }) => {
        if (!userId) {
            set.status = 401;
            return { success: false, message: "Unauthorized" };
        }

        try {
            const { invoiceId } = body as { invoiceId: string };

            if (!invoiceId) {
                set.status = 400;
                return { success: false, message: "Invoice ID is required" };
            }

            const result = await midtransService.createSnapTransaction(invoiceId);

            return {
                success: true,
                data: {
                    token: result.token,
                    redirectUrl: result.redirect_url,
                    clientKey: midtransService.getClientKey(),
                    isProduction: midtransService.isProductionMode(),
                }
            };
        } catch (error) {
            set.status = 400;
            return {
                success: false,
                message: (error as Error).message
            };
        }
    };

    /**
     * Handle Midtrans Webhook Notification
     * POST /payments/webhook
     */
    handleWebhook = async ({ body, set }: Context) => {
        try {
            const notification = body as any;

            // Log incoming webhook for debugging
            console.log('📥 Midtrans Webhook:', JSON.stringify(notification, null, 2));

            const result = await midtransService.handleMidtransNotification(notification);

            if (!result.success) {
                set.status = 404;
                return result;
            }

            return { success: true, message: 'Notification processed' };
        } catch (error) {
            console.error('Webhook Error:', error);
            set.status = 500;
            return {
                success: false,
                message: (error as Error).message
            };
        }
    };

    /**
     * Get Midtrans Config (Client Key for frontend)
     * GET /payments/config
     */
    getConfig = async ({ set }: Context) => {
        return {
            success: true,
            data: {
                clientKey: midtransService.getClientKey(),
                isProduction: midtransService.isProductionMode(),
            }
        };
    };

    /**
     * Manual Check Payment Status
     * GET /payments/:orderId/status
     */
    checkStatus = async ({ params, set }: Context) => {
        try {
            const { orderId } = params as { orderId: string };

            // 1. Get status from Midtrans API
            const statusData = await midtransService.getTransactionStatus(orderId);

            // 2. Process using same logic as webhook
            // statusData has same structure as notification
            const result = await midtransService.handleMidtransNotification(statusData as any);

            return {
                success: true,
                data: result,
                midtrans: statusData
            };
        } catch (error) {
            set.status = 400;
            return {
                success: false,
                message: (error as Error).message
            };
        }
    }
}
