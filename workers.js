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
        await Employee.collection.insertMany(requestData, {session: session});

        //Wait for 5 seconds before committing to the database (emulate a long running transaction)
        console.log("Waiting...");
        setTimeout(async()=>{
            console.log("Waiting time over. Committing transaction...");    
            //Commit the transaction if there is no error
            await session.commitTransaction();
            console.log("Employee data added successfully!");
            await session.endSession();
            await process.exit(0);
        }, 5000);
    } catch(err) {
        //Abort and rollback the transaction in case of an error
        console.log("Failed to add employee data!");
        await session?.abortTransaction();
        await session.endSession();
        await process.exit(0);
    }
}

//Get data from the main thread
const requestData = worker.workerData.reqBody;

//Call function to start the transaction
createEmployee(requestData);
console.log(`Thread id: ${worker.threadId}`);

//Listen for message on parentPort
worker.parentPort.on('message', async function(message) {
    //If cancel message arrives, then stop the transaction
    if(message==='cancel'){
        console.log('Cancelling transaction...');
        try {
            await session?.abortTransaction();
            console.log('Transaction cancelled successfully!');
            await session.endSession();
            await process.exit(0);
        } catch(err) {
            session?.endSession();
            throw err;
        }
    }
});
