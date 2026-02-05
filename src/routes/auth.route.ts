import { Elysia, t } from "elysia";
import { AuthController } from "../controllers/auth.controller";
import { jwtPlugin, deriveUser, authenticated, adminOnly, adminOrTechnician } from "../middlewares/auth.middleware";
import {
    emailPasswordSchema,
    verifyOtpSchema,
    emailOnlySchema,
    resetPasswordSchema,
    refreshTokenSchema,
    verifyEmailSchema,
    createCustomerProfileSchema,
    updateCustomerProfileSchema,
} from "../validations/auth.validation";

const authController = new AuthController();

export const AuthRoutes = new Elysia({ prefix: "/auth" })
    .use(jwtPlugin)

    // Public Routes (no auth)
    .post("/register", authController.register, {
        body: emailPasswordSchema,
    })
    .post("/login", authController.login, {
        body: emailPasswordSchema,
    })
    .post("/verify-otp", authController.verifyOtp, {
        body: verifyOtpSchema,
    })
    .post("/resend-otp", authController.resendOtp, {
        body: emailOnlySchema,
    })
    .post("/forgot-password", authController.forgotPassword, {
        body: emailOnlySchema,
    })
    .post("/verify-reset-otp", authController.verifyResetOtp, {
        body: verifyOtpSchema,
    })
    .post("/reset-password", authController.resetPassword, {
        body: resetPasswordSchema,
    })
    .post("/refresh", authController.refresh, {
        body: refreshTokenSchema,
    })
    .post("/logout", authController.logout, {
        body: refreshTokenSchema,
    })

    // Protected Routes (require auth)
    .derive(deriveUser)
    .post("/customer-profile", authController.customerProfile, {
        beforeHandle: authenticated,
        body: createCustomerProfileSchema,
    })
    .get("/profile", authController.getProfile, {
        beforeHandle: authenticated,
    })
    .put("/profile", authController.updateProfile, {
        beforeHandle: authenticated,
        body: updateCustomerProfileSchema,
    })
    .post("/logout-all", authController.logoutAllDevices, {
        beforeHandle: authenticated,
    })

    // Admin/Technician Routes
    .get("/user", authController.getUser, {
        beforeHandle: adminOrTechnician,
    })
    .patch("/user/:id/verify", authController.setEmailVerified, {
        beforeHandle: adminOnly,
        body: verifyEmailSchema,
    })
    .patch("/user/:id/role", authController.changeUserRole, {
        beforeHandle: adminOnly,
        body: t.Object({
            role: t.String(),
        }),
        detail: {
            tags: ["Auth - Admin"],
            summary: "Change user role",
            description: "Change user role to ADMIN, CUSTOMER, or TECHNICIAN (Admin only)",
        },
    });
