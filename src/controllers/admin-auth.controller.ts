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
    },

    /**
     * Register Technician (Admin Only)
     * Creates User + TechnicianProfile in atomic transaction
     */
    async registerTechnician(context: Context & { jwt: any; userId?: string; role?: string }) {
        const {
            email,
            password,
            employeeId,
            fullName,
            phoneNumber,
            specialization
        } = context.body as any;

        try {
            // 1. Check if email already exists
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                context.set.status = 409;
                return { success: false, message: "Email already registered" };
            }

            // 2. Check if employeeId already exists
            const existingEmployee = await prisma.technicianProfile.findUnique({
                where: { employeeId }
            });
            if (existingEmployee) {
                context.set.status = 409;
                return { success: false, message: "Employee ID already exists" };
            }

            // 3. Hash password
            const passwordHash = await Bun.password.hash(password);

            // 4. Create User + TechnicianProfile in atomic transaction
            const result = await prisma.$transaction(async (tx) => {
                // Create User with TECHNICIAN role
                const user = await tx.user.create({
                    data: {
                        email,
                        passwordHash,
                        role: "TECHNICIAN",
                        status: "ACTIVE"
                    }
                });

                // Create TechnicianProfile linked to User
                const technicianProfile = await tx.technicianProfile.create({
                    data: {
                        userId: user.id,
                        employeeId,
                        fullName,
                        phoneNumber,
                        specialization,
                        currentStatus: "IDLE"
                    }
                });

                return { user, technicianProfile };
            });

            // 5. Activity Logging (Non-blocking)
            const { logActivity } = await import('../services/logs/activitylog.service');
            const { sanitizeForLogging } = await import('../utils/serialize');
            const ipAddress = context.request.headers.get('x-forwarded-for') ||
                context.request.headers.get('x-real-ip') ||
                'unknown';

            await logActivity({
                actorUserId: context.userId || 'system',
                action: 'CREATE_TECHNICIAN',
                targetTable: 'TechnicianProfile',
                targetId: result.technicianProfile.id,
                newValue: sanitizeForLogging(result.technicianProfile),
                ipAddress,
            }).catch(err => console.error('Failed to log CREATE_TECHNICIAN activity:', err));

            // 6. Send WhatsApp notification with credentials (Non-blocking)
            const { WhatsAppService } = await import('../services/notifications/whatsapp.service');
            await WhatsAppService.sendTechnicianCredentials(
                phoneNumber,
                fullName,
                email,
                password,
                employeeId
            ).catch(err => console.error('Failed to send WhatsApp credentials:', err));

            console.log('✅ Technician registered successfully:', email);

            return {
                success: true,
                user: {
                    id: result.user.id,
                    email: result.user.email,
                    role: result.user.role,
                    status: result.user.status
                },
                technicianProfile: {
                    id: result.technicianProfile.id,
                    employeeId: result.technicianProfile.employeeId,
                    fullName: result.technicianProfile.fullName,
                    phoneNumber: result.technicianProfile.phoneNumber,
                    specialization: result.technicianProfile.specialization,
                    currentStatus: result.technicianProfile.currentStatus
                },
                message: "Technician registered successfully. Credentials sent via WhatsApp."
            };
        } catch (error: any) {
            console.error('❌ Technician registration error:', error);
            context.set.status = 500;
            return { success: false, message: "Internal Server Error" };
        }
    }
};