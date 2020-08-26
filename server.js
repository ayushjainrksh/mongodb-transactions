const express = require('express'),
    app = express(),
    PORT = process.env.PORT || 3000,
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    fileUpload = require('express-fileupload'),
    csv = require('@fast-csv/parse'),
    {Worker, isMainThread} = require('worker_threads');

require('dotenv').config();

//Import models
const Employee = require('./models/Employee');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(fileUpload());

let workers;

//Set up mongodb connection
let database;
let collection;
mongoose.connect(process.env.uri, {useNewUrlParser: true, useUnifiedTopology: true}, function(err, db){
    database = db;

    //Create the collection if not exists (required when using transactions)
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
    });

    //Start the server after connection to mongodb is established
    app.listen(PORT, function(err){
        if(err) 
            console.log(err);
        console.log(`Server starte at ${PORT}...`);
    }) 
});

// ========================
//         ROUTES
// ========================

//Route to test if server is up
app.get('/ping', function(req, res){
    res.send('pong');
})

/**
  GET '/employee'
  To get data of all employees in json format
 */
app.get('/employee', async function(req, res){
    try{
        const employees = await Employee.find();
        if(employees)
            res.send({'employees': employees, 'message': `Fetched ${employees.length} employees successfully`});
        else
            res.send({'employees': null, 'message': 'No employee exists'})
    } catch(err) {
        res.send({'error': err, 'message': 'Encountered an error. Please try again.'});
    }
});

/**
  POST '/employee/createOne'
  To create a single employee manually
 */
app.post('/employee/createOne', async function(req, res){
    try {
        const session = await mongoose.startSession();
        session.startTransaction();

        await Employee.collection.insertOne(req.body, {session: session});
        await session.commitTransaction();
        session.endSession();
        res.send({'employee': employee, 'message': `Employee created successfully`});
    } catch(err) {
        res.send({"err": err, "message": "An error occurred while adding employee data"})
    }
});

/**
  POST '/employee/create'
  Creating employees in batch by uploading csv file
 */
app.post('/employee/create', async function(req, res){
    try {
        //Check if the current thread is main thread or worker
        if(isMainThread) {

            //Create a new thread to start the operation
            console.log('Creating a new worker...');
            if (!req.files)
                return res.send({'message': 'Opeartion failed. No files were uploaded.'});

            //Get uploaded file from form
            const employeeFile = req.files.file;
            let employees = [];

            //Use fast-csv library to parse csv content to json array
            csv
            .parseString(employeeFile.data.toString(), {
                headers: true,
                ignoreEmpty: true
            })
            .on("data", function(data){
                employees.push(data);
            })
            .on("end", function(){
                //Create a new thread and send employee data
                workers = new Worker('./workers.js', {
                    workerData: {
                        reqBody: employees
                    }
                });
            })
        } else {
            console.log("I am a worker");
        }
        res.send({'message': 'Opeartion successful'});
    } catch(err) {
        res.send({'err': err, 'message': 'Encountered an error while performing operation!'});
    }
});

/**
  POST '/employee/create/cancel'
  Cancel a batch employee creation request (Stop '/employee/create')
 */
app.post('/employee/create/cancel', function(req, res){
    workers.postMessage('cancel');
    res.send({'message': 'Operation cancelled successfully!'});
});
