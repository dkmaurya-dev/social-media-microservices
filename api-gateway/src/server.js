import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import Redis from 'ioredis';
import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import proxy from 'express-http-proxy';
import logger from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { validateToken } from './middleware/authMiddleware.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// 🧠 Security Middlewares
app.use(helmet());
app.use(express.json());
app.use(cors());

// ✅ Initialize Redis Client
const redisClient = new Redis(process.env.REDIS_URL);

// ✅ Rate Limiter with Redis Store
const rateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many requests, please try again in a minute',
    });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

app.use(rateLimiter);

// ✅ Log each request (place before proxy)
app.use((req, res, next) => {
  logger.info(`Request Received: ${req.method} ${req.url}`);
  next();
});

// ✅ API Gateway Proxy
const apiGatewayProxy = proxy(process.env.AUTH_SERVICE_URL, {
  proxyReqPathResolver: (req) => {
    return req.originalUrl.replace(/^\/v1/, '/api'); // Added missing '/' before 'api'
  },
  proxyErrorHandler: (err, res, next) => {
    logger.error('Proxy Error:', err.message);
    res.status(500).json({
      message: 'Internal Server Error',
      error: err.message,
    });
  },
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    proxyReqOpts.headers.Authorization = srcReq.headers.authorization || '';
    return proxyReqOpts;
  },
  userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
    userRes.setHeader('x-powered-by', 'api-gateway');
    return proxyResData;
  },
});
// ✅ Mount Routes
app.use('/v1/auth', apiGatewayProxy);

// Setting Up Proxy for Post Service
app.use('/v1/posts',validateToken,proxy(process.env.POST_SERVICE_URL,{ 
  proxyReqPathResolver: (req) => {
    return req.originalUrl.replace(/^\/v1/, '/api'); // Added missing '/' before 'api'
  },
    proxyErrorHandler: (err, res, next) => {
    logger.error('Proxy Error:', err.message);
    res.status(500).json({
      message: 'Internal Server Error',
      error: err.message,
    });
  },
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    proxyReqOpts.headers['Content-Type'] = 'application/json';
    proxyReqOpts.headers['x-user-id'] = srcReq.user.id;
    return proxyReqOpts;
  },
  userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
    userRes.setHeader('x-powered-by', 'api-gateway');
    logger.info("Response from Post Service",proxyResData,proxyRes.statusCode);
    return proxyResData;
  },
}));

// Setting  Up Proxy for Media Service
app.use('/v1/media',validateToken,proxy(process.env.MEDIA_SERVICE_URL,{ 
  proxyReqPathResolver: (req) => {
    return req.originalUrl.replace(/^\/v1/, '/api'); // Added missing '/' before 'api'
  },
    proxyErrorHandler: (err, res, next) => {
    logger.error('Proxy Error:', err.message);
    res.status(500).json({
      message: 'Internal Server Error',
      error: err.message,
    });
  },
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    proxyReqOpts.headers['x-user-id'] = srcReq.user.id;
   if(!proxyReqOpts.headers['content-type'].startsWith('multipart/form-data')){
    proxyReqOpts.headers['content-type'] = 'application/json';
   }
    return proxyReqOpts;
  },
  userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
    userRes.setHeader('x-powered-by', 'api-gateway');
    logger.info("Response from Media Service",proxyResData,proxyRes.statusCode);
    return proxyResData;
  },
  parseReqBody: false,
}));

// Setting  Up Proxy for Search Service

app.use('/v1/search',validateToken,proxy(process.env.SEARCH_SERVICE_URL,{
  proxyReqPathResolver: (req) => {
    return req.originalUrl.replace(/^\/v1/, '/api'); // Added missing '/' before 'api'
  },
    proxyErrorHandler: (err, res, next) => {
    logger.error('Proxy Error:', err.message);
    res.status(500).json({
      message: 'Internal Server Error',
      error: err.message,
    });
  },
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    proxyReqOpts.headers['x-user-id'] = srcReq.user.id;
   if(!proxyReqOpts.headers['content-type'].startsWith('multipart/form-data')){
    proxyReqOpts.headers['content-type'] = 'application/json';
   }
    return proxyReqOpts;
  },
  userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
    userRes.setHeader('x-powered-by', 'api-gateway');
    logger.info("Response from Search Service",proxyResData,proxyRes.statusCode);
    return proxyResData;
  },
  parseReqBody: false,
}));






// ✅ Global Error Handler
app.use(errorHandler);
// ✅ Start Server
app.listen(port, () => {
  logger.info(`🚀 API Gateway running at http://localhost:${port}`);
    logger.info(`🚀 Auth Service running at ${process.env.AUTH_SERVICE_PORT}`);

    logger.info(`🚀 Post Service running at ${process.env.POST_SERVICE_URL}`);
    logger.info(`🚀 Media Service running at ${process.env.MEDIA_SERVICE_URL}`);
    logger.info(`🚀 Search Service running at ${process.env.SEARCH_SERVICE_URL}`);

});
// ✅ Handle Unhandled Promise Rejections
process.on('unhandledRejection', (reason, p) => {
  logger.error('Unhandled Rejection at:', p, 'reason:', reason);
});
