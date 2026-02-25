const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a course title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  instructor: {
    type: String,
    required: [true, 'Please add an instructor name']
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: ['Development', 'Design', 'Data Science', 'Business', 'Marketing', 'Soft Skills'],
    default: 'Development'
  },
  level: {
    type: String,
    required: [true, 'Please add a difficulty level'],
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  duration: {
    type: String,
    required: [true, 'Please add duration (e.g., "10h 30m")']
  },
  rating: {
    type: Number,
    default: 4.5
  },
  students: {
    type: Number,
    default: 0
  },
  image: {
    type: String,
    default: 'https://via.placeholder.com/300'
  },
  price: {
    type: String,
    default: 'Free'
  }
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);