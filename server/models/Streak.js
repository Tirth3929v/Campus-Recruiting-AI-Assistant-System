const mongoose = require('mongoose');

const streakSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userModel' // Allows referencing Student, Admin, Employee, CompanyUser, etc.
  },
  userModel: {
    type: String,
    required: true,
    enum: ['Student', 'Employee', 'CompanyUser', 'Admin', 'User']
  },
  date: {
    type: Date,
    required: true
  },
  // Normalized date string (YYYY-MM-DD) makes searching incredibly fast
  dateString: { 
    type: String,
    required: true
  },
  activitiesCount: {
    type: Number,
    default: 1
  }
}, { timestamps: true });

// Prevent duplicate entries for the exact same user on the exact same day
streakSchema.index({ user: 1, dateString: 1 }, { unique: true });

module.exports = mongoose.model('Streak', streakSchema);
