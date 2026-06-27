// src/algorithms/slidingWindow.js
async function slidingWindow(redis, key, { limit, windowMs }) {
  const now = Date.now();
  const floor = now - windowMs;

  await redis.zremrangebyscore(key, '-inf', floor);
  const count = await redis.zcard(key);

  if (count < limit) {
    await redis.zadd(key, now, `${now}-${Math.random()}`);
    await redis.pexpire(key, windowMs);
  }

  return {
    allowed: count < limit,
    remaining: Math.max(0, limit - count - 1),
    resetAt: now + windowMs,
  };
}
module.exports = slidingWindow;