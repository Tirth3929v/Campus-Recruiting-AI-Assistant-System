const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const AIInterviewSession = require('../models/AIInterviewSession');
const SupportTicket = require('../models/SupportTicket');

// GET /api/admin/dashboard — real aggregate counts
router.get('/dashboard', async (req, res) => {
    try {
        const [totalUsers, activeJobs, totalApplications, totalInterviews, recentUsers] = await Promise.all([
            User.countDocuments(),
            Job.countDocuments({ status: 'Open' }),
            Application.countDocuments(),
            AIInterviewSession.countDocuments(),
            User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt')
        ]);

        res.json({
            stats: { totalUsers, activeJobs, totalApplications, totalInterviews },
            recentActivity: recentUsers.map(u => ({
                id: u._id,
                text: `${u.name} registered as ${u.role}`,
                time: u.createdAt,
                type: 'registration'
            }))
        });
    } catch (err) {
        console.error('Admin dashboard error:', err);
        res.status(500).json({ message: err.message });
    }
});

// GET /api/admin/users — all users with profile info
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/admin/tickets
router.get('/tickets', async (req, res) => {
    try {
        const tickets = await SupportTicket.find().sort({ createdAt: -1 });
        res.json(tickets);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/admin/tickets — create a ticket (any user)
router.post('/tickets', async (req, res) => {
    try {
        const ticket = await SupportTicket.create(req.body);
        res.status(201).json(ticket);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/admin/tickets/:id — update ticket status
router.put('/tickets/:id', async (req, res) => {
    try {
        const ticket = await SupportTicket.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
        res.json(ticket);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
