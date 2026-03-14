const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Application = require('../models/Application');
const CompanyProfile = require('../models/CompanyProfile');
const StudentProfile = require('../models/StudentProfile');

// GET /api/jobs — public listing of all open jobs
router.get('/', async (req, res) => {
    try {
        const { search, location, type } = req.query;
        const filter = { status: 'Open' };

        if (type) filter.type = type;
        if (location) filter.location = { $regex: location, $options: 'i' };

        let jobs = await Job.find(filter)
            .populate('company', 'companyName logo location')
            .sort({ createdAt: -1 });

        // Apply search filter on title/company name
        if (search) {
            const s = search.toLowerCase();
            jobs = jobs.filter(j =>
                j.title.toLowerCase().includes(s) ||
                (j.company?.companyName || '').toLowerCase().includes(s)
            );
        }

        // Map to frontend-friendly format
        const result = jobs.map(j => {
            const colors = [
                'bg-gradient-to-br from-violet-500 to-purple-600',
                'bg-gradient-to-br from-blue-500 to-cyan-600',
                'bg-gradient-to-br from-emerald-500 to-teal-600',
                'bg-gradient-to-br from-amber-500 to-orange-600',
                'bg-gradient-to-br from-pink-500 to-rose-600'
            ];
            return {
                id: j._id,
                title: j.title,
                company: j.company?.companyName || 'Unknown Company',
                location: j.location,
                salary: j.salary,
                type: j.type,
                posted: _timeAgo(j.createdAt),
                tags: j.requirements?.slice(0, 4) || [],
                description: j.description,
                logo: (j.company?.companyName || 'U').charAt(0),
                color: colors[Math.floor(Math.random() * colors.length)],
                applicantCount: j.applicants?.length || 0
            };
        });

        res.json(result);
    } catch (err) {
        console.error('Jobs listing error:', err);
        res.status(500).json({ message: err.message });
    }
});

// GET /api/jobs/:id — single job details
router.get('/:id', async (req, res) => {
    try {
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ message: 'Job not found' });
        }
        const job = await Job.findById(req.params.id)
            .populate('company', 'companyName logo location description website');
        if (!job) return res.status(404).json({ message: 'Job not found' });
        res.json(job);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/jobs/:id/apply — student applies to a job
router.post('/:id/apply', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Not authenticated' });

        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Job not found' });

        // Check if already applied
        const alreadyApplied = job.applicants.some(a => a.user?.toString() === userId);
        if (alreadyApplied) return res.status(400).json({ message: 'Already applied to this job' });

        // Add to job applicants
        job.applicants.push({ user: userId, status: 'Applied' });
        await job.save();

        // Also create Application record
        const studentProfile = await StudentProfile.findOne({ user: userId });
        if (studentProfile) {
            await Application.create({
                job: job._id,
                student: studentProfile._id,
                status: 'Applied',
                coverLetter: req.body.coverLetter || ''
            });
        }

        res.json({ success: true, message: 'Application submitted!' });
    } catch (err) {
        console.error('Apply error:', err);
        res.status(500).json({ message: err.message });
    }
});

// POST /api/jobs — create a new job posting (company/admin only)
router.post('/', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Not authenticated' });

        const { title, company, location, salary, type, description, tags } = req.body;

        // Find or create company profile for this user
        let companyProfile = await CompanyProfile.findOne({ userId });
        if (!companyProfile) {
            companyProfile = await CompanyProfile.create({
                userId,
                companyName: company || 'My Company',
                description: 'We are a great company',
                location: location || 'Remote'
            });
        }

        const newJob = await Job.create({
            title,
            company: companyProfile._id,
            postedBy: userId,
            location,
            salary,
            type,
            description,
            requirements: tags || []
        });

        res.status(201).json(newJob);
    } catch (err) {
        console.error('Create job error:', err);
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/jobs/:id — update an existing job posting
router.put('/:id', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Not authenticated' });
        
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Job not found' });
        
        if (job.postedBy.toString() !== userId && req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized to edit this job' });
        }

        const { title, location, salary, type, description, tags } = req.body;
        
        job.title = title || job.title;
        job.location = location || job.location;
        job.salary = salary || job.salary;
        job.type = type || job.type;
        job.description = description || job.description;
        if (tags) job.requirements = tags;
        
        await job.save();
        res.json(job);
    } catch (err) {
        console.error('Update job error:', err);
        res.status(500).json({ message: err.message });
    }
});

// DELETE /api/jobs/:id — delete a job posting
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Not authenticated' });

        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Job not found' });

        if (job.postedBy.toString() !== userId && req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized to delete this job' });
        }

        await Job.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Job deleted' });
    } catch (err) {
        console.error('Delete job error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Helper: time ago
function _timeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} days ago`;
    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
}

module.exports = router;
