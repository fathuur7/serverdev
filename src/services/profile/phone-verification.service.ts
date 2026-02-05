import Redis from "ioredis";
import { OtpService } from "../auth/otp.service";
import { WhatsAppService } from "../notifications/whatsapp.service";
import prisma from "../../utils/prisma";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

// Redis key prefix for phone OTP
const PHONE_OTP_PREFIX = "phone_otp:";
const OTP_TTL_SECONDS = 600; // 10 minutes

// Rate limiting constants
const RATE_LIMIT_PREFIX = "ratelimit:phone:";
const RATE_LIMIT_WINDOW = 300; // 5 minutes
const RATE_LIMIT_MAX = 3;

export class PhoneVerificationService {
    /**
     * Send OTP to phone number via WhatsApp
     */
    static async sendOtp(phoneNumber: string): Promise<{ success: boolean; message: string }> {
        try {
            // Normalize phone number (remove leading 0, add 62)
            const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

            // Rate Limit Check
            const uniqueKey = normalizedPhone; // Use phone number as key
            const rateLimitKey = `${RATE_LIMIT_PREFIX}${uniqueKey}`;
            const attempts = await redis.incr(rateLimitKey);

            if (attempts === 1) {
                await redis.expire(rateLimitKey, RATE_LIMIT_WINDOW);
            }

            if (attempts > RATE_LIMIT_MAX) {
                // Get remaining time
                const ttl = await redis.ttl(rateLimitKey);
                const minutes = Math.ceil(ttl / 60);
                return {
                    success: false,
                    message: `Terlalu banyak permintaan OTP. Tunggu ${minutes} menit lagi.`
                };
            }

            // Generate OTP
            const otp = OtpService.generate();
            const otpHash = await OtpService.hash(otp);

            // Store OTP hash in Redis with TTL
            const redisKey = `${PHONE_OTP_PREFIX}${normalizedPhone}`;
            await redis.setex(redisKey, OTP_TTL_SECONDS, otpHash);

            // Send OTP via WhatsApp
            const message = `
            *Akses S.Net Anda*

            Gunakan kode OTP berikut untuk melanjutkan proses login:

            👉 [ *${otp}* ] 👈

            *Berlaku hingga:* ${new Date(Date.now() + 10 * 60000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB

            Bukan Anda yang meminta kode ini? Hubungi Customer Service kami segera.
            `.trim();

            await WhatsAppService.sendMessage(normalizedPhone, message);

            console.log(`📱 Phone OTP sent to ${normalizedPhone}`);

            return {
                success: true,
                message: "OTP telah dikirim ke WhatsApp Anda"
            };
        } catch (error) {
            console.error("❌ Failed to send phone OTP:", error);
            return {
                success: false,
                message: "Gagal mengirim OTP. Coba lagi nanti."
            };
        }
    }

    /**
     * Verify OTP for phone number
     */
    static async verifyOtp(
        phoneNumber: string,
        otp: string,
        userId: string
    ): Promise<{ success: boolean; message: string }> {
        // Normalize phone number (remove leading 0, add 62)
        const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
        const redisKey = `${PHONE_OTP_PREFIX}${normalizedPhone}`;

        try {
            // Get OTP hash from Redis
            const storedHash = await redis.get(redisKey);

            if (!storedHash) {
                return {
                    success: false,
                    message: "OTP tidak ditemukan atau sudah kadaluarsa. Kirim ulang OTP."
                };
            }

            // Verify OTP
            const isValid = await OtpService.verify(storedHash, otp);

            if (!isValid) {
                return {
                    success: false,
                    message: "Kode OTP salah. Silakan coba lagi."
                };
            }

            // OTP valid - mark phone as verified
            await prisma.customerProfile.update({
                where: { userId },
                data: { phoneVerified: true }
            });

            // Delete OTP from Redis
            await redis.del(redisKey);

            console.log(`✅ Phone verified for user ${userId}: ${normalizedPhone}`);

            return {
                success: true,
                message: "Nomor HP berhasil diverifikasi!"
            };
        } catch (error: any) {
            // Handle P2025 (Record to update not found) - this is expected if profile doesn't exist yet
            if (error.code === 'P2025') {
                console.log(`✅ Phone verified (pre-profile) for user ${userId}: ${normalizedPhone}`);
                // Delete OTP from Redis as it was used
                await redis.del(redisKey);
                return {
                    success: true,
                    message: "Nomor HP berhasil diverifikasi!"
                };
            }

            console.error("❌ Failed to verify phone OTP:", error);
            return {
                success: false,
                message: "Gagal verifikasi OTP. Coba lagi nanti."
            };
        }
    }

    /**
     * Get phone verification status
     */
    static async getStatus(userId: string): Promise<{ verified: boolean; phone: string | null }> {
        const profile = await prisma.customerProfile.findUnique({
            where: { userId },
            select: { phoneNumber: true, phoneVerified: true }
        });

        return {
            verified: profile?.phoneVerified ?? false,
            phone: profile?.phoneNumber ?? null
        };
    }

    /**
     * Normalize phone number to international format (62xxx)
     */
    private static normalizePhoneNumber(phone: string): string {
        // Remove all non-digit characters
        let normalized = phone.replace(/\D/g, "");

        // Handle different formats
        if (normalized.startsWith("0")) {
            // 08xxx -> 628xxx
            normalized = "62" + normalized.slice(1);
        } else if (normalized.startsWith("8")) {
            // 8xxx -> 628xxx
            normalized = "62" + normalized;
        } else if (!normalized.startsWith("62")) {
            // Assume Indonesian if not starting with 62
            normalized = "62" + normalized;
        }

        return normalized;
    }
}
