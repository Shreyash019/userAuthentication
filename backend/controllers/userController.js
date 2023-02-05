const crypto = require('crypto');
const UserModel = require('../models/userModel');
const ErrorHandler = require('../utils/errorHandler');
const CatchAsync = require('../middleware/catchAsync');
const authToken = require('../utils/authToken');
const mail = require('../middleware/sendMail')

// User Registrayion 
exports.userRegistration = CatchAsync(async(req, res, next)=>{
    const {name, email, password} = req.body;
    if(!name || !email || !password){
        return res.send('Please Enter Details')
    }
    const existUser = await UserModel.find({email});
    if(!existUser){
        return res.status(200).send(`User Already exist`)
    }
    const user = await UserModel.create({
        name, email, password,
    })
    authToken.sendToken(user, 200, res)
})


// User Login
exports.userLogin = CatchAsync(async(req, res, next)=>{
    const {email, password} = req.body;
    if(!email || !password){
        return next(new ErrorHandler(`Please enter email and password`, 400));
    }

    const user = await UserModel.findOne({email}).select("+password");

    if(!user || !await user.correctPassword(password, user.password)){
        return next(new ErrorHandler(`Invalid email and password`, 401))
    }
    authToken.sendToken(user, 200, res)
})


// User Logout
exports.userLogout = CatchAsync(async(req, res, next)=>{
    res.cookie('token', null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    })
    res.status(200).json({
        success: true,
        message: 'User Logged Out.'
    })
})


// User password update
exports.userPasswordUpdate= CatchAsync(async(req, res, next)=>{
    const user = await UserModel.findById(req.user.id).select("+password");

    const passwordMatch = await user.correctPassword(req.body.oldPassword, user.password);
    if(!passwordMatch){
        return next(new ErrorHandler('Old password is incorrect', 400))
    }

    if(req.body.newPassword !== req.body.confirmPassword){
        return next(new ErrorHandler('Password not matched.', 400))
    }

    user.password = req.body.newPassword;
    await user.save()

    authToken.sendToken(user, 200, res)
})


// User password reset
exports.resetUserPassword = CatchAsync(async(req, res, next)=>{
    // Creating token hash
    const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await UserModel.findOne({
        resetPasswordToken,
        resetPasswordExpire: {$gt: Date.now()}
    })

    if(!user){
        return next(new ErrorHandler("Reset password token is invalid or has been expired", 404));
    }

    if(req.body.password !== req.body.confirmPassword){
        return next(new ErrorHandler("Password doesn't matched.", 404));
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save()
    authToken.sendToken(user, 200, res)
})


// User password forgot 
exports.setForgotPassword = CatchAsync(async(req, res, next)=>{
    const user = await UserModel.findOne({email: req.body.email})
    console.log(user)

    if(!user){
        return next(new ErrorHandler("User not found", 404));
    }
    // Get ResetPasswordToken
    const resetToken = await user.getResetPasswordToken();

    await user.save({validateBeforeSave: false});

    const resetPasswordUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${resetToken}`;

    const message = `Your password reset token is:- \n\n ${resetPasswordUrl}, \n\n If you have not request this email then please ignore it.`;

    try{
        await mail.sendEmail({
            email: user.email,
            subject: `Ecommerce password recovery.`,
            message,
        })
        res.status(200).json({
            success: true,
            message: `Email sent to ${user.email} successfully`
        })
    } catch(err){
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({validateBeforeSave: false});
        return next(new ErrorHandler(err.message, 500))
    }
})


// User Profile 
exports.getUserProfile = CatchAsync(async(req, res, next)=>{
    const user = await UserModel.findById(req.user.id);
    res.status(200).json({
        suncess: true,
        user
    })
})


// User Profile Update
exports.updateUserProfile = CatchAsync(async(req, res, next)=>{
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
    }

    const user = await UserModel.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true,
        userFindAndModify: true
    });
    res.status(200).json({
        suncess: true,
        user
    })
})


// User Account Delete
exports.userAccountDelete = CatchAsync(async(req, res, next)=>{
    const user = await UserModel.findById(req.user.id);
    if(!user){
        return next(new ErrorHandler(`User does not exist with ID: ${req.params.id}`))
    }

    res.cookie('token', null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    })

    const deletedUser = await user.remove()
    res.status(200).json({
        suncess: true,
        message: 'User Deleted',
        deletedUser
    })
})