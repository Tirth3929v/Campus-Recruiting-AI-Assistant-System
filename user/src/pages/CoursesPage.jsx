import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Clock, 
  Trophy, 
  Search, 
  Filter, 
  PlayCircle, 
  CheckCircle,
  GraduationCap,
  Star
} from 'lucide-react';

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/courses');
      setCourses(res.data);
    } catch (err) {
      console.error('Courses fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEnrollments = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/courses/my-enrollments');
      setEnrolledCourses(res.data.map(e => e.course));
    } catch (err) {
      console.error('Enrollments fetch error:', err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchCourses();
      fetchEnrollments();
    }
  }, [user, fetchCourses, fetchEnrollments]);

  const handleEnroll = async (courseId) => {
    try {
      await axiosInstance.post(`/courses/${courseId}/enroll`);
      setEnrolledCourses(prev => [...prev, courseId]);
      // Show a nice toast or feedback
      alert('Enrolled successfully! Ready to start learning?');
    } catch (err) {
      console.error('Enroll error:', err.response?.data || err.message);
      alert('Enrollment failed. Please try again later.');
    }
  };

  const handleViewCourse = (courseId) => {
    navigate(`/student/courses/${courseId}`);
  };

  const categories = ['All', 'Development', 'Data Science', 'Design', 'Business'];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || course.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Loading academy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* ── Header Section ── */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-8 py-12 text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[100%] rounded-full bg-emerald-600/20 blur-[100px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[80%] rounded-full bg-blue-600/10 blur-[80px]" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-wider uppercase">
              <Star size={12} className="fill-current" />
              Empower Your Future
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              Master New Skills with <span className="text-emerald-400">Campus Academy</span>
            </h1>
            <p className="text-slate-400 text-lg">
              Explore professional-grade courses designed to help you land your dream job in tech.
            </p>
          </div>
          
          <div className="flex items-center gap-6 px-8 py-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{courses.length}</p>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mt-1">Courses</p>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="text-center">
              <p className="text-3xl font-bold text-emerald-400">20k+</p>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mt-1">Students</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters & Search ── */}
      <div className="flex flex-col lg:flex-row gap-6 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all border-2 ${
                activeCategory === cat
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-600/30 scale-105'
                  : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search courses, instructors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
          />
        </div>
      </div>

      {/* ── Courses Grid ── */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredCourses.map((course, idx) => {
            const isEnrolled = enrolledCourses.includes(course._id);
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={course._id}
                className="group flex flex-col bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 hover:border-emerald-500/50 hover:shadow-[0_20px_50px_rgba(16,185,129,0.12)] overflow-hidden transition-all duration-500"
              >
                {/* Thumbnail */}
                <div className="relative h-52 overflow-hidden">
                  <img 
                    src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60'} 
                    alt={course.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="px-3 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider rounded-lg text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
                      {course.level}
                    </span>
                  </div>
                  {isEnrolled && (
                    <div className="absolute top-4 right-4 h-8 w-8 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg animate-in zoom-in-50 duration-300">
                      <CheckCircle size={18} />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-6 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                    <GraduationCap size={14} className="text-emerald-500" />
                    {course.category}
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors line-clamp-1 tracking-tight">
                      {course.title}
                    </h3>
                    <p className="text-base text-slate-700 dark:text-slate-300 line-clamp-2 mt-2 leading-relaxed font-medium">
                      {course.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <Clock size={16} className="text-emerald-500" />
                      {course.duration || 'Self-paced'}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Trophy size={16} className="text-amber-500" />
                      Certificate
                    </div>
                  </div>
                </div>

                {/* Footer / CTA */}
                <div className="px-6 pb-6 pt-2">
                  {isEnrolled ? (
                    <button
                      onClick={() => handleViewCourse(course._id)}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm hover:bg-emerald-600 hover:text-white transition-all duration-300 group/btn"
                    >
                      <PlayCircle size={18} className="group-hover/btn:scale-110 transition-transform" />
                      Continue Learning
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEnroll(course._id)}
                      className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-500 shadow-xl shadow-emerald-600/20 active:scale-[0.97] transition-all"
                    >
                      Join Course
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center">
          <div className="h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 text-slate-400">
            <BookOpen size={40} />
          </div>
          <h3 className="text-xl font-bold">No courses found</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto">
            Try adjusting your search or category filter to find what you're looking for.
          </p>
          <button 
            onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
            className="mt-6 text-emerald-600 font-bold hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
};

export default CoursesPage;

