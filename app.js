const express = require('express');
const app = express();
require("./db/connection");
const router = require('./Routes/router');
const cors = require('cors');
const cookiParser = require('cookie-parser');


const port = process.env.PORT || 3000;

const IP = require('ip');

app.get('/', (req, res) => {
    const ipAddress = IP.address();
    res.send(ipAddress)
});


app.use(express.json());
app.use(router);
app.use(cookiParser());
app.use(cors);

app.use('/api/register',require('./Routes/router/register'));
app.use('/api/login',require('./Routes/router/login'));
app.use('/api/validuser',require('./Routes/router/validuser'));
app.use('/api/sendpasswordlink',require('./Routes/router/sendpasswordlink'));
app.use('/api/forgotpassword/:id/:token',require('./Routes/router/forgotpassword/:id/:token'));
app.use('/api/:id/:token',require('./Routes/router/:id/:token'));

app.listen( port , ()=>{
    console.log(`Server is Running at PORT ${port} and IP: ${IP.address()}`);   
})