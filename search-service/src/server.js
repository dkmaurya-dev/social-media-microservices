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
import postRouter from "./routes/search-routes.js";
import { connectToRabbitMQ, consumeEvent } from "./utils/rabbitmq.js";
import searchRouter from "./routes/search-routes.js";
import {handlePostCreatedEvent,handlePostDeletedEvent} from "./eventHandler/search-event-handlers.js";

const app = express();
const port = process.env.PORT || 3004;
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

app.use("/api/search",(req,res,next)=>{
    // req.redisClient=redisClient;
    next()
},searchRouter);
app.use(errorHandler)
/// apply this sesitiveEndPointsLimiter to specifice routes
app.use(errorHandler)
async function startServer(){
    try{
      await connectToRabbitMQ()
      await consumeEvent('post.created',handlePostCreatedEvent) 
         await consumeEvent('post.deleted',handlePostDeletedEvent)

      app.listen(port, () => {
        logger.info(`Search Service is running on port ${port}`);
      });
    }catch(error){
      logger.error("Error search-service connecting to RabbitMQ",error)
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