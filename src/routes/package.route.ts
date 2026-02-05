import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { PackageController } from "../controllers/package.controller";

const packageController = new PackageController();

export const PackageRoutes = new Elysia({ prefix: "/packages" })
    .use(
        jwt({
            name: "jwt",
            secret: process.env.JWT_SECRET || "s3cr3t",
        })
    )
    // Public routes
    .get("/", packageController.getAll)
    .get("/active", packageController.getActive)
    .get("/:id", packageController.getById)
    // Protected routes (Admin only)
    .derive(async ({ jwt, headers: { authorization } }) => {
        if (!authorization?.startsWith("Bearer ")) {
            return {};
        }
        const token = authorization.slice(7);
        const profile = await jwt.verify(token);
        if (!profile) {
            return {};
        }
        return {
            userId: profile.id as string,
            role: profile.role as string,
        };
    })
    .post(
        "/",
        packageController.create,
        {
            beforeHandle({ userId, role, set }) {
                if (!userId) {
                    set.status = 401;
                    return { success: false, message: "Unauthorized" };
                }
                if (role !== "ADMIN") {
                    set.status = 403;
                    return { success: false, message: "Forbidden: Admin only" };
                }
            },
            body: t.Object({
                name: t.String({ minLength: 1 }),
                downloadSpeedMbps: t.Number({ minimum: 1 }),
                uploadSpeedMbps: t.Number({ minimum: 1 }),
                monthlyPrice: t.Number({ minimum: 0 }),
                slaPercentage: t.Number({ minimum: 0, maximum: 100 }),
                contractDurationMonths: t.Number({ minimum: 1 }),
                description: t.Optional(t.String()),
                imageUrl: t.Optional(t.String()),
                isActive: t.Optional(t.Boolean()),
            }),
        }
    )
    .put(
        "/:id",
        packageController.update,
        {
            beforeHandle({ userId, role, set }) {
                if (!userId) {
                    set.status = 401;
                    return { success: false, message: "Unauthorized" };
                }
                if (role !== "ADMIN") {
                    set.status = 403;
                    return { success: false, message: "Forbidden: Admin only" };
                }
            },
            body: t.Partial(
                t.Object({
                    name: t.String({ minLength: 1 }),
                    downloadSpeedMbps: t.Number({ minimum: 1 }),
                    uploadSpeedMbps: t.Number({ minimum: 1 }),
                    monthlyPrice: t.Number({ minimum: 0 }),
                    slaPercentage: t.Number({ minimum: 0, maximum: 100 }),
                    contractDurationMonths: t.Number({ minimum: 1 }),
                    description: t.String(),
                    imageUrl: t.String(),
                    isActive: t.Boolean(),
                })
            ),
        }
    )
    .delete(
        "/:id",
        packageController.delete,
        {
            beforeHandle({ userId, role, set }) {
                if (!userId) {
                    set.status = 401;
                    return { success: false, message: "Unauthorized" };
                }
                if (role !== "ADMIN") {
                    set.status = 403;
                    return { success: false, message: "Forbidden: Admin only" };
                }
            },
        }
    )
    .patch(
        "/:id/toggle",
        packageController.toggleActive,
        {
            beforeHandle({ userId, role, set }) {
                if (!userId) {
                    set.status = 401;
                    return { success: false, message: "Unauthorized" };
                }
                if (role !== "ADMIN") {
                    set.status = 403;
                    return { success: false, message: "Forbidden: Admin only" };
                }
            },
        }
    );
