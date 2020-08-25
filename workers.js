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


async function createEmployee(requestData) {
    let session;
    try {
        session = await mongoose.startSession();
        session.startTransaction();
        await Employee.collection.insert([requestData], {session: session});
        await session.commitTransaction();
        session.endSession();
        console.log("Successful")
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

