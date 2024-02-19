require('dotenv').config()
const mongoose = require('mongoose');

const DB = process.env.DATABASE;
mongoose.set('strictQuery', true);

mongoose.connect(DB,{
    useUnifiedTopology:true,
    useNewUrlParser:true
}).then(()=>console.log('database connected')).catch((error)=>{
    console.log(error);
});


