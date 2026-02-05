import type { Context } from "elysia";
import prisma from "../utils/prisma";
import { tokenService } from "../services/auth/token.service";

/**
 * Admin Login Controller
 * Authenticates admin user from database
 */
export const adminLoginController = {
    async login(context: Context & { jwt: any }) {
        // Gunakan destructuring langsung dari body yang sudah divalidasi
        const { email, password } = context.body as any;

        try {
            const user = await prisma.user.findUnique({ where: { email } });

            // 1. User not found or wrong password (pake pesan yang sama demi keamanan)
            if (!user || !(await Bun.password.verify(password, user.passwordHash))) {
                context.set.status = 401;
                return { success: false, message: "Email atau password salah" };
            }

            // 2. Role Check
            if (user.role !== "ADMIN") {
                context.set.status = 403;
                return { success: false, message: "Akses ditolak" };
            }

            // 3. Status Check
            if (user.status !== "ACTIVE") {
                context.set.status = 403;
                return { success: false, message: "Akun tidak aktif" };
            }

            // 4. Token Generation (Safe BigInt)
            const userIdStr = user.id.toString();
            const accessToken = await context.jwt.sign({
                id: userIdStr,
                role: user.role
            });

            const refreshToken = await tokenService.generateRefreshToken(user.id);

            // 5. Activity Logging (Non-blocking)
            // Log admin login activity
            const { logActivity } = await import('../services/logs/activitylog.service');
            const { sanitizeForLogging } = await import('../utils/serialize');
            const ipAddress = context.request.headers.get('x-forwarded-for') ||
                context.request.headers.get('x-real-ip') ||
                'unknown';

            await logActivity({
                actorUserId: user.id.toString(), // Convert BigInt
                action: 'ADMIN_LOGIN',
                targetTable: 'User',
                targetId: user.id.toString(), // Convert BigInt
                newValue: sanitizeForLogging(user),
                ipAddress,
            }).catch(err => console.error('Failed to log ADMIN_LOGIN activity:', err));

            console.log('✅ Admin login successful:', user.email);

            return {
                success: true,
                accessToken,
                refreshToken,
                user: {
                    id: userIdStr, // Aman dari JSON error
                    email: user.email,
                    role: user.role,
                },
                message: "Login berhasil"
            };
        } catch (error: any) {
            context.set.status = 500;
            return { success: false, message: "Internal Server Error" };
        }
    }
};