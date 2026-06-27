const redis = require('../utils/redisClient');
const { buildKey } = require('../utils/keyBuilder');
const fixedWindow = require('../algorithms/fixedWindow');
const slidingWindow = require('../algorithms/slidingWindow');
const tokenBucket = require('../algorithms/tokenBucket');
// const leakyBucket = require('../algorithms/leakyBucket');

const ALGORITHMS = { fixedWindow, slidingWindow, tokenBucket };

function rateLimiter(config) {
  const {
    algorithm = 'slidingWindow',
    keyBy = (req) => req.ip,         // what identifies a caller
    namespace = 'default',
    onLimited = null,                 // optional custom handler
    ...algoOptions
  } = config;

  const fn = ALGORITHMS[algorithm];
  if (!fn) throw new Error(`Unknown algorithm: ${algorithm}`);

  return async (req, res, next) => {
    const identifier = typeof keyBy === 'function' ? keyBy(req) : req[keyBy];
    const route = req.route?.path || req.path;
    const key = buildKey(namespace, identifier, route);

    try {
      const result = await fn(redis, key, algoOptions);

      // Always set headers so clients can self-throttle
      res.set({
        'X-RateLimit-Limit': algoOptions.limit || algoOptions.capacity,
        'X-RateLimit-Remaining': result.remaining,
        'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000),
        'X-RateLimit-Algorithm': algorithm,
      });

      if (!result.allowed) {
        if (onLimited) return onLimited(req, res, next);
        return res.status(429).json({
          error: 'Too Many Requests',
          retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
        });
      }

      next();
    } catch (err) {
      console.error('[RateLimiter]', err);
      next(); // fail open — never block on infra errors
    }
  };
}

module.exports = rateLimiter;