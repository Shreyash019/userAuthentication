const express = require('express');
const app = express();

const errorMiddleware = require('./middleware/error');

// Configuration
const dotenv = require('dotenv');
dotenv.config({path: './config.env'});


const cookieParser = require('cookie-parser');
app.use(express.json());
app.use(cookieParser());

const userRoutes = require('./routes/userRoutes');
app.use('/api/v1/', userRoutes);

app.use(errorMiddleware)
module.exports = app;