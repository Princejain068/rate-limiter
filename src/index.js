const express = require('express');
const rateLimiter = require('./middleware/rateLimiter');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

/*
|--------------------------------------------------------------------------
| Dynamic Rate Limiter Endpoint
|--------------------------------------------------------------------------
|
| Frontend can call:
|
| /api/test?algorithm=slidingWindow
| /api/test?algorithm=fixedWindow
| /api/test?algorithm=tokenBucket
|
*/

app.use('/api/test', (req, res, next) => {

    const algorithm =
        req.query.algorithm || 'slidingWindow';

    let options = {
        algorithm,
        namespace: `demo:${algorithm}`,
        keyBy: (req) => req.ip
    };

    switch (algorithm) {

        case 'fixedWindow':
            options = {
                ...options,
                limit: 5,
                windowMs: 60 * 1000
            };
            break;

        case 'slidingWindow':
            options = {
                ...options,
                limit: 5,
                windowMs: 60 * 1000
            };
            break;

        case 'tokenBucket':
            options = {
                ...options,
                capacity: 10,
                refillRate: 1,
                refillMs: 1000
            };
            break;

        case 'leakyBucket':
            options = {
                ...options,
                capacity: 10,
                leakRate: 1,
                leakMs: 1000
            };
            break;

        default:
            return res.status(400).json({
                success: false,
                message: 'Invalid algorithm'
            });
    }

    // create middleware dynamically
    const limiter = rateLimiter(options);

    return limiter(req, res, next);
});

app.get('/api/test', (req, res) => {

    const remaining = res.getHeader('X-RateLimit-Remaining');

    console.log(remaining);

    res.json({
        success: true,
        algorithm: req.query.algorithm,
        message: 'Request allowed',
        timestamp: new Date().toISOString(),
        remaining: remaining
    });
});

app.use((err, req, res, next) => {

    console.error(err);

    res.status(500).json({
        success: false,
        message: 'Internal Server Error'
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});