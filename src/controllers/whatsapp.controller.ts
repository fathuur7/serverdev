import { Context } from "elysia";
import Redis from "ioredis";

export class WhatsAppController {
    private redis: Redis;

    constructor() {
        this.redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
    }

    getStatus = async ({ set }: Context) => {
        try {
            const [status, qr, timestamp] = await Promise.all([
                this.redis.get("whatsapp:status"),
                this.redis.get("whatsapp:qr"),
                this.redis.get("whatsapp:timestamp"),
            ]);

            return {
                success: true,
                data: {
                    status: status || "unknown",
                    qr: qr || null,
                    timestamp: timestamp ? parseInt(timestamp) : Date.now(),
                },
            };
        } catch (error) {
            set.status = 500;
            return {
                success: false,
                message: (error as Error).message,
            };
        }
    };

    logout = async ({ set }: Context) => {
        try {
            // Clear Redis status
            await this.redis.del("whatsapp:qr");
            await this.redis.del("whatsapp:status");
            await this.redis.del("whatsapp:timestamp");

            // Publish logout event to worker
            await this.redis.publish("whatsapp:logout", "logout");

            return {
                success: true,
                message: "WhatsApp logged out successfully",
            };
        } catch (error) {
            set.status = 500;
            return {
                success: false,
                message: (error as Error).message,
            };
        }
    };
}
