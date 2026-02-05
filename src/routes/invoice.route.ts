/**
 * Invoice Routes
 * Customer-facing invoice endpoints
 */

import { Elysia, t } from "elysia";
import { InvoiceController } from "../controllers/invoice.controller";
import { jwtPlugin, deriveUser, authenticated } from "../middlewares/auth.middleware";

const invoiceController = new InvoiceController();

export const InvoiceRoutes = new Elysia({ prefix: "/invoices" })
    .use(jwtPlugin)
    .derive(deriveUser)

    // Get my invoices (list)
    .get("/me", invoiceController.getMyInvoices, {
        beforeHandle: authenticated,
        query: t.Optional(t.Object({
            status: t.Optional(t.String()),
        })),
    })

    // Get current unpaid invoice
    .get("/current", invoiceController.getCurrentUnpaid, {
        beforeHandle: authenticated,
    })

    // Get invoice by ID
    .get("/:id", invoiceController.getById, {
        beforeHandle: authenticated,
    });
