const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' }, // Optional for Mock interviews
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyProfile' },
  date: { type: Date, required: true },
  type: { type: String, enum: ['Technical', 'HR', 'Behavioral', 'Mock'], default: 'Technical' },
  status: { type: String, enum: ['Scheduled', 'Completed', 'Cancelled'], default: 'Scheduled' },
  meetingLink: String,
  feedback: String,
  score: Number // For AI Mock interviews or recruiter grading
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);