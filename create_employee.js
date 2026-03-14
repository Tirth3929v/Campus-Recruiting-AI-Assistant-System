require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./server/models/User');

mongoose.connect('mongodb://127.0.0.1:27017/campus_recruit').then(() => console.log('Connected'));

async function createEmployee() {
  const employee = new User({
    name: 'Employee Test',
    email: 'employee@campusrecruit.com',
    password: 'Employee@123',
    role: 'employee',
    isVerified: true
  });
  await employee.save();
  console.log('Employee created: ', employee.email);
  mongoose.disconnect();
}

createEmployee();
