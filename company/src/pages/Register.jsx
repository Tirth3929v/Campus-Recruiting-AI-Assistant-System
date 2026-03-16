import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Mail, Lock, MapPin, Users2, Globe, 
  FileText, ArrowRight, ArrowLeft, CheckCircle2,
  Sparkles, ShieldCheck, Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    location: '',
    employeeCount: '',
    ownerEmail: '',
    hrEmail: '',
    industry: '',
    website: '',
    description: '',
    termsAccepted: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  if (authLoading) return null;
  if (user) return <Navigate to="/company/dashboard" replace />;

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.termsAccepted) {
      setError('You must accept the Terms and Conditions');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long for better security');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid business email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/company/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      const data = await res.json();

      if (res.ok) {
        setIsRegistered(true);
        setStep(4); // Special success step
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all placeholder:text-gray-500";
  const labelClasses = "text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block ml-1";

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="text-center mb-6">
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold tracking-widest uppercase">Step 1: Account Access</span>
              <h2 className="text-2xl font-bold text-white mt-2">Basic Credentials</h2>
            </div>

            <div>
              <label className={labelClasses}>Company Legal Name</label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="text" required placeholder="Google Inc." className={inputClasses}
                  value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className={labelClasses}>Primary Business Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="email" required placeholder="contact@company.com" className={inputClasses}
                  value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              {formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                <p className="text-[10px] text-red-400 mt-1 ml-1 font-medium">Please enter a valid email format</p>
              )}
            </div>

            <div>
              <label className={labelClasses}>Strong Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="password" required placeholder="••••••••" className={inputClasses}
                  value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div className="mt-2 ml-1 flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                    formData.password.length >= i * 2 ? 'bg-amber-500' : 'bg-gray-800'
                  }`} />
                ))}
              </div>
              <p className="text-[10px] text-gray-500 mt-1 ml-1 font-medium">Min. 8 characters with letters & numbers</p>
            </div>

            <button type="button" onClick={handleNext} className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-amber-500/10 transition-all flex items-center justify-center gap-2 mt-4">
              Continue <ArrowRight size={18} />
            </button>
          </motion.div>
        );
      case 2:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="text-center mb-6">
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold tracking-widest uppercase">Step 2: Key Personnel</span>
              <h2 className="text-2xl font-bold text-white mt-2">Contact Details</h2>
            </div>

            <div>
              <label className={labelClasses}>Owner / CEO Email</label>
              <div className="relative">
                <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="email" required placeholder="owner@company.com" className={inputClasses}
                  value={formData.ownerEmail} onChange={(e) => setFormData({...formData, ownerEmail: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className={labelClasses}>HR Manager Email</label>
              <div className="relative">
                <Users2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="email" required placeholder="hr@company.com" className={inputClasses}
                  value={formData.hrEmail} onChange={(e) => setFormData({...formData, hrEmail: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className={labelClasses}>Headquarters Location</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="text" required placeholder="New York, USA" className={inputClasses}
                  value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-4">
              <button type="button" onClick={handleBack} className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2">
                <ArrowLeft size={18} /> Back
              </button>
              <button type="button" onClick={handleNext} className="flex-[2] py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                Continue <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="text-center mb-6">
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold tracking-widest uppercase">Step 3: Business Details</span>
              <h2 className="text-2xl font-bold text-white mt-2">Company Insights</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Company Size</label>
                <select 
                  className={inputClasses + " appearance-none"}
                  value={formData.employeeCount} onChange={(e) => setFormData({...formData, employeeCount: e.target.value})}
                >
                  <option value="" className="bg-gray-900">Select Range</option>
                  <option value="1-10" className="bg-gray-900">1-10 Members</option>
                  <option value="11-50" className="bg-gray-900">11-50 Members</option>
                  <option value="51-200" className="bg-gray-900">51-200 Members</option>
                  <option value="201-500" className="bg-gray-900">201-500 Members</option>
                  <option value="500+" className="bg-gray-900">500+ Members</option>
                </select>
              </div>
              <div>
                <label className={labelClasses}>Industry</label>
                <input 
                  type="text" placeholder="e.g. Technology" className={inputClasses}
                  value={formData.industry} onChange={(e) => setFormData({...formData, industry: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className={labelClasses}>Company Website</label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="url" placeholder="https://google.com" className={inputClasses}
                  value={formData.website} onChange={(e) => setFormData({...formData, website: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className={labelClasses}>Company Bio (Short)</label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-3 text-gray-500" size={18} />
                <textarea 
                  rows="3" placeholder="Briefly describe what your company does..." 
                  className={inputClasses + " pl-11 resize-none"}
                  value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 p-1">
              <input 
                type="checkbox" id="terms"
                className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-amber-600 focus:ring-amber-500 cursor-pointer"
                checked={formData.termsAccepted}
                onChange={(e) => setFormData({...formData, termsAccepted: e.target.checked})}
              />
              <label htmlFor="terms" className="text-[10px] sm:text-xs text-gray-400 cursor-pointer select-none">
                I agree to the <span className="text-amber-400 hover:underline">Terms of Service</span> and <span className="text-amber-400 hover:underline">Recruiter Privacy Policy</span>
              </label>
            </div>

            <div className="flex gap-4 mt-4">
              <button type="button" onClick={handleBack} className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2">
                <ArrowLeft size={18} /> Back
              </button>
              <button type="submit" disabled={loading} className="flex-[2] py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? 'Creating Profile...' : <>Complete Registration <CheckCircle2 size={18} /></>}
              </button>
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8 space-y-6"
          >
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
              <CheckCircle2 size={40} className="text-emerald-500" />
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Registration Received!</h2>
            <p className="text-gray-400 max-w-sm mx-auto leading-relaxed">
              Welcome to the platform. Your company profile <span className="text-white font-bold">"{formData.name}"</span> is now being reviewed by our verification team.
            </p>
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl text-amber-500 text-sm flex items-start gap-3 text-left">
              <Clock size={20} className="flex-shrink-0 mt-0.5" />
              <span>We usually verify companies within 24 hours. You'll be able to log in once your status is updated to <strong>Approved</strong>.</span>
            </div>
            <Link to="/login" className="inline-flex items-center gap-2 text-white bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl font-bold transition-all border border-white/10">
              Go to Login Panel <ArrowRight size={18} />
            </Link>
          </motion.div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#080B14] flex font-sans selection:bg-amber-500/30 overflow-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-orange-600/5 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-xl"
        >
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Sparkles size={24} className="text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-white flex items-center gap-2 leading-none uppercase tracking-tighter">
                Campus<span className="text-amber-500">Hire</span>
              </h1>
              <p className="text-[10px] text-gray-500 font-bold tracking-[0.2em] uppercase">Enterprise Portal</p>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-8 sm:p-10 border border-white/5 bg-white/5 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
            {/* Progress Bar Container */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/5">
              <motion.div 
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                initial={{ width: "33.33%" }}
                animate={{ width: `${(step / 3) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>

            {error && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                {renderStep()}
              </AnimatePresence>
            </form>

            <div className="mt-8 text-center pt-6 border-t border-white/5">
              <p className="text-gray-500 text-sm">
                Already registered? <Link to="/login" className="text-amber-500 hover:text-amber-400 font-bold transition-colors">Sign in to Dashboard</Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
