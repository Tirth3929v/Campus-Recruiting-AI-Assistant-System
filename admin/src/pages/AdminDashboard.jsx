import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Briefcase, FileText, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const StatCard = ({ title, count, icon: Icon, color }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"
  >
    <div className={`p-4 rounded-xl ${color} bg-opacity-10`}>
      <Icon size={24} className={color.replace('bg-', 'text-')} />
    </div>
    <div>
      <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wide">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 mt-1">{count}</p>
    </div>
  </motion.div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', {
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        setError('Failed to load stats');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 flex items-center gap-2">
        <AlertCircle size={20} />
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-500">Welcome back, Admin. Here is what's happening today.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" count={stats?.totalUsers || 0} icon={Users} color="bg-blue-600" />
        <StatCard title="Interviews" count={stats?.totalInterviews || 0} icon={Briefcase} color="bg-emerald-600" />
        <StatCard title="Posts" count={stats?.totalPosts || 0} icon={FileText} color="bg-purple-600" />
        <StatCard title="Tickets" count={stats?.totalTickets || 0} icon={TrendingUp} color="bg-orange-500" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">Recent Users</h3>
          <ul className="space-y-4">
            {stats?.recentUsers?.length > 0 ? (
              stats.recentUsers.map((user, i) => (
                <li key={i} className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                      {user.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{user.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <CheckCircle size={16} className="text-green-500" />
                </li>
              ))
            ) : (
              <li className="text-gray-500 text-sm">No recent users</li>
            )}
          </ul>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">Recent Interviews</h3>
          <ul className="space-y-4">
            {stats?.recentInterviews?.length > 0 ? (
              stats.recentInterviews.map((interview, i) => (
                <li key={i} className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-600">
                      <Clock size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{interview.userName || 'Unknown User'}</p>
                      <p className="text-xs text-gray-500">{interview.subject || 'Interview'} - Score: {interview.score || 'N/A'}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${interview.status === 'Completed' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                    {interview.status || 'Pending'}
                  </span>
                </li>
              ))
            ) : (
              <li className="text-gray-500 text-sm">No recent interviews</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
