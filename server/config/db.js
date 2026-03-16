const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ CRITICAL ERROR: MONGODB_URI is not defined in the environment variables!');
    console.error('Please ensure your .env file contains: MONGODB_URI=mongodb://localhost:27017/campus-recruitment');
    process.exit(1);
  }

  console.log(`🔗 Attempting MongoDB connection to unified database: ${uri}`);
  
  let retries = 5;
  while (retries > 0) {
    try {
      const conn = await mongoose.connect(uri);
      console.log(`✅ MongoDB Connected successfully to: ${conn.connection.host}`);
      console.log(`📊 Current Database: ${conn.connection.name}`);
      await conn.connection.db.admin().ping();
      console.log('🏓 DB ping successful - ready for operations');
      return conn;
    } catch (error) {
      retries--;
      console.error(`❌ Connection attempt failed: ${error.message}`);
      if (retries === 0) throw error;
      console.log(`🔄 Retrying in 2s... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};

module.exports = connectDB;

