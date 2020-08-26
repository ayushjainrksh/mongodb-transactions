const worker = require('worker_threads');
const {port1, port2} = new worker.MessageChannel();
const mongoose = require('mongoose');

//Import Models
const Employee = require('./models/Employee');

//Set up database connection for the workder
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
            collection = db.collection('employees');
        else
            collection = db.createCollection("employees");
    });
});

//To store mongodb session information
let session;

//Create an employee using mongodb transactions
async function createEmployee(requestData) {
    try {
        session = await mongoose.startSession();
        session.startTransaction();
        
        //Insert data to the collection
        await Employee.collection.insert(requestData, {session: session});

        //Wait for 5 seconds before committing to the database (emulate a long running transaction)
        console.log("Waiting...");
        setTimeout(async()=>{
            //Commit the transaction if there is no error
            await session.commitTransaction();
            session.endSession();
            console.log("Employee data added successfully!");
        }, 5000);
    } catch(err) {
        //Abort and rollback the transaction in case of an error
        await session?.abortTransaction();
        session?.endSession();
        console.log("Failed to add employee data!");
    }
}

//Get data from the main thread
const requestData = worker.workerData.reqBody;
console.log(requestData);

//Call function to start the transaction
createEmployee(requestData);
console.log(`Thread id: ${worker.threadId}`);

//Listen for message on parentPort
worker.parentPort.on('message', async function(message) {
    //If cancel message arrives, then stop the transaction
    if(message=='cancel'){
        console.log('Cancelling transaction...');
        session.endSession();
        console.log('======Session ended======');
        console.log('Killing thread with id: ', worker.threadId);
        process.exit(0);
    }
});
