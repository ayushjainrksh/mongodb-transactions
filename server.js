const express = require('express'),
    app = express(),
    PORT = process.env.PORT || 3000,
    bodyParser = require('body-parser'),
    mongoose = require('mongoose');

require('dotenv').config();

app.use(bodyParser.json());
mongoose.connect(process.env.uri, {useNewUrlParser: true, useUnifiedTopology: true});

const employeeSchema = new mongoose.Schema({
    name: String,
    dob: String,
    isManager: Boolean,
    department: String
});

const Employee = mongoose.model('Employee', employeeSchema);

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

app.post('/employee/create', async function(req, res){
    try {
        const employee = await Employee.create(req.body);
        if(employee) {
            employee.save();
            res.send(employee);
        }
    } catch(err) {
        res.send({"err": err})
    }
})

app.listen(PORT, function(err){
    if(err)
        console.log(err);
    console.log(`Server starte at ${PORT}...`)
})