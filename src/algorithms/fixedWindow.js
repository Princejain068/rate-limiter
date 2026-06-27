async function fixedWindow(redis, key, { limit, windowMs }) {
  const now = Date.now();
  const window = Math.floor(now / windowMs);
  const redisKey = `${key}:${window}`;

  const count = await redis.incr(redisKey);
  if (count === 1) await redis.pexpire(redisKey, windowMs);

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetAt: (window + 1) * windowMs,
  };
}
module.exports = fixedWindow;