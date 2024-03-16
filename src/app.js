import express from 'express';
import { engine } from 'express-handlebars';

import { createServer } from 'http';

import { logErrors, errorHandler } from './utils.js';
import { WSS } from './wss.js';
import { amqpHandler } from './messageBroker/amqpHandler.js';

import dotenv from 'dotenv';
dotenv.config();



const PORT = process.env.PORT;
const IP = process.env.IP;



const app = express();

const server = createServer(app);

const wss = new WSS(server);
wss.run();




app.engine('.hbs', engine(
    {
        layoutsDir: './src/web/views/layouts', 
        defaultLayout: 'layout',
        extname: 'hbs'
    }
));
app.set('view engine', '.hbs');
app.set('views', './src/web/views');



app.use(express.static('./src/web/static'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());




app.get('/', (req, res, next) => {
    try {
        res.render('home', {
            port: PORT,
            ip: IP
        });
    } catch (error) {
        next(error);
    }
});



app.use((req, res, next) => {
    res.status(404).send('Not Found');
});



app.use(logErrors);
app.use(errorHandler);



process.on('exit', () => {
    amqpHandler.close();
});



server.listen(PORT, () => {
    console.log(`WS Service is running on port ${PORT}`);
});


