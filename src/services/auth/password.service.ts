import prisma from "../../utils/prisma";
import { OtpService } from "./otp.service";

export class PasswordService {
    /**
     * Hash password using Bun's built-in hasher
     */
    async hashPassword(password: string): Promise<string> {
        return await Bun.password.hash(password);
    }

    /**
     * Verify password against hash
     */
    async verifyPassword(password: string, hash: string): Promise<boolean> {
        return await Bun.password.verify(password, hash);
    }

    /**
     * Forgot password - Send reset OTP
     */
    async forgotPassword(email: string): Promise<{ message: string }> {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new Error("User not found");
        }

        // Generate reset OTP
        const otp = OtpService.generate();
        const otpHash = await OtpService.hash(otp);
        const otpExpiresAt = OtpService.getExpiryDate();

        // Store OTP in user record
        await prisma.user.update({
            where: { email },
            data: {
                otp: otpHash,
                otpExpiresAt,
            },
        });

        // TODO: Send OTP via email
        console.log(`Password reset OTP for ${email}: ${otp}`);

        return { message: "Password reset OTP sent to your email" };
    }

    /**
     * Verify reset OTP
     */
    async verifyResetOtp(email: string, otp: string): Promise<{ message: string }> {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new Error("User not found");
        }

        if (!user.otp || !user.otpExpiresAt) {
            throw new Error("No reset OTP found. Please request a new one.");
        }

        if (OtpService.isExpired(user.otpExpiresAt)) {
            throw new Error("Reset OTP has expired");
        }

        const isValid = await OtpService.verify(user.otp, otp);
        if (!isValid) {
            throw new Error("Invalid reset OTP");
        }

        return { message: "Reset OTP verified successfully" };
    }

    /**
     * Reset password with OTP
     */
    async resetPassword(
        email: string,
        otp: string,
        newPassword: string
    ): Promise<{ message: string }> {
        // Verify OTP first
        await this.verifyResetOtp(email, otp);

        // Hash new password
        const passwordHash = await this.hashPassword(newPassword);

        // Update password and clear OTP
        await prisma.user.update({
            where: { email },
            data: {
                passwordHash,
                otp: null,
                otpExpiresAt: null,
            },
        });

        return { message: "Password reset successfully" };
    }
}

export const passwordService = new PasswordService();
