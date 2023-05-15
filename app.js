const express = require('express');
const app = express();
var session = require('express-session');
const enableWs = require('express-ws');

// force https
if(process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.header('x-forwarded-proto') !== 'https')
        res.redirect(`https://${req.header('host')}${req.url}`)
        else
        next()
    })
}

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Headers");
    next();
});

//middleware
require('dotenv').config();

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));
enableWs(app);

const oneDay = 1000 * 60 * 60 * 24;
app.use(session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false 
}));

// set the view engine to ejs
app.set('view engine', 'ejs');

app.use("/styles",express.static(__dirname + "/views/styles"));
app.use("/scripts",express.static(__dirname + "/views/scripts"));
app.use("/assets",express.static(__dirname + "/views/assets"));

const port = process.env.PORT || 3000;

//navigation routing
app.use('/', require('./routes/index'))

//api routing
app.use('/api/helpdesk', require('./routes/helpdesk.js'))
app.use('/api/oauth', require('./routes/oauth.js'))
app.use('/api/mp', require('./routes/mp.js'))
app.use('/api/prayer-wall', require('./routes/prayer-wall.js'))
app.use('/websocket', require('./routes/websocket.js'))
app.use('/api/widgets', require('./routes/widgets.js'))

// const { populate } = require('./populate.js');

const start = async () => {
    try {
        app.listen(port, console.log(`\n server is listening on port ${port}\n http://localhost:${port}`));
        // await populate();

    } catch (error) { console.log(error) }
}
start();