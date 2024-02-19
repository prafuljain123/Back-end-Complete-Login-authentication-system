const jwt = require("jsonwebtoken");
const userdb = require('../models/userSchema');
const secretKey = process.env.SECRET_KEY;

const Authenticate = async(req,res,next) =>{
    try{
        const token = req.headers.authorization;
        console.log('token');
        const verifyToken = jwt.verify(token, secretKey);

        const rootUser = await userdb.findOne({_id:verifyToken._id});
        if(!rootUser){throw new Error('User Not Found')}

        req.token = token;
        req.rootUser = rootUser;
        req.userId = rootUser._id;
        console.log('hiii');
        next();
    }catch(error){
        res.status(401).json({status:401,message:"Unauthorized User"});
    }
}

module.exports = Authenticate;