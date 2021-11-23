const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 3000;
const Redis = require('ioredis');
const redis = new Redis();

server.listen(port);
app.set('view engine', 'ejs');
app.use(express.static('public')); // use the static folder public

// Force SSL on Heroku
if(process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if(req.header('x-forwarded-proto') !== 'https') {
            res.redirect(`https://${req.header('host')}${req.url}`);
        } else {
            next();
        }
    });
}



// ------------------------------------------
// ROUTES
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/:stock', (req, res) => {
    const stock = req.params.stock;

    redis.subscribe(stock, (err, count) => {
        if (err) {
            console.error("Failed. %s", err.message);
        } else {
            console.log(`Subscribed successfully to ${count}`);
        }
    });

    const rget = new Redis();
    
    rget.get(stock).then((result) => {
        console.log(result);

        res.render('stock', { stock: stock, stockInfo : result });
    })    
});


io.on('connection', socket => {
    let stockId = '';

    socket.on('join', (stock) => {
        stockId = stock;
        console.log('Joined page: ', stock);
    });

    redis.on("message", (stockId, message) => {
        socket.emit(stockId, message);
        console.log(`Received. stockId: ${stockId} Message: ${message}`);
    });

})
