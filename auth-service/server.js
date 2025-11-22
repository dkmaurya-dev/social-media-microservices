import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import logger from './src/utils/logger.js';
import helmet from 'helmet';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';
import {RedisStore} from 'rate-limit-redis';
import rateLimit from 'express-rate-limit';
import routes from './src/routes/auth-service.js';
import { errorHandler } from './src/middleware/errorHandler.js';
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
app.use(helmet()) 
app.use(express.json());
app.use(cors());
const redisClient = new Redis(process.env.REDIS_URL);

// const limiter = new RateLimiterRadis({
//   windowMs: 1 * 60 * 1000, // 1 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
// });

// // Limit requests to 100 per minute
// app.use(limiter);
 
// // Rate limit requests to 100 per minute
// limiter.on('limitReached', (req, res) => {
//   res.status(429).json({
//     message: 'Too many requests, please try again in a minute'
//   });
// });


app.use((req,res,next)=>{
  logger.info("Request Received",req.method,req.url)
  next()
})


mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  logger.info('Mongoose connected');
}).catch((err) => {
  logger.error("Mongo connection error",err);
});

mongoose.connection.on('disconnected', () => {
  logger.error('Mongoose disconnected');
});


// DDos protection

const rateLimiter =new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "ddos-protection",
  points: 100, // Number of allowed requests
  duration: 1, // Per second
  blockDuration: 1000, // Per hour
  errorMessage: "Too many requests, please try again in a minute",
});
 
// rateLimiter.on("limitReached", (req, res) => {
//   res.status(429).json({
//     message: "Too many requests, please try again in a minute",
//   });
// });
app.use((req,res,next)=>{
  rateLimiter.consume(req.ip)
  .then((result) => {
    if(result){
      next()
    }else{
      res.status(429).json({
        message: "Too many requests, please try again in a minute",
      });
    }
  })
})
const  sesitiveEndPointsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: function (req, res, next) {
    res.format({
      json: function () {
        res.status(429).json({
          message: "Too many requests, please try again in a minute"+req.ip,
        });
      },
      html: function () {
        res.status(429).send("Too many requests, please try again in a minute");
      },
    });
    next();
  },
    store: new RedisStore({
      sendCommand:(...args)=>redisClient.call(...args)
     // Without this, rateLimiter won't work
})
});
app.use('/api/auth/',routes);
/// apply this sesitiveEndPointsLimiter to specifice routes
app.use('/api/auth/register',sesitiveEndPointsLimiter);
app.use(errorHandler)

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  logger.info(`Server listening on port http://localhost:${port}`);
});

process.on('unhandledRejection', (reason, p) => {
  logger.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
});