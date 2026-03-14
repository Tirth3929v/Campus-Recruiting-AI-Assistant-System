const mongoose = require('mongoose');

const streakSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true,
        // Normalized to start of the day for easy comparison
        default: () => {
            const date = new Date();
            date.setHours(0, 0, 0, 0);
            return date;
        }
    },
    activityType: {
        type: String,
        enum: ['login', 'lesson', 'interview', 'heartbeat'],
        default: 'heartbeat'
    }
}, { timestamps: true });

// Ensure a user only has one streak entry per day
streakSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Streak', streakSchema);
