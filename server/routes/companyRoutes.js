const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Application = require('../models/Application');
const CompanyProfile = require('../models/CompanyProfile');
const CompanyUser = require('../models/CompanyUser');
const Student = require('../models/Student');
const StudentProfile = require('../models/StudentProfile');
const AIInterviewSession = require('../models/AIInterviewSession');
const { protect } = require('../middleware/authMiddleware');
const companyController = require('../controllers/companyController');

// GET /api/company/dashboard — company-specific stats
router.get('/dashboard', protect, async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        if (!userId) return res.status(401).json({ message: 'Not authenticated' });

        // Find the company profile for this user
        const companyProfile = await CompanyProfile.findOne({ userId });
        if (!companyProfile) return res.status(404).json({ message: 'Company profile not found' });

        const companyJobs = await Job.find({ company: companyProfile._id });
        const jobIds = companyJobs.map(j => j._id);

        const activeJobs = companyJobs.filter(j => j.status === 'Open').length;
        const applicationCount = await Application.countDocuments({ job: { $in: jobIds } });

        const scheduledInterviews = await AIInterviewSession.countDocuments({
            job: { $in: jobIds },
            status: { $in: ['NotStarted', 'InProgress'] }
        });

        const recentApplications = await Application.find({ job: { $in: jobIds } })
            .populate({
                path: 'student',
                populate: { path: 'user', model: 'Student', select: 'name' }
            })
            .populate('job', 'title')
            .sort({ createdAt: -1 })
            .limit(5);

        const recentApps = recentApplications.map(app => {
            const studentName = app.student?.user?.name || 'Unknown';
            return {
                id: app._id,
                name: studentName,
                role: app.job?.title || 'N/A',
                date: app.createdAt,
                status: app.status?.toLowerCase() || 'pending',
                avatar: studentName.charAt(0).toUpperCase()
            };
        });

        const activeJobPostings = companyJobs
            .filter(j => j.status === 'Open')
            .map(j => ({
                id: j._id,
                title: j.title,
                applicants: j.applicants?.length || 0,
                posted: j.createdAt,
                status: j.status
            }));

        res.json({
            stats: [
                { label: "Active Jobs", value: activeJobs, icon: "Briefcase", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-500/10", accent: "from-amber-500 to-orange-500" },
                { label: "Total Applicants", value: applicationCount, icon: "Users", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-500/10", accent: "from-blue-500 to-cyan-500" },
                { label: "Interviews Scheduled", value: scheduledInterviews, icon: "Calendar", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-500/10", accent: "from-purple-500 to-pink-500" },
                { label: "Avg. Time to Hire", value: 12, suffix: " days", icon: "TrendingUp", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/10", accent: "from-emerald-500 to-teal-500" }
            ],
            recentApplications: recentApps,
            activeJobs: activeJobPostings
        });
    } catch (err) {
        console.error('Company dashboard error:', err);
        res.status(500).json({ message: err.message });
    }
});

// GET /api/company/students/:id/resume
router.get('/students/:id/resume', async (req, res) => {
    try {
        const studentId = req.params.id;
        const profile = await StudentProfile.findOne({ user: studentId }).select('resume resumeName -_id');
        if (!profile || !profile.resume) return res.status(404).json({ message: 'Resume not found' });
        res.json({ resume: profile.resume, resumeName: profile.resumeName });
    } catch (err) {
        res.status(500).json({ message: 'Server error fetching resume' });
    }
});

// GET /api/company/applicants — retrieve all applicants for company jobs
router.get('/applicants', protect, companyController.getCompanyApplicants);

module.exports = router;
