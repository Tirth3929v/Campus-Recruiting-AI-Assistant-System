const express = require('express');
const router = express.Router();
const Course = require('../models/Course');

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

module.exports = router;
