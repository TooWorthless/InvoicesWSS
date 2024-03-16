import amqp from 'amqplib';
import { WebSocket } from 'ws';
import { WSS } from '../wss.js';
import dotenv from 'dotenv';
dotenv.config();



class AMQPHandler {

    constructor() {
        this.connection = null;
        this.channel = null;
        this.exchange = 'invoices';
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


    publish(data) {
        if(!this.channel) {
            throw new Error('Channel not initialized. Please call connect() first.');
        }

        this.channel.publish(this.exchange, 'invoice', Buffer.from(data));
        console.log(' [x] Sent %s', data);
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

const amqpHandler = new AMQPHandler();
await amqpHandler.connect();



export {
    amqpHandler
};
