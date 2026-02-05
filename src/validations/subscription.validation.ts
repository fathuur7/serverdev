import { t } from "elysia";

/**
 * Validation schemas for Subscription endpoints
 */

export const createSubscriptionSchema = t.Object({
    customerId: t.String({ minLength: 1 }),
    packageId: t.String({ minLength: 1 }),
    installationAddressFull: t.String({ minLength: 1 }),
    geoLat: t.Number({ minimum: -90, maximum: 90 }),
    geoLong: t.Number({ minimum: -180, maximum: 180 }),
    photoHomeCustomer: t.String({ minLength: 1 }),
    activationDate: t.Optional(t.String()),
});

export const updateSubscriptionSchema = t.Partial(
    t.Object({
        installationAddressFull: t.String({ minLength: 1 }),
        geoLat: t.Number({ minimum: -90, maximum: 90 }),
        geoLong: t.Number({ minimum: -180, maximum: 180 }),
    })
);

export const subscriptionQuerySchema = t.Optional(
    t.Object({
        status: t.Optional(t.String()),
        customerId: t.Optional(t.String()),
        packageId: t.Optional(t.String()),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
    })
);
