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
    default: 'TBD'
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
    default: 'https://placehold.co/600x400/6366f1/ffffff?text=Course+Image'
  },
  price: {
    type: String,
    default: 'Free'
  },
  thumbnail: {
    type: String,
    default: 'https://placehold.co/300x200/6366f1/ffffff?text=Course+Thumbnail'
  },
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'published'],
    default: 'draft'
  },
  createdBy: {
    type: String, // employee email or name
    default: 'Unknown'
  },
  chapters: [{
    chapterId: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    content: {
      type: String, // Expect HTML/Markdown
      required: true
    },
    videoUrl: {
      type: String // Optional
    },
    order: {
      type: Number,
      required: true
    },
    exercise: {
      question: { type: String },
      options: [{ type: String }],
      answer: { type: Number }
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);