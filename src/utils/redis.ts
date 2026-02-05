import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Publisher connection
export const publisher = new Redis(REDIS_URL);

// Subscriber connection (separate connection for pub/sub)
export const subscriber = new Redis(REDIS_URL);

// General connection
export const redis = new Redis(REDIS_URL);

publisher.on("connect", () => console.log("📡 Redis Publisher connected"));
subscriber.on("connect", () => console.log("📡 Redis Subscriber connected"));
redis.on("error", (err) => console.error("❌ Redis error:", err));

export const QUEUES = {
    EMAIL_OTP: "email:otp",
};
