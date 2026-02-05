import prisma from "../../utils/prisma";

export class TokenService {
    /**
     * Generate refresh token (180 days expiry)
     */
    async generateRefreshToken(userId: string): Promise<string> {
        const token = this.generateRandomToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 180); // 180 days

        await prisma.refreshToken.create({
            data: {
                userId,
                token,
                expiresAt,
            },
        });

        return token;
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken(refreshToken: string) {
        const tokenRecord = await prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true },
        });

        if (!tokenRecord) {
            throw new Error("Invalid refresh token");
        }

        if (tokenRecord.expiresAt < new Date()) {
            // Clean up expired token
            await prisma.refreshToken.delete({
                where: { token: refreshToken },
            });
            throw new Error("Refresh token expired");
        }

        const { passwordHash, otp, otpExpiresAt, ...userWithoutSensitive } =
            tokenRecord.user;

        return userWithoutSensitive;
    }

    /**
     * Revoke (logout) a single refresh token
     */
    async revokeRefreshToken(refreshToken: string): Promise<void> {
        const tokenRecord = await prisma.refreshToken.findUnique({
            where: { token: refreshToken },
        });

        if (!tokenRecord) {
            throw new Error("Invalid refresh token");
        }

        await prisma.refreshToken.delete({
            where: { token: refreshToken },
        });
    }

    /**
     * Revoke all refresh tokens for a user (logout all devices)
     */
    async revokeAllUserTokens(userId: string): Promise<void> {
        await prisma.refreshToken.deleteMany({
            where: { userId },
        });
    }

    /**
     * Generate random token string
     */
    private generateRandomToken(): string {
        return Array.from({ length: 64 }, () =>
            Math.floor(Math.random() * 16).toString(16)
        ).join("");
    }
}

export const tokenService = new TokenService();
