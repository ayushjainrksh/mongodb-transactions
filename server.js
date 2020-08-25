const express = require('express'),
    app = express(),
    PORT = process.env.PORT || 3000,
    bodyParser = require('body-parser'),
    mongoose = require('mongoose');

app.get('/', function(req, res){
    res.send("Hi");
})

app.listen(PORT, function(err){
    if(err)
        console.log(err);
    console.log(`Server starte at ${PORT}...`)
})