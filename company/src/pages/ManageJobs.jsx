import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Plus, Search, Edit3, Trash2, MapPin, DollarSign, Clock, Users, X, Briefcase, ArrowUpRight } from 'lucide-react';

const Reveal = ({ children, delay = 0, className = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 40, filter: "blur(6px)" }}
      animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
};

const emptyJob = { title: '', company: '', location: '', salary: '', type: 'Full-time', description: '', tags: '' };

const ManageJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [formData, setFormData] = useState(emptyJob);

  useEffect(() => {
    document.title = "Manage Jobs | CampusHire";
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs');
      if (res.ok) { setJobs(await res.json()); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData, tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean) };
    try {
      if (editingJob) {
        const res = await fetch(`/api/jobs/${editingJob._id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload), credentials: 'include'
        });
        if (res.ok) fetchJobs();
      } else {
        const res = await fetch('/api/jobs', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload), credentials: 'include'
        });
        if (res.ok) fetchJobs();
      }
    } catch (e) { console.error(e); }
    closeModal();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this job posting?')) return;
    try {
      await fetch(`/api/jobs/${id}`, { method: 'DELETE', credentials: 'include' });
      fetchJobs();
    } catch (e) { console.error(e); }
  };

  const openCreate = () => { setEditingJob(null); setFormData(emptyJob); setShowModal(true); };
  const openEdit = (job) => {
    setEditingJob(job);
    setFormData({ ...job, tags: Array.isArray(job.tags) ? job.tags.join(', ') : '' });
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditingJob(null); setFormData(emptyJob); };

  const filtered = jobs.filter(j =>
    j.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative min-h-full">
      <div className="ambient-bg" />
      <div className="relative z-10 space-y-5">

        {/* Header */}
        <Reveal>
          <div className="glass-panel rounded-2xl p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                  Job <span className="text-gradient-vivid">Postings</span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{jobs.length} total postings</p>
              </div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={openCreate}
                className="btn-gradient px-5 py-3 rounded-xl font-bold flex items-center gap-2 text-sm">
                <Plus size={18} /> New Job Posting
              </motion.button>
            </div>
            <div className="relative group max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" size={18} />
              <input type="text" placeholder="Search jobs..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white text-sm" />
            </div>
          </div>
        </Reveal>

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card rounded-2xl p-6 space-y-3">
                <div className="skeleton h-5 w-3/4" />
                <div className="skeleton h-4 w-1/2" />
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-10 w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Job Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((job, i) => (
              <Reveal key={job._id || i} delay={i * 0.06}>
                <motion.div whileHover={{ y: -4, scale: 1.01 }}
                  className="glass-card-interactive rounded-2xl p-5 gradient-border h-full flex flex-col group">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors text-sm">{job.title}</h3>
                    <div className="flex gap-1">
                      <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
                        onClick={() => openEdit(job)}
                        className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-500/10 rounded-lg transition-colors">
                        <Edit3 size={14} className="text-blue-500" />
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(job._id)}
                        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 size={14} className="text-red-500" />
                      </motion.button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{job.company}</p>
                  <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400 flex-1 mb-3">
                    {job.location && <div className="flex items-center gap-1.5"><MapPin size={12} /> {job.location}</div>}
                    {job.salary && <div className="flex items-center gap-1.5"><DollarSign size={12} /> {job.salary}</div>}
                    {job.type && <div className="flex items-center gap-1.5"><Clock size={12} /> {job.type}</div>}
                  </div>
                  {job.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {job.tags.slice(0, 4).map((tag, ti) => (
                        <span key={ti} className="text-[10px] bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md font-medium border border-amber-100 dark:border-amber-500/20">{tag}</span>
                      ))}
                    </div>
                  )}
                </motion.div>
              </Reveal>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <Reveal>
            <div className="text-center py-16 glass-panel rounded-2xl">
              <Briefcase size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 text-lg">{searchTerm ? 'No jobs match your search.' : 'No jobs posted yet.'}</p>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={openCreate}
                className="btn-gradient px-5 py-2.5 rounded-xl font-bold mt-4 text-sm inline-flex items-center gap-2">
                <Plus size={16} /> Create First Job
              </motion.button>
            </div>
          </Reveal>
        )}
      </div>

      {/* ── Create/Edit Modal ──────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={closeModal}>
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 40 }}
              transition={{ type: "spring", damping: 22, stiffness: 300 }}
              className="glass-panel rounded-2xl p-7 w-full max-w-lg max-h-[85vh] overflow-y-auto custom-scrollbar"
              onClick={(e) => e.stopPropagation()}>

              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingJob ? 'Edit Job' : 'Create Job Posting'}
                </h3>
                <button onClick={closeModal} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg">
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {[
                  { key: 'title', label: 'Job Title', placeholder: 'e.g. React Developer', required: true },
                  { key: 'company', label: 'Company Name', placeholder: 'e.g. TechCorp Inc.' },
                  { key: 'location', label: 'Location', placeholder: 'e.g. Bangalore, India' },
                  { key: 'salary', label: 'Salary Range', placeholder: 'e.g. ₹6-10 LPA' },
                ].map(field => (
                  <div key={field.key} className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{field.label}</label>
                    <input type="text" required={field.required} placeholder={field.placeholder}
                      value={formData[field.key]}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 px-4 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all" />
                  </div>
                ))}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Job Type</label>
                  <select value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 px-4 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none">
                    {['Full-time', 'Part-time', 'Internship', 'Contract'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</label>
                  <textarea rows="3" placeholder="Job description..." value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 px-4 text-sm resize-none text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tags (comma separated)</label>
                  <input type="text" placeholder="React, Node.js, MongoDB..." value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 px-4 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
                <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className="w-full py-3 btn-gradient rounded-xl font-bold text-sm">
                  {editingJob ? 'Save Changes' : 'Post Job'}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageJobs;