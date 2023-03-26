const mongoose=require('./config/connect')
const express=require("express");
const app=express();
const session=require('express-session')
const errorHandler = require('./middleware/errorHandler');

require("dotenv").config();
app.use(session({secret:process.env.SECRET_KEY}))

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set('view engine', 'ejs');

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})

const adminRoute=require('./routes/adminRoute');
app.use('/admin',adminRoute)

const userRoute=require('./routes/userRoute');
app.use('/',userRoute);

app.use(errorHandler.errorHandler);

app.use(express.static('public'))

app.listen(3003,()=>{
    console.log("Server is Running...")
})