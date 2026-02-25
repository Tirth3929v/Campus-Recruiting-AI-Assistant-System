const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  phone: String,
  course: String,
  bio: String,
  skills: [String],
  resume: String, // URL or Base64 string
  resumeName: String,
  cgpa: Number,
  graduationYear: Number,
  streak: { type: Number, default: 0 },
  weeklyGoal: { type: Number, default: 2 }
}, { timestamps: true });

module.exports = mongoose.model('StudentProfile', studentProfileSchema);