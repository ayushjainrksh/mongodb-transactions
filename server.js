const express = require('express'),
    app = express(),
    PORT = process.env.PORT || 3000,
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    fileUpload = require('express-fileupload'),
    csv = require('@fast-csv/parse'),
    {Worker, isMainThread} = require('worker_threads');

require('dotenv').config();

const Employee = require('./models/Employee');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(fileUpload());

let database;
let collection;
let workers;

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
        console.log(`Server starte at ${PORT}...`);
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
    try {
        if(isMainThread) {
            console.log('Creating a new worker');
            
            if (!req.files)
                return res.status(400).send('No files were uploaded.');
            var employeeFile = req.files.file;
            var employees = [];
            csv
            .parseString(employeeFile.data.toString(), {
                headers: true,
                ignoreEmpty: true
            })
            .on("data", function(data){
                employees.push(data);
            })
            .on("end", function(){
                console.log(employees);
                workers = new Worker('./workers.js', {
                    workerData: {
                        reqBody: employees
                    }
                });
            })
        } else {
            console.log("I am a worker");
        }
        res.sendStatus(200);
    } catch(err) {
        console.log(err)
        res.send({"err": err})
    }
});

app.post('/employee/create/cancel', function(req, res){
    workers.postMessage('cancel');
    res.send("Stopped successfully");
})
