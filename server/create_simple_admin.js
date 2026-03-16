require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const connectDB = require('./config/db');

const createAdmin = async () => {
  await connectDB();
  
  // Delete existing admin from NEW Admin collection if it exists
  await Admin.deleteOne({ email: 'admin@campusrecruit.com' });
  
  // Create admin in the dedicated Admin collection
  const admin = await Admin.create({
    name: 'Unified Admin',
    email: 'admin@campusrecruit.com',
    password: 'Admin@123'
  });

  console.log('✅ SIMPLE ADMIN CREATED!');
  console.log('Email: admin@campusrecruit.com');
  console.log('Password: admin');
  console.log('Use these credentials to login!');
  
  process.exit(0);
};

createAdmin().catch(console.error);
