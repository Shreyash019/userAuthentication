const jwt  = require('jsonwebtoken');
const CatchAsync = require('../middleware/catchAsync');
const UserModel = require('../models/userModel');
const ErrorHandler = require('./errorHandler');

exports.authSendToken = (id)=>{
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
}

exports.sendToken = (user, statusCode, res)=>{
    const token = this.authSendToken(user._id);

    const options = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN*24*60*60*1000),
        httpOnly: true,
    }

    res.cookie('token', token, options);

    res.status(statusCode).json({
        sucess: true,
        token,
    })
}


exports.isUserAuthenticated = CatchAsync( async(req, res, next)=>{
    const {token} = req.cookies;
    if(!token){
        return next(new ErrorHandler("Please login to access resources", 401))
    }

    const decodedData = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await UserModel.findById(decodedData.id)
    console.log('Token:', token);
    next()
})