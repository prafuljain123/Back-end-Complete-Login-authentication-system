const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');

const secretKey = process.env.SECRET_KEY

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true // Remove extra spaces from left side or right side
    },
    email:{
        type:String,
        required:true,
        unique:true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error("not valid email")
            }
        }
    },
    password:{
        type:String,
        required:true,
        minLength:6
    },
    cpassword:{
        type:String,
        required:true,
        minLength:6
    },
    tokens:[
        {
            token:{
                type:String,
                required:true,
            }
        }
    ],
    verifytoken:{
        type : String,
    }
})


//hash Password
userSchema.pre("save",async function(next){
    if(this.isModified("password")){
        this.password = await bcrypt.hash(this.password,12); // 12 rounds
        this.cpassword = await bcrypt.hash(this.cpassword,12);
    }
   
    next();
})
//token generate
userSchema.methods.generateAuthToken =  async  function(){
    try{
         let tokenn = jwt.sign({_id : this._id}, secretKey, {
            expiresIn : "1d"
        });

        this.tokens = this.tokens.concat({token:tokenn});
        await this.save();
        return tokenn;
    }catch(error){
       res.status(422).json(error);
    }
}
//create model
const userdb = new mongoose.model("users",userSchema);

module.exports = userdb;