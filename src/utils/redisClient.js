const { Redis } = require('@upstash/redis');
require('dotenv').config();

const client = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
});

module.exports = client;