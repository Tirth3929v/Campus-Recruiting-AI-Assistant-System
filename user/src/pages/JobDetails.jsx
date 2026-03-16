import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { motion } from 'framer-motion';
import { 
  MapPin, Briefcase, DollarSign, Clock, Calendar, 
  ArrowLeft, Share2, Bookmark, CheckCircle2, 
  AlertCircle, Loader2, ExternalLink
} from 'lucide-react';

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      // Backend returns job with 'isApplied' when using our search/list logic
      // However, /api/jobs/:id might not include it yet if we didn't update it
      // Let's check the route logic in jobRoutes.js
      const res = await axiosInstance.get(`/jobs/${id}`);
      
      // We also need isApplied status for the specific user
      // Since the list view already has it, we can fetch all and find this one 
      // or we can rely on the backend to provide it in the details route too.
      // Let's assume we might need a quick hack or we can update the route.
      // For now, let's fetch the list to see if we can get isApplied 
      // OR better, update the backend route to include isApplied for details.
      
      setJob(res.data);
    } catch (err) {
      console.error('Error fetching job details:', err);
      setError(err.response?.data?.message || 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    try {
      setApplying(true);
      const res = await axiosInstance.post(`/jobs/${id}/apply`);
      if (res.data.success) {
        setJob(prev => ({ ...prev, isApplied: true }));
        alert('Application submitted successfully!');
      }
    } catch (err) {
      console.error('Apply error:', err);
      const msg = err.response?.data?.message || 'Failed to submit application';
      
      if (msg.toLowerCase().includes('resume')) {
        alert(`❌ Error: ${msg}\n\nPlease head to your Profile page to upload your resume before applying.`);
      } else {
        alert(msg);
      }
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-purple-600 mb-4" size={40} />
        <p className="text-gray-500 animate-pulse font-medium">Loading opportunity details...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="glass-panel p-12 text-center rounded-2xl">
        <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h2>
        <p className="text-gray-500 mb-6">{error || 'Job not found'}</p>
        <Link to="/student/jobs" className="btn-gradient px-6 py-2 rounded-xl text-white font-bold inline-flex items-center gap-2">
          <ArrowLeft size={18} /> Back to Jobs
        </Link>
      </div>
    );
  }

  const company = job.company || {};

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* ── Header ── */}
      <div className="flex items-center gap-4 mb-2">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors text-gray-500"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="text-sm font-medium text-gray-400">Job Details</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main Content ── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel rounded-3xl p-8 md:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 flex gap-2">
              <button className="p-3 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl hover:bg-gray-50 transition-colors">
                <Share2 size={18} className="text-gray-500" />
              </button>
              <button className="p-3 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl hover:bg-gray-50 transition-colors">
                <Bookmark size={18} className="text-gray-500" />
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start mb-8">
              <div className="h-20 w-20 rounded-2xl overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl shadow-xl">
                {company.logo ? (
                  <img src={company.logo} alt={company.companyName} className="w-full h-full object-cover" />
                ) : (
                  (company.companyName || 'U').charAt(0)
                )}
              </div>
              <div className="pt-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{job.title}</h1>
                <div className="flex flex-wrap items-center gap-4 text-gray-500 dark:text-gray-400 font-medium">
                  <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-lg text-sm">
                    <Briefcase size={16} className="text-purple-500" /> {company.companyName}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <MapPin size={16} /> {job.location}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-gray-50 dark:bg-white/5 rounded-2xl mb-10 border border-gray-100 dark:border-white/10">
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Salary Range</span>
                <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1">
                  <DollarSign size={14} className="text-emerald-500" /> {job.salary}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Job Type</span>
                <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1">
                  <Clock size={14} className="text-blue-500" /> {job.type}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Experience</span>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Open Level</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Closing Date</span>
                <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1">
                  <Calendar size={14} className="text-rose-500" /> 2 Weeks
                </p>
              </div>
            </div>

            <div className="space-y-8">
              <section>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-purple-600 rounded-full" /> Job Description
                </h2>
                <div className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {job.description}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-purple-600 rounded-full" /> Key Requirements
                </h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(job.requirements || []).map((req, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-600 dark:text-gray-300 text-sm bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/10">
                      <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-6">
          <div className="glass-panel p-8 rounded-3xl sticky top-6 border-2 border-purple-500/20 ">
            <h3 className="font-bold text-gray-900 dark:text-white mb-6">Ready to apply?</h3>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <div className="w-8 h-8 rounded-full bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center text-violet-600">1</div>
                Confirm your profile is up-to-date
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <div className="w-8 h-8 rounded-full bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center text-violet-600">2</div>
                Attach your primary resume
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <div className="w-8 h-8 rounded-full bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center text-violet-600">3</div>
                Review and Submit
              </div>
            </div>

            <motion.button
              onClick={handleApply}
              disabled={applying || job.isApplied}
              whileHover={{ scale: job.isApplied ? 1 : 1.02 }}
              whileTap={{ scale: job.isApplied ? 1 : 0.98 }}
              className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-xl transition-all ${
                job.isApplied 
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20"
                  : "btn-gradient text-white shadow-purple-500/20"
              }`}
            >
              {applying ? (
                <Loader2 className="animate-spin" size={24} />
              ) : job.isApplied ? (
                <>Already Applied <CheckCircle2 size={24} /></>
              ) : (
                <>Apply Now <ExternalLink size={20} /></>
              )}
            </motion.button>
            
            {job.isApplied && (
              <p className="text-center text-xs text-emerald-500 font-medium mt-4">
                We've received your application. Good luck!
              </p>
            )}
          </div>

          <div className="glass-panel p-8 rounded-3xl bg-gradient-to-br from-gray-900 to-black text-white relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
               <Briefcase size={120} />
             </div>
             <h4 className="font-bold text-xl mb-3 relative z-10">About {company.companyName}</h4>
             <p className="text-gray-400 text-sm mb-6 line-clamp-4 relative z-10 leading-relaxed">
               {company.description || "Leading innovator in their field, committed to delivering excellence and pushing boundaries."}
             </p>
             {company.website && (
               <a 
                href={company.website}
                target="_blank"
                rel="noreferrer"
                className="text-purple-400 text-sm font-bold flex items-center gap-1 hover:text-purple-300 transition-colors relative z-10"
               >
                 Visit Website <ExternalLink size={14} />
               </a>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;
