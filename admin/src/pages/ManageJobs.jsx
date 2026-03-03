import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Trash2, Search, Loader2, AlertTriangle, CheckCircle2, MapPin, Building2 } from 'lucide-react';

const typeColors = {
  'Full-time': 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  'Internship': 'bg-purple-500/15 text-purple-400 border border-purple-500/20',
  'Part-time': 'bg-orange-500/15 text-orange-400 border border-orange-500/20',
  'Contract': 'bg-rose-500/15 text-rose-400 border border-rose-500/20',
};
const statusColors = {
  Open: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  Closed: 'bg-white/10 text-white/40 border border-white/10',
  Paused: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
};

const Toast = ({ message, type, onDone }) => {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <motion.div initial={{ opacity: 0, y: -20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}
      className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-white font-semibold text-sm ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
      {type === 'success' ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />} {message}
    </motion.div>
  );
};

const ConfirmModal = ({ job, onConfirm, onCancel }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
    <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }}
      className="rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center border border-white/10"
      style={{ background: 'rgba(15,20,35,0.95)' }}>
      <div className="w-14 h-14 bg-red-500/15 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
        <AlertTriangle size={26} className="text-red-400" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">Remove Job?</h3>
      <p className="text-white/40 text-sm mb-6">Remove <span className="text-white/70 font-semibold">{job?.title}</span>?</p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-2.5 border border-white/10 rounded-xl text-white/60 font-medium hover:bg-white/5">Cancel</button>
        <button onClick={onConfirm} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium">Remove</button>
      </div>
    </motion.div>
  </motion.div>
);

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

const ManageJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [confirmJob, setConfirmJob] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (m, t = 'success') => setToast({ message: m, type: t });

  useEffect(() => {
    fetch('/api/admin/jobs', { credentials: 'include' })
      .then(r => r.json()).then(setJobs).catch(() => showToast('Failed to load', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async () => {
    if (!confirmJob) return;
    try {
      await fetch(`/api/admin/jobs/${confirmJob._id}`, { method: 'DELETE', credentials: 'include' });
      setJobs(prev => prev.filter(j => j._id !== confirmJob._id));
      showToast(`"${confirmJob.title}" removed`);
    } catch { showToast('Failed to remove', 'error'); }
    finally { setConfirmJob(null); }
  };

  const filtered = jobs.filter(j =>
    j.title?.toLowerCase().includes(search.toLowerCase()) ||
    j.company?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <AnimatePresence>
        {toast && <Toast key="t" {...toast} onDone={() => setToast(null)} />}
        {confirmJob && <ConfirmModal key="m" job={confirmJob} onConfirm={handleDelete} onCancel={() => setConfirmJob(null)} />}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Briefcase size={22} className="text-emerald-400" /> Manage Jobs
          </h2>
          <p className="text-white/30 text-sm mt-1">{jobs.length} total postings</p>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs..."
            className="pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 w-64"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </div>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-24"><Loader2 size={28} className="animate-spin text-emerald-400" /></div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2">
          {filtered.length === 0 ? (
            <div className="col-span-2 text-center py-20 text-white/20">
              <Briefcase size={38} className="mx-auto mb-3 opacity-30" />
              <p>No job postings found</p>
            </div>
          ) : filtered.map(job => (
            <motion.div key={job._id} variants={cardVariants} whileHover={{ y: -3 }}
              className="glass-card rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-white/10 flex-shrink-0">
                    <Building2 size={18} className="text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{job.title}</h3>
                    <p className="text-sm text-white/40">{job.company || 'Unknown'}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${statusColors[job.status] || 'bg-white/10 text-white/40'}`}>
                  {job.status || 'Unknown'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {job.type && <span className={`px-2.5 py-1 rounded-full font-medium ${typeColors[job.type] || 'bg-white/10 text-white/40'}`}>{job.type}</span>}
                {job.location && <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/8 text-white/40 font-medium border border-white/8"><MapPin size={10} />{job.location}</span>}
              </div>
              <div className="flex justify-end border-t border-white/5 pt-3">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setConfirmJob(job)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-xl border border-red-500/15">
                  <Trash2 size={12} /> Remove
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default ManageJobs;