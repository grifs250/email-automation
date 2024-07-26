const express = require('express');
const morgan =require('morgan');
const mongoose = require('mongoose')
const appRoute = require('./routes/route.js')
require('dotenv').config();

//express app
const app = express();

// connect to mongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then((result) => console.log('connected to db'))
    .catch((err) => console.log(err));

// register view engine
app.set('view engine', 'ejs');

// middlewear
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(express());

// routes
app.use(appRoute)

app.use((req, res) => {
    res.render('index', { title: '404' })
});

// listen for requests
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is listening on port ${port}...`);
});