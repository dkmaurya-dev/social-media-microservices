import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import helmet from "helmet";
import logger from "./utils/logger.js";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";
import Redis from 'ioredis';
import {RedisStore} from 'rate-limit-redis';
import { RateLimiterRedis } from "rate-limiter-flexible";
import { errorHandler } from "./middleware/errorHandler.js";
import postRouter from "./routes/post-routes.js";
import { connectToRabbitMQ } from "./utils/rabbitmq.js";

const app = express();
const port = process.env.PORT || 3002;
app.use(helmet()) 
app.use(express.json());
app.use(cors());

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

const redisClient = new Redis(process.env.REDIS_URL);
app.use((req,res,next)=>{
  logger.info("Request Received",req.method,req.url)
  next()
})
// *** Homework: implement IP rate limiting for sensitive endpoints

app.use("/api/posts",(req,res,next)=>{
    req.redisClient=redisClient;
    next()
},postRouter);
app.use(errorHandler)
/// apply this sesitiveEndPointsLimiter to specifice routes
app.use(errorHandler)
async function startServer(){
    try{
      await connectToRabbitMQ()
      app.listen(port, () => {
        logger.info(`Post Service is running on port ${port}`);
      });
    }catch(error){
      logger.error("Error connecting to RabbitMQ",error)
      process.exit(1)
    }
}


startServer()

app.get('/', (req, res) => {
  res.send('Post Service is running');
});
 

// app.listen(port, () => {
//     logger.info(`Post Server is running on port ${port}`);
// });                 

process.on('unhandledRejection', (reason, p) => {
  logger.error('Unhandled Rejection at:', p, 'reason:', reason);
});                             