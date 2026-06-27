async function slidingWindow(redis, key, { limit, windowMs }) {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Remove expired entries
    await redis.zremrangebyscore(key, 0, windowStart);

    // Add current request
    await redis.zadd(key, {
        score: now,
        member: `${now}-${Math.random()}`
    });

    // Count requests in current window
    const count = await redis.zcount(key, windowStart, now);

    // Expire key automatically
    await redis.expire(key, Math.ceil(windowMs / 1000));

    return {
        allowed: count <= limit,
        remaining: Math.max(0, limit - count),
        resetAt: now + windowMs
    };
}

module.exports = slidingWindow;