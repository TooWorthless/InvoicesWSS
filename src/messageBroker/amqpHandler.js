import amqp from 'amqplib';
import { WebSocket } from 'ws';
import { WSS } from '../wss.js';
import dotenv from 'dotenv';
dotenv.config();



class AMQPHandler {

    constructor() {
        this.connection = null;
        this.channel = null;
        this.exchange = 'invoicesReceiving';
    }


    async connect() {
        try {
            const { rabbitmq_username, rabbitmq_password, IP, AMQP_PORT } = process.env;

            this.connection = await amqp.connect(
                `amqp://${rabbitmq_username}:${rabbitmq_password}@${IP}:${AMQP_PORT}`
            );

            this.channel = await this.connection.createChannel();

            await this.channel.assertExchange(
                this.exchange,
                'direct', 
                { durable: false }
            );

        } catch (error) {
            console.error('Error connecting to AMQP :>> ', error.stack);
            throw error;
        }
    }


    async createQueueAndBind(queueKey) {
        try {
            const assertedQueue = await this.channel.assertQueue('', { exclusive: true });

            await this.channel.bindQueue(assertedQueue.queue, this.exchange, queueKey);
            
            this.channel.consume(
                assertedQueue.queue,
                async (invoice) => {
                    if (invoice.content) {
                        for(const connectionId in WSS.connections) {
                            if(WSS.connections[connectionId].queueName === assertedQueue.queue && WSS.connections[connectionId].ws.readyState === WebSocket.OPEN) {
                                WSS.connections[connectionId].ws.send(invoice.content);
                            }
                        }
                    }
                },
                { noAck: true }
            );

            return assertedQueue.queue;
        } catch (error) {
            console.error('Error creating queue and binding :>> ', error.stack);
            throw error;
        }
    }


    async close() {
        try {
            await this.channel.close();
            await this.connection.close();
        } catch (error) {
            console.error('Error closing AMQP connection :>> ', error.stack);
        }
    }
    
}

export {
    AMQPHandler
};
