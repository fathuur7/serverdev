import type { Context } from "elysia";
import prisma from "../utils/prisma";
import { tokenService } from "../services/auth/token.service";

/**
 * Technician Login Controller
 * Authenticates technician user from database
 */
export const technicianLoginController = {
    async login(context: Context & { jwt: any }) {
        // Destructure email & password from validated body
        const { email, password } = context.body as any;

        try {
            const user = await prisma.user.findUnique({ where: { email } });

            // 1. User not found or wrong password (same message for security)
            if (!user || !(await Bun.password.verify(password, user.passwordHash))) {
                context.set.status = 401;
                return { success: false, message: "Email atau password salah" };
            }

            // 2. Role Check - Must be TECHNICIAN
            if (user.role !== "TECHNICIAN") {
                context.set.status = 403;
                return { success: false, message: "Akses ditolak" };
            }

            // 3. Status Check - Must be ACTIVE
            if (user.status !== "ACTIVE") {
                context.set.status = 403;
                return { success: false, message: "Akun tidak aktif" };
            }

            // 4. Token Generation (Safe BigInt conversion)
            const userIdStr = user.id.toString();
            const accessToken = await context.jwt.sign({
                id: userIdStr,
                role: user.role
            });

            const refreshToken = await tokenService.generateRefreshToken(user.id);

            // 5. Activity Logging (Non-blocking)
            const { logActivity } = await import('../services/logs/activitylog.service');
            const { sanitizeForLogging } = await import('../utils/serialize');
            const ipAddress = context.request.headers.get('x-forwarded-for') ||
                context.request.headers.get('x-real-ip') ||
                'unknown';

            await logActivity({
                actorUserId: user.id.toString(),
                action: 'TECHNICIAN_LOGIN',
                targetTable: 'User',
                targetId: user.id.toString(),
                newValue: sanitizeForLogging(user),
                ipAddress,
            }).catch(err => console.error('Failed to log TECHNICIAN_LOGIN activity:', err));

            console.log('✅ Technician login successful:', user.email);

            return {
                success: true,
                accessToken,
                refreshToken,
                user: {
                    id: userIdStr,
                    email: user.email,
                    role: user.role,
                },
                message: "Login berhasil"
            };
        } catch (error: any) {
            console.error('❌ Technician login error:', error);
            context.set.status = 500;
            return { success: false, message: "Internal Server Error" };
        }
    }
};
