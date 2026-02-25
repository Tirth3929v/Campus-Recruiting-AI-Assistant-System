import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Users, Briefcase, Settings, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/users', label: 'Manage Users', icon: Users },
    { path: '/admin/jobs', label: 'Manage Jobs', icon: Briefcase },
    { path: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className={`flex h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'} font-sans overflow-hidden transition-colors duration-300`}>
      {/* Sidebar */}
      <aside className={`w-64 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-slate-800 border-slate-700'} border-r flex flex-col shadow-xl z-20`}>
        <div className={`h-20 flex items-center px-8 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-slate-700'}`}>
          <div className="flex items-center gap-2 text-emerald-400">
            <LayoutDashboard size={28} />
            <span className="text-xl font-bold tracking-tight text-white">Admin<span className="text-emerald-500">Panel</span></span>
          </div>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            
            return (
              <Link key={item.path} to={item.path} className="relative block">
                {isActive && (
                  <motion.div
                    layoutId="admin-active-pill"
                    className="absolute inset-0 bg-emerald-600 rounded-xl"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200 ${isActive ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-slate-700'}`}>
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-colors">
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header */}
        <header className={`h-20 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b flex items-center justify-between px-8 shadow-sm z-10 transition-colors duration-300`}>
          <h1 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            {navItems.find(i => i.path === location.pathname)?.label || 'Admin Dashboard'}
          </h1>
          
          <div className="flex items-center gap-4">
             <button 
                onClick={toggleTheme}
                className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-colors`}
             >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
             </button>
             <div className="text-right hidden sm:block">
                <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{user?.name || 'Admin User'}</p>
                <p className="text-xs text-gray-500">System Administrator</p>
             </div>
             <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-white">
               {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
             </div>
          </div>
        </header>

        {/* Page Content */}
        <main className={`flex-1 overflow-x-hidden overflow-y-auto ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'} p-8 flex flex-col transition-colors duration-300`}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1"
          >
            <Outlet />
          </motion.div>

          {/* Footer */}
          <footer className={`mt-8 pt-6 border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
            <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
              <p>&copy; {new Date().getFullYear()} CampusRecruit Admin. All rights reserved.</p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;