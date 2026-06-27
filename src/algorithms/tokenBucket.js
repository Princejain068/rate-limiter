// src/algorithms/tokenBucket.js
async function tokenBucket(redis, key, { capacity, refillRate, refillMs }) {
  const now = Date.now();
  const data = await redis.hgetall(key);

  let tokens = data.tokens ? parseFloat(data.tokens) : capacity;
  let lastRefill = data.lastRefill ? parseInt(data.lastRefill) : now;

  const elapsed = now - lastRefill;
  const refilled = (elapsed / refillMs) * refillRate;
  tokens = Math.min(capacity, tokens + refilled);

  const allowed = tokens >= 1;
  if (allowed) tokens -= 1;

  await redis.hset(key, 'tokens', tokens.toFixed(4), 'lastRefill', now);
  await redis.pexpire(key, refillMs * capacity);

  return {
    allowed,
    remaining: Math.floor(tokens),
    resetAt: now + Math.ceil((1 - tokens) / refillRate) * refillMs,
  };
}
module.exports = tokenBucket;