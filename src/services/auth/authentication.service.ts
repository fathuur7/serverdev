import prisma from "../../utils/prisma";
import { OtpService } from "./otp.service";
import { EmailPublisher } from "../../events/email.publisher";
import { passwordService } from "./password.service";
import { tokenService } from "./token.service";
import type { RegisterInput } from "../../types/auth.type";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

// Rate limiting constants
const RATE_LIMIT_PREFIX = "ratelimit:email:";
const RATE_LIMIT_WINDOW = 300; // 5 minutes
const RATE_LIMIT_MAX = 3;

export class AuthenticationService {
    /**
     * Register a new user - sends OTP for verification
     */
    async register(data: RegisterInput) {
        const { email, password } = data;

        // Rate Limit Check
        const uniqueKey = email;
        const rateLimitKey = `${RATE_LIMIT_PREFIX}${uniqueKey}`;
        const attempts = await redis.incr(rateLimitKey);

        if (attempts === 1) {
            await redis.expire(rateLimitKey, RATE_LIMIT_WINDOW);
        }

        if (attempts > RATE_LIMIT_MAX) {
            // Get remaining time
            const ttl = await redis.ttl(rateLimitKey);
            const minutes = Math.ceil(ttl / 60);
            throw new Error(`Terlalu banyak permintaan OTP. Tunggu ${minutes} menit lagi.`);
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new Error("User already exists");
        }



        // Hash password
        const passwordHash = await passwordService.hashPassword(password);

        // Generate OTP
        const otp = OtpService.generate();
        const otpHash = await OtpService.hash(otp);
        const otpExpiresAt = OtpService.getExpiryDate();

        // Create user with OTP
        const newUser = await prisma.user.create({
            data: {
                email,
                passwordHash,
                role: "CUSTOMER",
                emailVerified: false,
                otp: otpHash,
                otpExpiresAt,
            },
        });

        // Publish OTP email to queue
        await EmailPublisher.publishOtpEmail(email, otp);

        const { passwordHash: _, otp: __, ...userWithoutSensitive } = newUser;
        return userWithoutSensitive;
    }

    /**
     * Verify OTP (with brute force protection)
     */
    async verifyOtp(email: string, otp: string) {
        // Rate limit for OTP verification attempts (brute force protection)
        const otpAttemptKey = `otp:attempt:${email}`;
        const attempts = await redis.incr(otpAttemptKey);

        if (attempts === 1) {
            await redis.expire(otpAttemptKey, 900); // 15 minutes lockout
        }

        if (attempts > 5) {
            const ttl = await redis.ttl(otpAttemptKey);
            const minutes = Math.ceil(ttl / 60);
            throw new Error(`Terlalu banyak percobaan OTP salah. Tunggu ${minutes} menit lagi.`);
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });


        if (!user) {
            throw new Error("User not found");
        }

        if (user.emailVerified) {
            throw new Error("Email already verified");
        }

        if (!user.otp || !user.otpExpiresAt) {
            throw new Error("No OTP found. Please request a new one.");
        }

        if (OtpService.isExpired(user.otpExpiresAt)) {
            throw new Error("OTP has expired. Please request a new one.");
        }

        const isValid = await OtpService.verify(user.otp, otp);
        if (!isValid) {
            throw new Error("Invalid OTP");
        }

        // OTP valid - clear attempt counter
        await redis.del(otpAttemptKey);

        // Mark email as verified, clear OTP
        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                otp: null,
                otpExpiresAt: null,
            },
        });

        return { message: "Email verified successfully" };
    }

    /**
     * Resend OTP
     */
    async resendOtp(email: string) {
        // Rate Limit Check
        const uniqueKey = email;
        const rateLimitKey = `${RATE_LIMIT_PREFIX}${uniqueKey}`;
        const attempts = await redis.incr(rateLimitKey);

        if (attempts === 1) {
            await redis.expire(rateLimitKey, RATE_LIMIT_WINDOW);
        }

        if (attempts > RATE_LIMIT_MAX) {
            // Get remaining time
            const ttl = await redis.ttl(rateLimitKey);
            const minutes = Math.ceil(ttl / 60);
            throw new Error(`Terlalu banyak permintaan OTP. Tunggu ${minutes} menit lagi.`);
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new Error("User not found");
        }

        if (user.emailVerified) {
            throw new Error("Email already verified");
        }

        // Generate new OTP
        const otp = OtpService.generate();
        const otpHash = await OtpService.hash(otp);
        const otpExpiresAt = OtpService.getExpiryDate();

        // Update user with new OTP
        await prisma.user.update({
            where: { id: user.id },
            data: {
                otp: otpHash,
                otpExpiresAt,
            },
        });

        // Publish OTP email to queue
        await EmailPublisher.publishOtpEmail(email, otp);

        return { message: "OTP sent successfully" };
    }

    /**
     * Login user (must be verified)
     */
    async login(email: string, password: string) {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new Error("Invalid credentials");
        }

        if (!user.emailVerified) {
            throw new Error("Email not verified. Please verify your email first.");
        }

        const isMatch = await passwordService.verifyPassword(
            password,
            user.passwordHash
        );

        if (!isMatch) {
            throw new Error("Invalid credentials");
        }

        const { passwordHash, otp, otpExpiresAt, ...userWithoutSensitive } = user;
        return userWithoutSensitive;
    }

    /**
     * Logout - Revoke refresh token
     */
    async logout(refreshToken: string) {
        await tokenService.revokeRefreshToken(refreshToken);
        return { message: "Logged out successfully" };
    }

    /**
     * Logout all devices - Delete all refresh tokens for user
     */
    async logoutAllDevices(userId: string) {
        await tokenService.revokeAllUserTokens(userId);
        return { message: "Logged out from all devices" };
    }

    /**
     * Generate refresh token
     */
    async generateRefreshToken(userId: string): Promise<string> {
        return await tokenService.generateRefreshToken(userId);
    }

    /**
     * Refresh access token
     */
    async refreshAccessToken(refreshToken: string) {
        return await tokenService.refreshAccessToken(refreshToken);
    }
}

export const authenticationService = new AuthenticationService();
