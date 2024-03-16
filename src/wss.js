import { WebSocketServer } from 'ws';
import { AMQPHandler } from './messageBroker/amqpHandler.js';
import { amqpService } from './messageBroker/amqpService.js';
import { v4 as uuidv4 } from 'uuid';

class WSS {
    static connections = {};


    constructor(server) {
        this.wss = new WebSocketServer({ server });
    }


    run() {
        this.wss.on('connection', async (ws) => {
            
            const connectionId = uuidv4();
            console.log('new connection Id :>> ', connectionId);

            this.#handleNewConnection(connectionId, ws);

            ws.on('message', (invoiceBuffer) => {
                const invoice = JSON.parse(invoiceBuffer.toString());

                amqpService.publish(JSON.stringify({
                    invoice,
                    connectionId: connectionId
                }));
            });

            ws.on('close', () => {
                delete WSS.connections[connectionId];
            });
    
        });
    }


    async #handleNewConnection(connectionId, ws) {
        try {
            const amqpHandler = new AMQPHandler();
            await amqpHandler.connect();
            const queueName = await amqpHandler.createQueueAndBind(connectionId);
    
            WSS.connections[connectionId] = {
                ws,
                queueName,
                amqpHandler
            };
        } catch (error) {
            console.log('error.message handleNewConnection :>> ', error.stack);
        }
    }
}


export {
    WSS
}

