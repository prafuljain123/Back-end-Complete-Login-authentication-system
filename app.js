const express = require('express');
const app = express();
require("./db/connection");
const router = require('./Routes/router');
const cors = require('cors');
const cookiParser = require('cookie-parser');


const port = process.env.PORT || 3000;
const IP = require('ip');

const corsOptions = {
    origin: 'https://login-system-u503.onrender.com', // Replace with the origin of your frontend application
    credentials: true, // Enable credentials (cookies, authorization headers, etc.)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(router);
app.use(cookiParser());
// app.use(cors());

app.get('/', (req, res) => {
    const ipAddress = IP.address();
    res.send(ipAddress)
});




app.listen( port , ()=>{
    console.log(`Server is Running at PORT ${port} and IP: ${IP.address()}`);   
})





















