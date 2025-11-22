import amqp from "amqplib";
import logger from "./logger.js";
import dotenv from "dotenv";
dotenv.config();
const rabbitmqUrl = process.env.RABBITMQ_URL;
const exchange = process.env.RABBITMQ_EXCHANGE;
   let  connection =null;
   let channel = null;

export const connectToRabbitMQ = async () => {
    try {
         connection = await amqp.connect(rabbitmqUrl);

        channel = await connection.createChannel();
        await channel.assertExchange(exchange, "fanout", { durable: true });
      ;

        logger.info("Connected to RabbitMQ", rabbitmqUrl);
        return channel
    } catch (error) {
        logger.error("Error sending message to RabbitMQ", error);
    }
};

export const publishEvent = async (routingKey,message) => {
    if(!channel){
await connectToRabbitMQ()
    }
    try{


        channel.publish(exchange,routingKey,Buffer.from(JSON.stringify(message)));
        logger.info("Message published to RabbitMQ", routingKey);
    }catch(error){
        logger.error("Error publishing message to RabbitMQ",error)
    }
}

export async function consumeEvent(routingKey,callback){
    if(!channel){
        await connectToRabbitMQ()
    }
    try{
        const q =await channel.assertQueue("",{exclusive:true})
     await channel.bindQueue(q.queue,exchange,routingKey)
     channel.consume(q.queue,(msg)=>{
        if(msg!==null){
            const content=JSON.parse(msg.content.toString())
            callback(content)
        }
     })     
logger.info("Consumer started for RabbitMQ",routingKey)
    }catch(error){
        logger.error("Error consuming message from RabbitMQ",error)
    }

}
