const express = require('express'),
    app = express(),
    PORT = process.env.PORT || 3000,
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    {Worker, isMainThread} = require('worker_threads');

require('dotenv').config();

const Employee = require('./models/Employee');

app.use(bodyParser.json());

let database;
let collection;
mongoose.connect(process.env.uri, {useNewUrlParser: true, useUnifiedTopology: true}, function(err, db){
    database = db;
    db.db.listCollections().toArray(function(err, collectionNames){
        let exists = false;
        collectionNames.forEach(coll => {
            if(coll.name === 'employees')
                exists = true;
        });
        if(exists)
        {
            collection = db.collection('employees');
        } else {
            collection = db.createCollection("employees");
        }
    })
    app.listen(PORT, function(err){
        if(err)
            console.log(err);
        console.log(`Server starte at ${PORT}...`)
    }) 
});

app.get('/', function(req, res){
    res.send("Hi");
})

app.get('/employee', async function(req, res){
    try{
        const employees = await Employee.find();
        if(employees)
            res.send({"employees": employees})
        else
            res.send({"employees": null})
    } catch(err) {
        res.send({"err": err})
    }
});

app.post('/employee/createOne', async function(req, res){
    try {
        const session = await mongoose.startSession();
        session.startTransaction();

        await Employee.create([req.body], {session: session});
        await session.commitTransaction();
        session.endSession();
        res.sendStatus(200);
    } catch(err) {
        console.log(err)
        res.send({"err": err})
    }
});

app.post('/employee/create', async function(req, res){
    let workers;
    try {
        if(isMainThread) {
            console.log('Creating a new worker');
            workers = new Worker('./workers.js', {
                workerData: {
                    reqBody: req.body
                }
            });
        } else {
            console.log("I am a worker");
        }
        res.sendStatus(200);
    } catch(err) {
        console.log(err)
        res.send({"err": err})
    }
});

app.get('/cancelTesting', function(req, res){
    res.send("Cancel");
})
