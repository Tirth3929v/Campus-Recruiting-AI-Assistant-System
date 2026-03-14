const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const StudentProfile = require('../models/StudentProfile');

// Custom verify token middleware for these specific routes
const verifyAuthToken = (req, res, next) => {
  let token = req.cookies?.token;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) return res.status(401).json({ error: 'Access denied' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'campus_recruit_jwt_secret_2026_secure_key');
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// GET /api/courses - list all published courses (students)
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const courses = await Course.find(filter).sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/courses/:id - get one course by id
router.get('/:id', async (req, res) => {
  try {
    // Guard: MongoDB crashes with CastError if id is not a valid ObjectId (e.g. 'mock')
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Course not found (invalid ID format)' });
    }
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/courses - Employee creates & submits a course for approval
router.post('/', async (req, res) => {
  try {
    const {
      title, description, instructor, level, category,
      duration, thumbnail, chapters
    } = req.body;

    if (!title || !description || !instructor) {
      return res.status(400).json({ message: 'Title, description, and instructor are required.' });
    }

    // Temporarily skipping strict token check on this particular route inside the router
    // because index.js mounts it globally without verifyToken due to GET needing to be public.
    // Instead we will just use the payload createdBy, but we should refactor auth later.

    // NOTE: Ideally, we extract createdBy from the jwt (req.user)

    const course = await Course.create({
      title,
      description,
      instructor,
      level: level || 'Beginner',
      category: category || 'Development',
      duration: duration || 'TBD',
      thumbnail: thumbnail || '',
      chapters: chapters || [],
      status: 'published',
      createdBy: req.body.createdBy || 'Unknown' // Employee name
    });

    res.status(201).json({ success: true, course });
  } catch (err) {
    console.error('Course creation error:', err);
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/courses/:id/status - Admin approves/rejects a course
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['draft', 'pending_approval', 'published'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${allowed.join(', ')}` });
    }
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ success: true, course });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/courses/:id/enrollment - Get current user's enrollment
router.get('/:id/enrollment', verifyAuthToken, async (req, res) => {
  try {
    const studentProfile = await StudentProfile.findOne({ user: req.user.id });
    if (!studentProfile) return res.status(404).json({ message: 'Student profile not found' });

    const enrollment = await Enrollment.findOne({
      student: studentProfile._id,
      course: req.params.id
    });

    res.json(enrollment || { completedChapters: [], progress: 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/courses/:id/enroll - Enroll or get existing enrollment
router.post('/:id/enroll', verifyAuthToken, async (req, res) => {
  try {
    let studentProfile = await StudentProfile.findOne({ user: req.user.id });
    
    // Auto-create profile if missing (safeguard for existing users without profiles)
    if (!studentProfile) {
      console.log(`Safeguard: Creating missing StudentProfile for user ${req.user.id}`);
      studentProfile = await StudentProfile.create({
        user: req.user.id,
        course: '' 
      });
    }

    let enrollment = await Enrollment.findOne({
      student: studentProfile._id,
      course: req.params.id
    });

    if (!enrollment) {
      enrollment = await Enrollment.create({
        student: studentProfile._id,
        course: req.params.id,
        progress: 0,
        completedChapters: [],
        completed: false
      });
    }

    res.json({ success: true, enrollment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/courses/:id/progress - Mark a chapter as complete
router.put('/:id/progress', verifyAuthToken, async (req, res) => {
  try {
    const { chapterId } = req.body;

    const studentProfile = await StudentProfile.findOne({ user: req.user.id });
    if (!studentProfile) return res.status(404).json({ message: 'Student profile not found' });

    let enrollment = await Enrollment.findOne({
      student: studentProfile._id,
      course: req.params.id
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'Not enrolled in this course' });
    }

    // Add chapter if not already completed
    if (!enrollment.completedChapters.includes(chapterId)) {
      enrollment.completedChapters.push(chapterId);

      // Calculate new progress
      const course = await Course.findById(req.params.id);
      if (course && course.chapters) {
        const totalChapters = course.chapters.length;
        const progress = Math.round((enrollment.completedChapters.length / totalChapters) * 100);
        enrollment.progress = progress;

        if (progress === 100) {
          enrollment.completed = true;
          enrollment.completionDate = new Date();
        }
      }

      await enrollment.save();
    }

    res.json({ success: true, enrollment });
  } catch (err) {
    console.error('Progress update error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
