import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { Play, MoreVertical, Search, Filter, ChevronDown, CreditCard, Sparkles, BookOpen, Clock, Users } from 'lucide-react';

// ─── Scroll Reveal ────────────────────────────────────────────
const Reveal = ({ children, delay = 0, className = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 40, scale: 0.97, filter: "blur(6px)" }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
};

const CoursesPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    document.title = "Courses | Campus Recruit";
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/courses');
        if (!response.ok) throw new Error('Failed to fetch courses');
        const data = await response.json();
        setCourses(data);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Failed to load courses. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevel === 'All' || course.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  useEffect(() => { setVisibleCount(6); }, [searchQuery, selectedLevel]);

  return (
    <div className="min-h-full">
      {/* Ambient background */}
      <div className="ambient-bg" />

      <div className="relative z-10 space-y-8">
        {/* ── Header ───────────────────────────────────── */}
        <Reveal>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight"
              >
                My <span className="text-gradient-vivid">Courses</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.15 }}
                className="text-gray-500 dark:text-gray-400 text-lg mt-1"
              >
                Continue where you left off
              </motion.p>
            </div>
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(139, 92, 246, 0.3)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/payment')}
              className="flex items-center gap-2 px-6 py-3 btn-gradient rounded-xl font-semibold"
            >
              <CreditCard size={18} /> Buy Premium
              <Sparkles size={16} className="animate-pulse" />
            </motion.button>
          </div>
        </Reveal>

        {/* ── Search & Filter ──────────────────────────── */}
        <Reveal delay={0.1}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text" placeholder="Search for courses..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 glass-card rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              />
            </div>
            <div className="min-w-[200px] relative">
              <select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full px-4 py-3.5 glass-card rounded-xl text-gray-900 dark:text-white cursor-pointer focus:ring-2 focus:ring-purple-500 outline-none appearance-none">
                <option value="All">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
              <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>
          </div>
        </Reveal>

        {/* ── Course Grid ─────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-card rounded-2xl overflow-hidden">
                <div className="h-48 skeleton" />
                <div className="p-6 space-y-3">
                  <div className="h-6 w-3/4 skeleton" />
                  <div className="h-4 w-1/2 skeleton" />
                  <div className="h-2 w-full skeleton mt-4" />
                  <div className="h-12 w-full skeleton mt-4 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <Reveal>
            <div className="text-center py-16 glass-panel rounded-2xl">
              <div className="text-red-500 dark:text-red-400 text-lg font-semibold">{error}</div>
            </div>
          </Reveal>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredCourses.length > 0 ? (
              filteredCourses.slice(0, visibleCount).map((course, index) => (
                <Reveal key={course.id || index} delay={index * 0.08}>
                  <motion.div
                    whileHover={{ y: -6, scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="group glass-card rounded-2xl overflow-hidden gradient-border"
                  >
                    {/* Card Image */}
                    <div className="h-48 relative overflow-hidden">
                      <img src={course.image} alt={course.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute top-4 right-4 p-2 glass-panel rounded-lg cursor-pointer hover:bg-white/20 transition-colors">
                        <MoreVertical size={16} className="text-white" />
                      </div>
                      <div className="absolute bottom-4 left-4 flex gap-2">
                        <span className="px-3 py-1 text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full backdrop-blur-md">
                          {course.level}
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6">
                      <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white group-hover:text-gradient transition-all line-clamp-1">
                        {course.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 flex items-center gap-1">
                        <Users size={14} /> {course.instructor}
                      </p>

                      {/* Progress Bar */}
                      <div className="mb-5">
                        <div className="flex justify-between text-xs mb-2 font-medium">
                          <span className="text-gray-600 dark:text-gray-300">{course.progress}% Complete</span>
                          <span className="text-gray-400">{course.completedLessons}/{course.totalLessons}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${course.progress}%` }}
                            transition={{ duration: 1.5, delay: 0.3 + index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                            className="bg-gradient-to-r from-violet-500 to-blue-500 h-full rounded-full shadow-lg shadow-violet-500/20"
                          />
                        </div>
                      </div>

                      {/* CTA */}
                      <motion.button
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={() => navigate(`/student/courses/${course.id || course._id}`)}
                        className="w-full py-3.5 rounded-xl btn-gradient flex items-center justify-center gap-2 font-bold"
                      >
                        <Play size={18} className="fill-current" /> Continue Learning
                      </motion.button>
                    </div>
                  </motion.div>
                </Reveal>
              ))
            ) : (
              <Reveal className="col-span-full">
                <div className="text-center py-16 glass-panel rounded-2xl">
                  <BookOpen size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 text-lg">No courses found matching your filters.</p>
                </div>
              </Reveal>
            )}

            {/* Load More */}
            {filteredCourses.length > visibleCount && (
              <div className="col-span-full flex justify-center mt-4">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setVisibleCount(prev => prev + 6)}
                  className="px-8 py-3 btn-ghost rounded-xl font-semibold flex items-center gap-2 group"
                >
                  Load More <ChevronDown size={18} className="group-hover:translate-y-1 transition-transform" />
                </motion.button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursesPage;