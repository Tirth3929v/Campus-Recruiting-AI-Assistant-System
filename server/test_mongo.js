const mongoose = require('mongoose');

async function testConnection() {
    console.log("Attempting to connect to 127.0.0.1:27017...");
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/campus_recruit', { serverSelectionTimeoutMS: 5000 });
        console.log("Success: Connected to 127.0.0.1");
    } catch (err) {
        console.error("Failed 127.0.0.1:", err.message);
    }

    console.log("Attempting to connect to localhost:27017...");
    try {
        await mongoose.connect('mongodb://localhost:27017/campus_recruit', { serverSelectionTimeoutMS: 5000 });
        console.log("Success: Connected to localhost");
    } catch (err) {
        console.error("Failed localhost:", err.message);
    }

    process.exit();
}
testConnection();
