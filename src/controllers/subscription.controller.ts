import { SubscriptionService } from "../services/subscriptions/subscription.service";
import { Context } from "elysia";
import {
    CreateSubscriptionInput,
    UpdateSubscriptionInput,
    SubscriptionFilters,
    UpgradeSubscriptionInput,
} from "../types/subscription.types";
import { SubscriptionStatus } from "@prisma/client";
import prisma from "../utils/prisma";

export class SubscriptionController {
    private subscriptionService: SubscriptionService;

    constructor() {
        this.subscriptionService = new SubscriptionService();
    }

    // POST create subscription
    create = async ({ body, set }: Context) => {
        try {
            const subscription = await this.subscriptionService.create(
                body as CreateSubscriptionInput
            );
            set.status = 201;
            return { success: true, data: subscription };
        } catch (error) {
            set.status = 400;
            return { success: false, message: (error as Error).message };
        }
    };

    // POST upgrade subscription
    upgrade = async ({ body, userId, set }: Context & { userId?: string }) => {
        // 1. Cek User ID
        if (!userId) {
            set.status = 401;
            return { success: false, message: "Sesi berakhir, silakan login kembali" };
        }

        try {
            // 2. Kirim userId ke service untuk validasi kepemilikan
            const input = body as UpgradeSubscriptionInput;
            const result = await this.subscriptionService.upgrade(
                userId,
                input
            );

            return {
                success: true,
                message: "Permintaan upgrade berhasil, silakan selesaikan pembayaran",
                data: result
            };

        } catch (error) {
            set.status = 400;
            return {
                success: false,
                message: (error as Error).message
            };
        }
    };

    // GET my subscriptions (Authenticated Customer)
    getMySubscriptions = async ({ query, userId, set }: Context & { userId?: string }) => {
        console.time("getMySubscriptions-total");
        try {
            // First, get the customer profile for this user
            console.time("findCustomerProfile");
            const customerProfile = await prisma.customerProfile.findUnique({
                where: { userId: userId }
            });
            console.timeEnd("findCustomerProfile");

            if (!customerProfile) {
                // No customer profile - return empty
                console.timeEnd("getMySubscriptions-total");
                return { success: true, data: [], total: 0 };
            }

            const filters: SubscriptionFilters = {
                status: (query as any).status as SubscriptionStatus,
                customerId: customerProfile.id, // Use customer profile ID, not user ID
                page: parseInt((query as any).page) || 1,
                limit: parseInt((query as any).limit) || 10,
            };
            console.time("subscriptionService.getAll");
            const result = await this.subscriptionService.getAll(filters);
            console.timeEnd("subscriptionService.getAll");
            console.timeEnd("getMySubscriptions-total");
            return { success: true, ...result };
        } catch (error) {
            console.timeEnd("getMySubscriptions-total");
            set.status = 400;
            return { success: false, message: (error as Error).message };
        }
    };

    // GET all subscriptions with pagination
    getAll = async ({ query, set }: Context) => {
        try {
            const filters: SubscriptionFilters = {
                status: (query as any).status as SubscriptionStatus,
                customerId: (query as any).customerId,
                packageId: (query as any).packageId,
                page: parseInt((query as any).page) || 1,
                limit: parseInt((query as any).limit) || 10,
            };
            const result = await this.subscriptionService.getAll(filters);
            return { success: true, ...result };
        } catch (error) {
            set.status = 400;
            return { success: false, message: (error as Error).message };
        }
    };

    // GET subscription by ID (with ownership check)
    getById = async ({ params, userId, role, set }: Context & { userId?: string; role?: string }) => {
        try {
            const subscription = await this.subscriptionService.getById(
                (params as any).id
            );

            // Admin & Technician can view any subscription
            if (role === "ADMIN" || role === "TECHNICIAN") {
                return { success: true, data: subscription };
            }

            // Customer: Check ownership
            const customerProfile = await prisma.customerProfile.findUnique({
                where: { userId: userId }
            });

            if (!customerProfile || subscription.customerId !== customerProfile.id) {
                set.status = 403;
                return { success: false, message: "Forbidden: Not your subscription" };
            }

            return { success: true, data: subscription };
        } catch (error) {
            set.status = 404;
            return { success: false, message: (error as Error).message };
        }
    };

    // PATCH update subscription
    update = async ({ params, body, set }: Context) => {
        try {
            const subscription = await this.subscriptionService.update(
                (params as any).id,
                body as UpdateSubscriptionInput
            );
            return { success: true, data: subscription };
        } catch (error) {
            set.status = 400;
            return { success: false, message: (error as Error).message };
        }
    };

    // DELETE (soft delete)
    delete = async ({ params, set }: Context) => {
        try {
            await this.subscriptionService.softDelete((params as any).id);
            return { success: true, message: "Subscription terminated" };
        } catch (error) {
            set.status = 400;
            return { success: false, message: (error as Error).message };
        }
    };

    // PATCH activate
    activate = async ({ params, set }: Context) => {
        try {
            const subscription = await this.subscriptionService.activate(
                (params as any).id
            );
            return { success: true, data: subscription };
        } catch (error) {
            set.status = 400;
            return { success: false, message: (error as Error).message };
        }
    };

    // PATCH isolate
    isolate = async ({ params, set }: Context) => {
        try {
            const subscription = await this.subscriptionService.isolate(
                (params as any).id
            );
            return { success: true, data: subscription };
        } catch (error) {
            set.status = 400;
            return { success: false, message: (error as Error).message };
        }
    };

    // PATCH terminate
    terminate = async ({ params, set }: Context) => {
        try {
            const subscription = await this.subscriptionService.terminate(
                (params as any).id
            );
            return { success: true, data: subscription };
        } catch (error) {
            set.status = 400;
            return { success: false, message: (error as Error).message };
        }
    };


    // get customer id status
}
