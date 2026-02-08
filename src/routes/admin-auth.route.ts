import { Elysia, t } from "elysia";
import { adminLoginController } from "../controllers/admin-auth.controller";
import { jwtPlugin, deriveUser, adminOnly } from "../middlewares/auth.middleware";


export const adminAuthRoute = new Elysia({ prefix: "/admin-auth" })
    .use(jwtPlugin) // Add JWT plugin
    .derive(deriveUser) // Extract userId and role from JWT token
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
    })
    /**
     * POST /admin-auth/register-technician
     * Register new technician (Admin only)
     */
    .post("/register-technician", adminLoginController.registerTechnician, {
        beforeHandle: adminOnly,
        body: t.Object({
            email: t.String({ format: 'email' }),
            password: t.String({ minLength: 8 }),
            employeeId: t.String({ minLength: 3 }),
            fullName: t.String({ minLength: 3 }),
            phoneNumber: t.String({ pattern: '^08[0-9]{9,11}$' }),
            specialization: t.String({ minLength: 3 })
        }),
        detail: {
            tags: ["Admin Auth"],
            summary: "Register new technician",
            description: "Admin-only endpoint to create technician account with User + TechnicianProfile",
        },
    })
    /**
     * POST /admin-auth/register-technician
     * Register new technician (Admin only)
     */
    .post("/register-technician", adminLoginController.registerTechnician, {
        beforeHandle: adminOnly,
        body: t.Object({
            email: t.String({ format: 'email' }),
            password: t.String({ minLength: 8 }),
            employeeId: t.String({ minLength: 3 }),
            fullName: t.String({ minLength: 3 }),
            phoneNumber: t.String({ pattern: '^08[0-9]{9,11}$' }),
            specialization: t.String({ minLength: 3 })
        }),
        detail: {
            tags: ["Admin Auth"],
            summary: "Register new technician",
            description: "Admin-only endpoint to create technician account with User + TechnicianProfile",
        },
    });
