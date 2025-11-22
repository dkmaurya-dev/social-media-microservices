import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import logger from "./utils/logger.js";
import mediaRouter from "./routes/media-routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { connectToRabbitMQ,consumeEvent } from "./utils/rabbitmq.js";
import handlePostDeletedEvent from "./eventHandlers/media-event-handler.js";
import mongoose from 'mongoose'

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());

mongoose.connect(process.env.MONGODB_URI).then(() => {
    logger.info("Connected to MongoDB");
}).catch((err) => {
    logger.error("Error connecting to MongoDB", err);
});

app.use((req,res,next)=>{
  logger.info("Request Received",req.method,req.url)
  next()
})
// *** Homework: implement IP rate limiting for sensitive endpoints
app.use('/api/media',mediaRouter

)
app.use(errorHandler)
async function startServer(){
    try{
      await connectToRabbitMQ()

      // consume all events from rabbitmq
      await consumeEvent('post-deleted',handlePostDeletedEvent)
       
      app.listen(PORT, () => {
        logger.info(`Media Service is running on port ${PORT}`);
      });
    }catch(error){
      logger.error("Error connecting to RabbitMQ",error)
      process.exit(1)
    }
}


startServer()


// app.listen(PORT, () => {
//     logger.info(`Server is running on port ${PORT}`);
// });

process.on('unhandledRejection', (reason, p) => {
  logger.error('Unhandled Rejection at:', p, 'reason:', reason);
}); 