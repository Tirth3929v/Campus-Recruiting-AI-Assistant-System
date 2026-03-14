const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/test', { serverSelectionTimeoutMS: 2000 })
    .then(() => { console.log('success localhost'); process.exit(0); })
    .catch(err => { console.error('fail localhost', err.message); process.exit(1); });
