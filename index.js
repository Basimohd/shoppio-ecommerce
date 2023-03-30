const mongoDb = require('./config/connect')
const connectDB = mongoDb.connectDB;

const express = require("express");
const app = express();
const session = require('express-session')

require("dotenv").config();
app.use(session({ secret: process.env.SECRET_KEY }))

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set('view engine', 'ejs');

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})

const adminRoute = require('./routes/adminRoute');
app.use('/admin', adminRoute)

const userRoute = require('./routes/userRoute');
app.use('/', userRoute);

app.use(express.static('public'))

const startServer = async () => {
  try {
    connectDB(process.env.MONGODB_ATLAS_CONNECTION)
    app.listen(3003, () => {
      console.log("Server is Running...")
    })
  } catch (error) {
    console.log(error);
  }
}
startServer();
