import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, MoreVertical, Search, Filter, ChevronDown, CreditCard } from 'lucide-react';

const CoursesPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/courses');
        if (!response.ok) {
          throw new Error('Failed to fetch courses');
        }
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

  // Filter Logic
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevel === 'All' || course.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(6);
  }, [searchQuery, selectedLevel]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F19] text-gray-900 dark:text-white p-8 font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 mb-2">
              My Courses
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Continue where you left off
            </p>
          </div>
          <button 
            onClick={() => navigate('/payment')}
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-[#1A1F2E] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm"
          >
            <CreditCard size={18} className="text-purple-500" />
            Buy Premium
          </button>
        </div>

        {/* Search and Filter Section */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search Bar */}
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search for courses..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-[#1A1F2E] border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-gray-900 dark:text-white placeholder-gray-400 transition-all shadow-sm"
            />
          </div>

          {/* Level Filter */}
          <div className="min-w-[200px] relative">
            <select 
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-4 py-3.5 bg-white dark:bg-[#1A1F2E] border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-gray-900 dark:text-white cursor-pointer transition-all shadow-sm appearance-none"
            >
              <option value="All">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
            <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          </div>
        </div>

        {/* Course Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 dark:text-red-400 py-8">{error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {filteredCourses.length > 0 ? (
              filteredCourses.slice(0, visibleCount).map((course, index) => (
            <div 
              key={course.id || index}
              className="group bg-white dark:bg-[#1A1F2E] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300"
            >
              {/* Card Image Area */}
              <div className="h-48 relative overflow-hidden">
                <img 
                  src={course.image} 
                  alt={course.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1F2E] via-transparent to-transparent opacity-80"></div>
                
                <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-md p-2 rounded-lg text-white cursor-pointer hover:bg-black/50 transition-colors">
                  <MoreVertical size={18} />
                </div>
                
                <div className="absolute bottom-4 left-4">
                  <span className="px-3 py-1 text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full backdrop-blur-md">
                    {course.level}
                  </span>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white group-hover:text-purple-400 transition-colors line-clamp-1">
                  {course.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 flex items-center gap-1">
                  Taught by <span className="font-medium text-gray-700 dark:text-gray-300">{course.instructor}</span>
                </p>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-xs mb-2 font-medium">
                    <span className="text-gray-600 dark:text-gray-300">{course.progress}% Complete</span>
                    <span className="text-gray-400 dark:text-gray-500">{course.completedLessons}/{course.totalLessons} Lessons</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-purple-600 to-blue-600 h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Action Button */}
                <button className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:opacity-90 transition-all flex items-center justify-center gap-2 group/btn">
                  <Play size={18} className="fill-current" />
                  Continue Learning
                </button>
              </div>
            </div>
          ))
            ) : (
              <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-12">
                No courses found matching your filters.
              </div>
            )}

            {/* Load More Button */}
            {filteredCourses.length > visibleCount && (
              <div className="col-span-full flex justify-center mt-8">
                <button
                  onClick={() => setVisibleCount(prev => prev + 6)}
                  className="px-8 py-3 bg-white dark:bg-[#1A1F2E] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm flex items-center gap-2 group"
                >
                  Load More <ChevronDown size={18} className="group-hover:translate-y-1 transition-transform" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursesPage;