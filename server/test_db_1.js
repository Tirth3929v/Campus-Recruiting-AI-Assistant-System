const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/test', { serverSelectionTimeoutMS: 2000 })
    .then(() => { console.log('success 127.0.0.1'); process.exit(0); })
    .catch(err => { console.error('fail 127.0.0.1', err.message); process.exit(1); });
