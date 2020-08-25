const worker = require('worker_threads');
const {port1, port2} = new worker.MessageChannel();
const mongoose = require('mongoose');
const Employee = require('./models/Employee');

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
    });
});

let session;

async function createEmployee(requestData) {
    try {
        session = await mongoose.startSession();
        session.startTransaction();
        await Employee.collection.insert([requestData], {session: session});
        setTimeout(async()=>{
            await session.commitTransaction();
            session.endSession();
            console.log("Successful")
        }, 5000);
    } catch(err) {
        console.log(err);
        await session?.abortTransaction();
        session?.endSession();
        console.log("Failed")
    }
}

const requestData = worker.workerData;

console.log(requestData);

createEmployee(requestData);
console.log(`Thread id: ${worker.threadId}`);

worker.parentPort.on('message', async function(message) {
    console.log(message);
    if(message=='cancel'){
        console.log('Cancelling in worker thread.');
        session.endSession();
        console.log('End session');
        console.log('Kill thread: ', worker.threadId);
        process.exit(0);
    }
});
