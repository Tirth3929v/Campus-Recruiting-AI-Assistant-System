import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, CheckCircle2, XCircle, Clock, 
  Mail, MapPin, Globe, ExternalLink, 
  Search, ShieldCheck, AlertCircle, Users
} from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

const CompanyApprovals = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchPendingCompanies();
  }, []);

  const fetchPendingCompanies = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/employee/pending-companies');
      setCompanies(res.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch pending companies');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id, status) => {
    try {
      setProcessingId(id);
      await axiosInstance.post(`/employee/verify-company/${id}`, { status });
      setCompanies(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      alert(`Failed to ${status} company`);
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = companies.filter(c => 
    c.name.toLowerCase().includes(filter.toLowerCase()) ||
    c.email.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading && !companies.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div 
          animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <ShieldCheck className="text-amber-500" size={32} />
            Company Approvals
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Review and verify new business registrations on the platform.
          </p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" placeholder="Search companies..."
            className="pl-10 pr-4 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all w-full md:w-64"
            value={filter} onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      {error ? (
        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 flex items-center gap-3">
          <AlertCircle size={20} />
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-3xl p-12 text-center"
        >
          <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={40} className="text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">All Clear!</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">No pending company registrations to review.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((company) => (
              <motion.div
                key={company._id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-3xl overflow-hidden group hover:shadow-2xl hover:shadow-amber-500/5 transition-all flex flex-col"
              >
                {/* Top Section: Basic Info */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-amber-500/20">
                        {company.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{company.name}</h3>
                        <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-lg text-xs font-bold mt-1 inline-flex">
                          <Clock size={12} /> Pending Review
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Contact Email</span>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 overflow-hidden">
                        <Mail size={14} className="flex-shrink-0" />
                        <span className="truncate">{company.email}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Location</span>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <MapPin size={14} className="flex-shrink-0" />
                        <span>{company.location}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Company Size</span>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <Users size={14} className="flex-shrink-0" />
                        <span>{company.employeeCount}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Website</span>
                      <div className="flex items-center gap-2 text-sm text-amber-500 hover:text-amber-400 cursor-pointer">
                        <Globe size={14} className="flex-shrink-0" />
                        <span className="truncate">{company.website || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bio / Description */}
                <div className="px-6 py-4 bg-gray-50/50 dark:bg-white/5 border-y border-gray-100 dark:border-white/5">
                  <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block mb-1">About Company</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {company.description || 'No description provided by the company.'}
                  </p>
                </div>

                {/* Personnel Emails */}
                <div className="px-6 py-4 flex flex-col gap-2">
                   <div className="flex justify-between items-center text-xs">
                     <span className="text-gray-500">Owner Email:</span>
                     <span className="text-gray-900 dark:text-white font-medium">{company.ownerEmail}</span>
                   </div>
                   <div className="flex justify-between items-center text-xs">
                     <span className="text-gray-500">HR Email:</span>
                     <span className="text-gray-900 dark:text-white font-medium">{company.hrEmail}</span>
                   </div>
                </div>

                {/* Actions */}
                <div className="p-6 mt-auto bg-gray-50/30 dark:bg-white/5-none flex gap-3">
                  <button 
                    onClick={() => handleVerify(company._id, 'rejected')}
                    disabled={processingId === company._id}
                    className="flex-1 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <XCircle size={18} /> Reject
                  </button>
                  <button 
                    onClick={() => handleVerify(company._id, 'approved')}
                    disabled={processingId === company._id}
                    className="flex-[2] py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 size={18} /> Approve Company
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default CompanyApprovals;
