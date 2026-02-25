const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Connecting to MongoDB using the provided connection string
    const conn = await mongoose.connect('mongodb+srv://localhost/965');

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;