import { redis, QUEUES } from "../utils/redis";

export interface EmailOtpJob {
    to: string;
    otp: string;
    createdAt: string;
}

export class EmailPublisher {
    /**
     * Publish OTP email job to Redis queue
     */
    static async publishOtpEmail(to: string, otp: string): Promise<void> {
        const job: EmailOtpJob = {
            to,
            otp,
            createdAt: new Date().toISOString(),
        };

        await redis.lpush(QUEUES.EMAIL_OTP, JSON.stringify(job));
        console.log(`📤 Published email job to queue for: ${to}`);
    }
}
