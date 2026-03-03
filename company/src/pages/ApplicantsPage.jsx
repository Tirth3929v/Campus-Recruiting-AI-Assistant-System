import React, { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Users, Search, Filter, Eye, CheckCircle, XCircle, Clock, Star, Mail } from 'lucide-react';

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

const applicants = [
    { id: 1, name: "Alice Johnson", email: "alice@example.com", role: "React Developer", score: 92, status: "shortlisted", skills: ["React", "TypeScript", "Node.js"], applied: "2 hours ago" },
    { id: 2, name: "Bob Smith", email: "bob@example.com", role: "Backend Engineer", score: 85, status: "pending", skills: ["Node.js", "MongoDB", "Express"], applied: "5 hours ago" },
    { id: 3, name: "Charlie Davis", email: "charlie@example.com", role: "UI/UX Designer", score: 78, status: "reviewed", skills: ["Figma", "CSS", "React"], applied: "1 day ago" },
    { id: 4, name: "Diana Evans", email: "diana@example.com", role: "Full Stack Developer", score: 88, status: "shortlisted", skills: ["React", "Django", "PostgreSQL"], applied: "1 day ago" },
    { id: 5, name: "Ethan Hunt", email: "ethan@example.com", role: "DevOps Engineer", score: 71, status: "rejected", skills: ["Docker", "AWS", "CI/CD"], applied: "2 days ago" },
    { id: 6, name: "Fiona Green", email: "fiona@example.com", role: "Data Analyst", score: 95, status: "shortlisted", skills: ["Python", "SQL", "Tableau"], applied: "3 days ago" },
    { id: 7, name: "George White", email: "george@example.com", role: "React Developer", score: 68, status: "pending", skills: ["React", "JavaScript", "HTML"], applied: "3 days ago" },
];

const statusConfig = {
    pending: { color: "bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20", icon: Clock },
    reviewed: { color: "bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20", icon: Eye },
    shortlisted: { color: "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20", icon: CheckCircle },
    rejected: { color: "bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20", icon: XCircle },
};

const ApplicantsPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const filtered = applicants.filter(a => {
        const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.role.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="relative min-h-full">
            <div className="ambient-bg" />
            <div className="relative z-10 space-y-5">

                <Reveal>
                    <div className="glass-panel rounded-2xl p-6">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-1">
                            <span className="text-gradient-vivid">Applicants</span>
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">{applicants.length} total candidates</p>

                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="relative group flex-1">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" size={18} />
                                <input type="text" placeholder="Search by name or role..." value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white text-sm" />
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {['all', 'pending', 'reviewed', 'shortlisted', 'rejected'].map(status => (
                                    <motion.button key={status} whileTap={{ scale: 0.95 }}
                                        onClick={() => setStatusFilter(status)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${statusFilter === status
                                            ? 'btn-gradient text-white'
                                            : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10'
                                            }`}>
                                        {status}
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </div>
                </Reveal>

                {/* Applicant Cards */}
                <div className="space-y-3">
                    {filtered.map((applicant, i) => {
                        const StatusIcon = statusConfig[applicant.status]?.icon || Clock;
                        return (
                            <Reveal key={applicant.id} delay={i * 0.06}>
                                <motion.div whileHover={{ scale: 1.005, x: 4 }}
                                    className="glass-card-interactive rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group cursor-pointer">
                                    <div className="flex items-center gap-4 flex-1">
                                        <motion.div whileHover={{ rotate: 5, scale: 1.1 }}
                                            className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-lg flex-shrink-0">
                                            {applicant.name[0]}
                                        </motion.div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{applicant.name}</h3>
                                            <p className="text-xs text-gray-500">{applicant.role} · Applied {applicant.applied}</p>
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {applicant.skills.map((skill, si) => (
                                                    <span key={si} className="text-[10px] bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-md font-medium">{skill}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {/* Score */}
                                        <div className="text-center">
                                            <div className={`text-lg font-bold ${applicant.score >= 80 ? 'text-emerald-600 dark:text-emerald-400' : applicant.score >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                                                {applicant.score}
                                            </div>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Score</p>
                                        </div>

                                        {/* Status */}
                                        <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full border capitalize flex items-center gap-1 ${statusConfig[applicant.status]?.color}`}>
                                            <StatusIcon size={10} /> {applicant.status}
                                        </span>

                                        {/* Actions */}
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                                                className="p-2 hover:bg-amber-100 dark:hover:bg-amber-500/10 rounded-lg transition-colors" title="View Profile">
                                                <Eye size={16} className="text-amber-600 dark:text-amber-400" />
                                            </motion.button>
                                            <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                                                className="p-2 hover:bg-blue-100 dark:hover:bg-blue-500/10 rounded-lg transition-colors" title="Send Email">
                                                <Mail size={16} className="text-blue-600 dark:text-blue-400" />
                                            </motion.button>
                                            <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                                                className="p-2 hover:bg-emerald-100 dark:hover:bg-emerald-500/10 rounded-lg transition-colors" title="Shortlist">
                                                <Star size={16} className="text-emerald-600 dark:text-emerald-400" />
                                            </motion.button>
                                        </div>
                                    </div>
                                </motion.div>
                            </Reveal>
                        );
                    })}
                </div>

                {filtered.length === 0 && (
                    <Reveal>
                        <div className="text-center py-16 glass-panel rounded-2xl">
                            <Users size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                            <p className="text-gray-500 text-lg">No applicants match your criteria.</p>
                        </div>
                    </Reveal>
                )}
            </div>
        </div>
    );
};

export default ApplicantsPage;
