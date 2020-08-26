const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    dob: {
        type: Date,
        required: true
    },
    isManager: {
        type: Boolean,
        default: false
    },
    department: {
        type: String,
        enum: ['Tech', 'Finance', 'Marketing', 'Sales'],
        default: 'Tech'
    }
});

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;
    