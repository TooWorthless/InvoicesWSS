import { WebSocketServer } from 'ws';
import { amqpHandler } from './messageBroker/amqpHandler.js';
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

            ws.on('message', (invoice) => {
                amqpHandler.publish(invoice.toString());
            });

            ws.on('close', () => {
                delete WSS.connections[connectionId];
            });
    
        });
    }


    async #handleNewConnection(connectionId, ws) {
        try {
            WSS.connections[connectionId] = { ws };
        } catch (error) {
            console.log('error.message handleNewConnection :>> ', error.stack);
        }
    }
}


export {
    WSS
}

