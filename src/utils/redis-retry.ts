/**
 * Redis Retry Utility
 * Handles INT-001: Redis down scenarios with exponential backoff
 */

import type Redis from 'ioredis';

interface RetryOptions {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    exponentialFactor?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
    maxRetries: 3,
    initialDelay: 100,    // ms
    maxDelay: 5000,       // ms
    exponentialFactor: 2
};

/**
 * Retry a Redis operation with exponential backoff
 */
export async function retryRedisOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    options: RetryOptions = {}
): Promise<T> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;

            if (attempt < opts.maxRetries) {
                const delay = Math.min(
                    opts.initialDelay * Math.pow(opts.exponentialFactor, attempt),
                    opts.maxDelay
                );

                console.warn(`⚠️ Redis ${operationName} failed (attempt ${attempt + 1}/${opts.maxRetries + 1}). Retrying in ${delay}ms...`);
                console.warn(`   Error: ${lastError.message}`);

                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    console.error(`❌ Redis ${operationName} failed after ${opts.maxRetries + 1} attempts`);
    throw lastError;
}

/**
 * Publish to Redis with retry and fallback
 * Returns true if published, false if failed (graceful degradation)
 */
export async function publishWithRetry(
    redis: Redis,
    channel: string,
    message: string,
    options?: RetryOptions
): Promise<boolean> {
    try {
        await retryRedisOperation(
            () => redis.publish(channel, message),
            `publish to ${channel}`,
            options
        );
        return true;
    } catch (error) {
        console.error(`Failed to publish to Redis channel ${channel}:`, error);
        // Graceful degradation - don't crash the app
        return false;
    }
}

/**
 * Get from Redis with retry
 */
export async function getWithRetry(
    redis: Redis,
    key: string,
    options?: RetryOptions
): Promise<string | null> {
    try {
        return await retryRedisOperation(
            () => redis.get(key),
            `get ${key}`,
            options
        );
    } catch (error) {
        console.error(`Failed to get from Redis key ${key}:`, error);
        return null;
    }
}

/**
 * Set to Redis with retry
 */
export async function setWithRetry(
    redis: Redis,
    key: string,
    value: string,
    options?: RetryOptions
): Promise<boolean> {
    try {
        await retryRedisOperation(
            () => redis.set(key, value),
            `set ${key}`,
            options
        );
        return true;
    } catch (error) {
        console.error(`Failed to set Redis key ${key}:`, error);
        return false;
    }
}
