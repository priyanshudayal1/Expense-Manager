const jwt=require("jsonwebtoken");
const User=require("../models/user");


const authenticate=async (req,res,next)=>{
    try{
        const token=req.cookies.jwt;
        const verifyUser=jwt.verify(token,"mynameispiyushdayal10812345678910");
        next();

    }   catch(err){
        res.send(`There has been an error occurred : ${err}`);
    }
};


module.exports=authenticate