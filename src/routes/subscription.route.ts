import { Elysia } from "elysia";
import { SubscriptionController } from "../controllers/subscription.controller";
import { jwtPlugin, deriveUser, adminOnly, adminOrTechnician, authenticated } from "../middlewares/auth.middleware";
import {
    createSubscriptionSchema,
    updateSubscriptionSchema,
    subscriptionQuerySchema,
} from "../validations/subscription.validation";

const subscriptionController = new SubscriptionController();

export const SubscriptionRoutes = new Elysia({ prefix: "/subscriptions" })
    .use(jwtPlugin)
    .derive(deriveUser)

    .post("/", subscriptionController.create, {
        beforeHandle: authenticated,
        body: createSubscriptionSchema,
    })
    .post("/upgrade", subscriptionController.upgrade, {
        beforeHandle: authenticated,
        // validation body if needed, currently dynamic
    })
    .get("/me", subscriptionController.getMySubscriptions, {
        beforeHandle: authenticated,
    })
    .get("/", subscriptionController.getAll, {
        beforeHandle: adminOnly,
        query: subscriptionQuerySchema,
    })
    .get("/:id", subscriptionController.getById, {
        beforeHandle: authenticated,
    })
    .patch("/:id", subscriptionController.update, {
        beforeHandle: adminOnly,
        body: updateSubscriptionSchema,
    })
    .delete("/:id", subscriptionController.delete, {
        beforeHandle: adminOnly,
    })

    // Lifecycle Routes (Admin or Technician)
    .patch("/:id/activate", subscriptionController.activate, {
        beforeHandle: adminOrTechnician,
    })
    .patch("/:id/isolate", subscriptionController.isolate, {
        beforeHandle: adminOnly,
    })
    .patch("/:id/terminate", subscriptionController.terminate, {
        beforeHandle: adminOnly,
    });
