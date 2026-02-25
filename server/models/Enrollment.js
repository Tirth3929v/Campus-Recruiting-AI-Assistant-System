const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  progress: { type: Number, default: 0 }, // Percentage 0-100
  completed: { type: Boolean, default: false },
  completionDate: Date
}, { timestamps: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);