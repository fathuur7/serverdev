/**
 * OTP Service - Generates and verifies OTPs
 */
export class OtpService {
    private static readonly OTP_LENGTH = 6;
    private static readonly OTP_EXPIRY_MINUTES = 10;

    /**
     * Generate a random 6-digit OTP
     */
    static generate(): string {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        return otp;
    }

    /**
     * Hash OTP before storing (using Bun's password hash)
     */
    static async hash(otp: string): Promise<string> {
        return await Bun.password.hash(otp);
    }

    /**
     * Verify OTP against stored hash
     */
    static async verify(storedHash: string, providedOtp: string): Promise<boolean> {
        return await Bun.password.verify(providedOtp, storedHash);
    }

    /**
     * Get expiry date (current time + expiry minutes)
     */
    static getExpiryDate(): Date {
        const expiry = new Date();
        expiry.setMinutes(expiry.getMinutes() + this.OTP_EXPIRY_MINUTES);
        return expiry;
    }

    /**
     * Check if OTP has expired
     */
    static isExpired(expiryDate: Date): boolean {
        return new Date() > expiryDate;
    }
}
