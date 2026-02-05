import { Elysia, t } from "elysia";
import { jwtPlugin, deriveUser, authenticated } from "../middlewares/auth.middleware";
import { PhoneVerificationService } from "../services/profile/phone-verification.service";

export const profileRoutes = new Elysia({ prefix: "/profile" })
    .use(jwtPlugin)
    .derive(deriveUser)
    .onBeforeHandle(authenticated as any)

    /**
     * Send OTP to phone number via WhatsApp
     */
    .post(
        "/phone/send-otp",
        async (ctx: any) => {
            const result = await PhoneVerificationService.sendOtp(ctx.body.phoneNumber);
            return result;
        },
        {
            body: t.Object({
                phoneNumber: t.String({ minLength: 10, maxLength: 15 })
            }),
            detail: {
                tags: ["Profile"],
                summary: "Send phone verification OTP via WhatsApp"
            }
        }
    )

    /**
     * Verify phone OTP
     */
    .post(
        "/phone/verify-otp",
        async (ctx: any) => {
            const result = await PhoneVerificationService.verifyOtp(
                ctx.body.phoneNumber,
                ctx.body.otp,
                ctx.userId
            );
            return result;
        },
        {
            body: t.Object({
                phoneNumber: t.String({ minLength: 10, maxLength: 15 }),
                otp: t.String({ minLength: 6, maxLength: 6 })
            }),
            detail: {
                tags: ["Profile"],
                summary: "Verify phone OTP"
            }
        }
    )

    /**
     * Get phone verification status
     */
    .get(
        "/phone/status",
        async (ctx: any) => {
            const status = await PhoneVerificationService.getStatus(ctx.userId);
            return status;
        },
        {
            detail: {
                tags: ["Profile"],
                summary: "Get phone verification status"
            }
        }
    );
