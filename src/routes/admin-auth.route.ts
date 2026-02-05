import { Elysia, t } from "elysia";
import { adminLoginController } from "../controllers/admin-auth.controller";
import { jwtPlugin } from "../middlewares/auth.middleware";

console.log('📌 Admin Auth Route Loaded');

export const adminAuthRoute = new Elysia({ prefix: "/admin-auth" })
    .use(jwtPlugin) // Add JWT plugin
    .onRequest((context) => {
        console.log('🔵 Request to admin-auth:', context.request.method, context.request.url);
    })
    /**
     * POST /admin-auth/login
     * Admin login with database authentication
     */
    .post("/login", adminLoginController.login, {
        body: t.Object({
            email: t.String(),
            password: t.String(),
        }),
        detail: {
            tags: ["Admin Auth"],
            summary: "Admin login",
            description: "Login endpoint for admin panel",
        },
    });
