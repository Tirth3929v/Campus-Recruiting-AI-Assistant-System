import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { motion, useInView } from 'framer-motion';
import { Search, MapPin, Filter, Briefcase, DollarSign, Clock, ArrowUpRight, Sparkles, Loader2, Eye } from 'lucide-react';

// ─── Scroll Reveal ────────────────────────────────────────────
const Reveal = ({ children, delay = 0, className = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 30, filter: "blur(4px)" }}
      animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
};

const JobCard = ({ job, index, onApply, applying }) => (
  <Reveal delay={index * 0.08}>
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="glass-card-interactive rounded-2xl p-8 group gradient-border h-full flex flex-col"
    >
      <div className="flex justify-between items-start mb-6">
        <Link to={`/student/jobs/${job.id}`}>
          <motion.div whileHover={{ rotate: 5, scale: 1.1 }}
            className={`h-14 w-14 rounded-xl overflow-hidden ${job.color || 'bg-gradient-to-br from-violet-500 to-purple-600'} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
            {/* Same logo logic */}
            {typeof job.logo === 'string' && (job.logo.startsWith('http') || job.logo.startsWith('/')) ? (
              <img 
                src={job.logo} 
                alt={job.company} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                  e.target.parentNode.innerText = job.company?.charAt(0) || '?';
                }}
              />
            ) : (
              job.logo || job.company?.charAt(0) || '?'
            )}
          </motion.div>
        </Link>
        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-gray-100 dark:border-white/10">
          {job.posted}
        </span>
      </div>

      <Link to={`/student/jobs/${job.id}`} className="block group/title">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover/title:text-purple-600 dark:group-hover/title:text-purple-400 transition-colors mb-1">{job.title}</h3>
      </Link>
      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-6">{job.company}</p>

      <div className="space-y-3 mb-6 flex-1">
        <div className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
          <MapPin size={16} className="text-gray-400 flex-shrink-0" /> {job.location}
        </div>
        <div className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
          <DollarSign size={16} className="text-gray-400 flex-shrink-0" /> {job.salary}
        </div>
        <div className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
          <Clock size={16} className="text-gray-400 flex-shrink-0" /> {job.type}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {(job.tags || []).map((tag, i) => (
          <span key={i} className="text-xs bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 px-3 py-1.5 rounded-lg font-medium border border-violet-100 dark:border-violet-500/20">
            {tag}
          </span>
        ))}
      </div>

      <div className="flex gap-3">
        <Link 
          to={`/student/jobs/${job.id}`} 
          className="flex-1 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        >
          <Eye size={18} /> Details
        </Link>
        <motion.button
          onClick={() => onApply(job.id)}
          disabled={applying === job.id || job.isApplied}
          whileHover={{ scale: job.isApplied ? 1 : 1.03 }} 
          whileTap={{ scale: job.isApplied ? 1 : 0.97 }}
          className={`flex-[2] py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
            job.isApplied 
              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 cursor-default"
              : "btn-gradient text-white shadow-md hover:shadow-lg disabled:opacity-50"
          }`}
        >
          {applying === job.id ? (
            <Loader2 className="animate-spin" size={18} />
          ) : job.isApplied ? (
            <>Already Applied ✅</>
          ) : (
            <>Apply Now <ArrowUpRight size={18} /></>
          )}
        </motion.button>
      </div>
    </motion.div>
  </Reveal>
);

const JobsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/jobs');
      setJobs(res.data);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (jobId) => {
    try {
      setApplying(jobId);
      const res = await axiosInstance.post(`/jobs/${jobId}/apply`);
      if (res.data.success) {
        // Update local state to show 'Already Applied' without refetching all
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, isApplied: true } : j));
        alert('Application submitted successfully!');
      }
    } catch (err) {
      console.error('Apply error:', err);
      const msg = err.response?.data?.message || 'Failed to submit application';
      
      // Special alert for missing resume
      if (msg.toLowerCase().includes('resume')) {
        alert(`❌ Error: ${msg}\n\nPlease head to your Profile page to upload your resume before applying.`);
      } else {
        alert(msg);
      }
    } finally {
      setApplying(null);
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (job.company || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-full relative">
      <div className="ambient-bg" />

      <div className="relative z-10 space-y-8">
        {/* ── Header & Search ────────────────────────── */}
        <Reveal>
          <div className="glass-panel rounded-2xl p-8">
            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                Find Your <span className="text-gradient-vivid">Dream Job</span>
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Discover opportunities from top companies</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors" size={18} />
                <input type="text" placeholder="Search by job title or company..."
                  className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="relative group">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors" size={18} />
                <input type="text" placeholder="Location"
                  className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white" />
              </div>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="btn-gradient px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2">
                <Filter size={18} /> Filter
              </motion.button>
            </div>
          </div>
        </Reveal>

        {/* ── Job Grid ───────────────────────────────── */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-purple-500" size={40} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredJobs.map((job, index) => (
                <JobCard key={job.id} job={job} index={index} onApply={handleApply} applying={applying} />
              ))}
            </div>

            {filteredJobs.length === 0 && (
              <Reveal>
                <div className="text-center py-20 glass-panel rounded-2xl">
                  <Briefcase size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 text-lg">No jobs found matching your criteria.</p>
                </div>
              </Reveal>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default JobsPage;
