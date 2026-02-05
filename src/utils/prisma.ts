import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
    adapter,
    log: ["query", "info", "warn", "error"],
});

/**
 * Request context for activity logging
 * Populated by deriveUser middleware to track userId and IP address
 */
let requestContext: { userId?: string; ipAddress?: string } = {};

export function setRequestContext(userId: string | undefined, ipAddress: string | undefined) {
    requestContext = { userId, ipAddress };
}

export function getRequestContext() {
    return requestContext;
}

export function clearRequestContext() {
    requestContext = {};
}

export default prisma;
