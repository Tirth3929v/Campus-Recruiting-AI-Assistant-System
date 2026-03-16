const Job = require('../models/Job');
const CompanyProfile = require('../models/CompanyProfile');

/**
 * @desc    Get all applicants for jobs posted by the company
 * @route   GET /api/company/applicants
 * @access  Private (Company)
 */
exports.getCompanyApplicants = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;

        // 1. Find the company profile for this user
        const companyProfile = await CompanyProfile.findOne({ userId });
        if (!companyProfile) {
            return res.status(404).json({ message: 'Company profile not found' });
        }

        // 2. Find all jobs for this company and populate student info from the applicants array
        const jobs = await Job.find({ company: companyProfile._id })
            .populate({
                path: 'applicants.user',
                select: 'name email course profilePicture'
            })
            .sort({ createdAt: -1 });

        // 3. Transform and flatten the data for a clean frontend array
        const allApplicants = [];
        jobs.forEach(job => {
            (job.applicants || []).forEach(applicant => {
                allApplicants.push({
                    jobId: job._id,
                    jobTitle: job.title,
                    applicationId: applicant._id,
                    studentId: applicant.user?._id,
                    name: applicant.user?.name || 'Unknown',
                    email: applicant.user?.email || 'N/A',
                    course: applicant.user?.course || 'N/A',
                    resumeLink: applicant.resumeLink,
                    status: applicant.status,
                    appliedAt: applicant.appliedAt,
                    profilePicture: applicant.user?.profilePicture
                });
            });
        });

        // 4. Sort by most recent application
        allApplicants.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

        res.json(allApplicants);
    } catch (err) {
        console.error('getCompanyApplicants error:', err);
        res.status(500).json({ message: 'Server error fetching applicants' });
    }
};
