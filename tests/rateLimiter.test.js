const request = require('supertest');
const app = require('../src/index');
const redis = require('../src/utils/redisClient');

// Wipe Redis before each test so state is clean
beforeEach(async () => {
  await redis.flushdb();
});

// Close Redis connection after all tests — prevents Jest hanging
afterAll(async () => {
  await redis.quit();
});

describe('Rate Limiter', () => {
  it('sets X-RateLimit headers on every response', async () => {
    const res = await request(app).get('/api/hello');
    expect(res.headers['x-ratelimit-remaining']).toBeDefined();
    expect(res.headers['x-ratelimit-reset']).toBeDefined();
  });

  it('allows requests under the limit', async () => {
    const res = await request(app).get('/api/hello');
    expect(res.status).toBe(200);
  });

  it('returns 429 after limit is exceeded', async () => {
    // Hit the /auth/login route — limit is 5
    for (let i = 0; i < 5; i++) {
      await request(app).post('/auth/login').send({});
    }
    const res = await request(app).post('/auth/login').send({});
    expect(res.status).toBe(429);
    expect(res.body.retryAfter).toBeGreaterThan(0);
  });

  it('returns retryAfter in the 429 body', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app).post('/auth/login').send({});
    }
    const res = await request(app).post('/auth/login').send({});
    expect(res.body).toHaveProperty('retryAfter');
  });
});