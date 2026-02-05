import { AuthService } from "../services/auth";
import { Context } from "elysia";
import type { RegisterType, LoginType, CreateProfileBody } from "../types/auth.type"

export class AuthController {
    private authService: AuthService;

    constructor() {
        this.authService = new AuthService();
    }

    register = async ({ body, set }: Context) => {
        try {
            const { email, password } = body as RegisterType;
            const user = await this.authService.register({ email, password });
            set.status = 201;
            return {
                success: true,
                message: "Registration successful. Please check your email for OTP verification.",
                data: user,
            };
        } catch (error) {
            set.status = 400;
            return {
                success: false,
                message: (error as Error).message,
            };
        }
    };

    verifyOtp = async ({ body, set }: Context) => {
        try {
            const { email, otp } = body as { email: string; otp: string };
            const result = await this.authService.verifyOtp(email, otp);
            return {
                success: true,
                message: result.message,
            };
        } catch (error) {
            set.status = 400;
            return {
                success: false,
                message: (error as Error).message,
            };
        }
    };

    resendOtp = async ({ body, set }: Context) => {
        try {
            const { email } = body as { email: string };
            const result = await this.authService.resendOtp(email);
            return {
                success: true,
                message: result.message,
            };
        } catch (error) {
            set.status = 400;
            return {
                success: false,
                message: (error as Error).message,
            };
        }
    };

    login = async ({ body, set, jwt, request }: Context & { jwt: any }) => {
        try {
            const { email, password } = body as LoginType;
            const user = await this.authService.login(email, password);

            // Access token expires in 1 hour
            const accessToken = await jwt.sign({
                id: user.id,
                role: user.role,
                exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
            });

            // Generate refresh token (180 days)
            const refreshToken = await this.authService.generateRefreshToken(user.id);

            // Log activity
            const { logActivity } = await import('../services/logs/activitylog.service');
            const { sanitizeForLogging } = await import('../utils/serialize');
            const ipAddress = request.headers.get('x-forwarded-for') ||
                request.headers.get('x-real-ip') ||
                'unknown';

            await logActivity({
                actorUserId: user.id.toString(), // Convert BigInt
                action: 'LOGIN',
                targetTable: 'User',
                targetId: user.id.toString(), // Convert BigInt
                newValue: sanitizeForLogging(user),
                ipAddress,
            }).catch(err => console.error('Failed to log LOGIN activity:', err));

            return {
                success: true,
                data: {
                    ...user,
                    accessToken,
                    refreshToken,
                    expiresIn: 3600, // 1 hour in seconds
                },
            };
        } catch (error) {
            set.status = 401;
            return {
                success: false,
                message: (error as Error).message,
            };
        }
    };

    customerProfile = async ({ body, set, userId }: Context & { userId?: string }) => {
        try {
            if (!userId) {
                set.status = 401;
                return { success: false, message: "Unauthorized" };
            }
            const { fullName, nik, phoneNumber, secondaryPhone, npwp, address, city, province, postalCode, phoneVerified } = body as CreateProfileBody;

            const profile = await this.authService.customerProfile(userId, {
                fullName,
                nik,
                phoneNumber,
                secondaryPhone,
                npwp,
                address,
                city,
                province,
                postalCode,
                phoneVerified,
            });

            set.status = 201;
            return { success: true, data: profile };
        } catch (error) {
            set.status = 400;
            return { success: false, message: (error as Error).message };
        }
    };

    getProfile = async ({ set, userId }: Context & { userId?: string }) => {
        try {
            if (!userId) {
                set.status = 401;
                return { success: false, message: "Unauthorized" };
            }
            const profile = await this.authService.getProfile(userId);
            return { success: true, data: profile };
        } catch (error) {
            set.status = 400;
            return { success: false, message: (error as Error).message };
        }
    };

    updateProfile = async ({ body, set, userId }: Context & { userId?: string }) => {
        try {
            if (!userId) {
                set.status = 401;
                return { success: false, message: "Unauthorized" };
            }
            const profile = await this.authService.updateProfile(userId, body as any);
            return { success: true, data: profile };
        } catch (error) {
            set.status = 400;
            return { success: false, message: (error as Error).message };
        }
    };

    getUser = async ({ set }: Context) => {
        try {
            const users = await this.authService.getUser();
            return { success: true, data: users };
        } catch (error) {
            set.status = 400;
            return { success: false, message: (error as Error).message };
        }
    };

    setEmailVerified = async ({ params, body, set }: Context) => {
        try {
            const userId = (params as any).id as string;
            const { verified } = body as { verified: boolean };

            const user = await this.authService.setEmailVerified(userId, verified);
            return {
                success: true,
                message: `Email verification status set to ${verified}`,
                data: user,
            };
        } catch (error) {
            set.status = 400;
            return { success: false, message: (error as Error).message };
        }
    };

    forgotPassword = async ({ body, set }: Context) => {
        try {
            const { email } = body as { email: string };
            const result = await this.authService.forgotPassword(email);
            return { success: true, message: result.message };
        } catch (error) {
            set.status = 400;
            return { success: false, message: (error as Error).message };
        }
    };

    verifyResetOtp = async ({ body, set }: Context) => {
        try {
            const { email, otp } = body as { email: string; otp: string };
            const result = await this.authService.verifyResetOtp(email, otp);
            return { success: true, message: result.message };
        } catch (error) {
            set.status = 400;
            return { success: false, message: (error as Error).message };
        }
    };

    resetPassword = async ({ body, set }: Context) => {
        try {
            const { email, otp, password } = body as { email: string; otp: string; password: string };
            const result = await this.authService.resetPassword(email, otp, password);
            return { success: true, message: result.message };
        } catch (error) {
            set.status = 400;
            return { success: false, message: (error as Error).message };
        }
    };

    refresh = async ({ body, set, jwt }: Context & { jwt: any }) => {
        try {
            const { refreshToken } = body as { refreshToken: string };
            const user = await this.authService.refreshAccessToken(refreshToken);

            // Generate new access token (1 hour)
            const accessToken = await jwt.sign({
                id: user.id,
                role: user.role,
                exp: Math.floor(Date.now() / 1000) + (60 * 60),
            });

            return {
                success: true,
                data: {
                    accessToken,
                    expiresIn: 3600,
                },
            };
        } catch (error) {
            set.status = 401;
            return { success: false, message: (error as Error).message };
        }
    };

    logout = async ({ body, set }: Context) => {
        try {
            const { refreshToken } = body as { refreshToken: string };
            const result = await this.authService.logout(refreshToken);
            return { success: true, message: result.message };
        } catch (error) {
            set.status = 400;
            return { success: false, message: (error as Error).message };
        }
    };

    logoutAllDevices = async ({ set, userId }: Context & { userId?: string }) => {
        try {
            if (!userId) {
                set.status = 401;
                return { success: false, message: "Unauthorized" };
            }
            const result = await this.authService.logoutAllDevices(userId);
            return { success: true, message: result.message };
        } catch (error) {
            set.status = 400;
            return { success: false, message: (error as Error).message };
        }
    };

    changeUserRole = async ({ params, body, set }: Context) => {
        try {
            const userId = (params as any).id as string;
            const { role } = body as { role: "ADMIN" | "CUSTOMER" | "TECHNICIAN" };

            if (!role) {
                set.status = 400;
                return { success: false, message: "Role is required" };
            }

            const result = await this.authService.changeUserRole(userId, role);
            return {
                success: true,
                message: result.message,
                data: result.user,
            };
        } catch (error) {
            set.status = 400;
            return { success: false, message: (error as Error).message };
        }
    };
}
