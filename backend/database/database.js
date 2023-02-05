const mongoose = require("mongoose");

const databaseURL = process.env.DATABASE.replace('<password>', process.env.DATABASE_PASSWORD);

mongoose.connect(databaseURL, {
    useNewUrlParser: true,
}).then(()=> console.log(`Database connection successfull...`))

