import React from 'react';
import { useNavigate } from 'react-router-dom';
import coursesData from '../data/coursesData.js';

const CourseCard = ({ course, onClick }) => (
  <div 
    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer group"
    onClick={() => onClick(course.id)}
  >
    <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mb-4 flex items-center justify-center text-white font-semibold group-hover:scale-105 transition-transform">
      {course.title}
    </div>
    <h3 className="font-bold text-xl text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
      {course.title}
    </h3>
    <p className="text-sm text-gray-500 mb-3">{course.level} • {course.instructor}</p>
    <div className="flex items-center justify-between">
      <span className="text-2xl font-bold text-green-600">${course.price.replace('$', '')}</span>
      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
        Start Course
      </button>
    </div>
  </div>
);

const Courses = () => {
  const navigate = useNavigate();

  const handleOpenCourse = (courseId) => {
    navigate(`/student/courses/${courseId}`);
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Available Courses</h1>
        <p className="text-xl text-gray-600">Choose a course to get started with your learning journey</p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {coursesData.map((course) => (
          <CourseCard 
            key={course.id}
            course={course}
            onClick={handleOpenCourse}
          />
        ))}
      </div>
    </div>
  );
};

export default Courses;

