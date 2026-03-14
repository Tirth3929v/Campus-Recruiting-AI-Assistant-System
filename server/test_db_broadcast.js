const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const Notification = require('./models/Notification');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log('Connected to DB');

        // Find a company
        const company = await User.findOne({ role: 'company' });
        if (!company) {
            console.log("No companies found.");
            process.exit(0);
        }

        console.log(`Company found: ${company.email} (${company._id})`);

        const notifs = await Notification.find({ recipientId: company._id }).sort({ createdAt: -1 });
        console.log(`Found ${notifs.length} expected notifications for this company.`);

        if (notifs.length > 0) {
            console.log("Latest notification:");
            console.log(notifs[0]);
        }

        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
