require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const dbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus_recruit';

async function diagnose() {
    console.log('--- DB Diagnostic ---');
    console.log('URI:', dbUri);
    try {
        await mongoose.connect(dbUri);
        console.log('Connected to DB:', mongoose.connection.name);
        const count = await User.countDocuments();
        console.log('Total Users:', count);
        if (count > 0) {
            const sample = await User.findOne();
            console.log('Sample User ID:', sample._id);
            console.log('Sample User Email:', sample.email);
        } else {
            console.log('WARNING: No users found in this database!');
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error('Diagnostic failed:', err.message);
    }
}

diagnose();
