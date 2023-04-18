const express = require('express');
const app = express();
var session = require('express-session');

//middleware
require('dotenv').config();

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));

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
app.use('/api/oauth', require('./routes/oauth.js'))
app.use('/api/mp', require('./routes/mp.js'))

// const { populate } = require('./populate.js');

const start = async () => {
    try {
        app.listen(port, console.log(`\n server is listening on port ${port}\n http://localhost:${port}`));
        // await populate();

    } catch (error) { console.log(error) }
}
start();