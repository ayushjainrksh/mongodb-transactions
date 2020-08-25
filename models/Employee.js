const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    name: String,
    dob: String,
    isManager: Boolean,
    department: String
});

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;
    