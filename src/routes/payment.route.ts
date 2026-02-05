/**
 * Payment Routes
 */

import { Elysia, t } from "elysia";
import { PaymentController } from "../controllers/payment.controller";
import { jwtPlugin, deriveUser, authenticated } from "../middlewares/auth.middleware";

const paymentController = new PaymentController();

export const PaymentRoutes = new Elysia({ prefix: "/payments" })
    .use(jwtPlugin)
    .derive(deriveUser)

    // Create payment token (requires auth)
    .post("/create", paymentController.createPayment, {
        beforeHandle: authenticated,
        body: t.Object({
            invoiceId: t.String(),
        }),
    })

    // Webhook from Midtrans (no auth, public endpoint)
    .post("/webhook", paymentController.handleWebhook)

    // Get Midtrans config for frontend
    .get("/config", paymentController.getConfig)

    // Manual status check (for debugging/localhost)
    .get("/:orderId/status", paymentController.checkStatus, {
        beforeHandle: authenticated,
    });
