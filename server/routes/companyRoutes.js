const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Application = require('../models/Application');
const CompanyProfile = require('../models/CompanyProfile');
const AIInterviewSession = require('../models/AIInterviewSession');

// GET /api/company/dashboard — company-specific stats
router.get('/dashboard', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Not authenticated' });

        // Find the company profile for this user
        const companyProfile = await CompanyProfile.findOne({ userId });
        if (!companyProfile) return res.status(404).json({ message: 'Company profile not found' });

        // Get all jobs by this company
        const companyJobs = await Job.find({ company: companyProfile._id });
        const jobIds = companyJobs.map(j => j._id);

        // Count stats
        const activeJobs = companyJobs.filter(j => j.status === 'Open').length;

        // Count total applicants from job.applicants arrays
        const totalApplicants = companyJobs.reduce((sum, job) => sum + (job.applicants?.length || 0), 0);

        // Also count from Application model
        const applicationCount = await Application.countDocuments({ job: { $in: jobIds } });
        const totalApplicantsCombined = Math.max(totalApplicants, applicationCount);

        // Scheduled interviews
        const scheduledInterviews = await AIInterviewSession.countDocuments({
            job: { $in: jobIds },
            status: { $in: ['NotStarted', 'InProgress'] }
        });

        // Recent applications (from Application model)
        const recentApplications = await Application.find({ job: { $in: jobIds } })
            .populate('student', 'user')
            .populate('job', 'title')
            .sort({ createdAt: -1 })
            .limit(5);

        // Build recent applications with user names
        const User = require('../models/User');
        const recentApps = await Promise.all(recentApplications.map(async (app) => {
            let studentName = 'Unknown';
            let studentRole = app.job?.title || 'N/A';
            if (app.student?.user) {
                const u = await User.findById(app.student.user).select('name');
                if (u) studentName = u.name;
            }
            return {
                id: app._id,
                name: studentName,
                role: studentRole,
                date: app.createdAt,
                status: app.status?.toLowerCase() || 'pending',
                avatar: studentName.charAt(0).toUpperCase()
            };
        }));

        // Active job postings
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
                { label: "Total Applicants", value: totalApplicantsCombined, icon: "Users", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-500/10", accent: "from-blue-500 to-cyan-500" },
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

module.exports = router;
