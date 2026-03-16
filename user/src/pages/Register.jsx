import React, { useState, useEffect } from 'react';
import { useNavigate, Link, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, BookOpen, ArrowRight, ShieldCheck, RefreshCw, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';

const Register = () => {
  const { user, login: authLogin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1); // 1: Details, 2: OTP
  const [formData, setFormData] = useState({ 
    name: location.state?.name || '', 
    email: location.state?.email || '', 
    password: '', 
    course: '', 
    termsAccepted: false 
  });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  if (authLoading) return null; // Fallback, though Layout handles it

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.termsAccepted) {
      setError('You must accept the Terms and Conditions');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axiosInstance.post('/auth/register', formData);
      setStep(2);
      setTimer(60); // 60 seconds resend cooldown
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await axiosInstance.post('/auth/verify-otp', { email: formData.email, otp });
      if (res.data.token) {
        localStorage.setItem('student_token', res.data.token);
        // Using context login if available, otherwise force redirect
        if (authLogin) await authLogin(res.data.token, res.data.user);
        window.location.href = '/student/dashboard';
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0) return;
    setResendLoading(true);
    setError('');

    try {
      await axiosInstance.post('/auth/resend-otp', { email: formData.email });
      setTimer(60);
      setOtp('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4 font-sans selection:bg-purple-500/30 overflow-hidden">
      {/* Background Orbs */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 mb-4">
                    <User className="text-purple-400" size={32} />
                  </div>
                  <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
                  <p className="text-gray-400">Join the elite recruitment network</p>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" size={18} />
                    <input 
                      type="text" required placeholder="Full Name"
                      className="w-full bg-gray-900/50 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all placeholder:text-gray-600"
                      value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" size={18} />
                    <input 
                      type="email" required placeholder="Email Address"
                      className="w-full bg-gray-900/50 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all placeholder:text-gray-600"
                      value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>

                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" size={18} />
                    <input 
                      type="password" required placeholder="Password"
                      className="w-full bg-gray-900/50 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all placeholder:text-gray-600"
                      value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                  </div>

                  <div className="relative group">
                    <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" size={18} />
                    <input 
                      type="text" required placeholder="Course / Department"
                      className="w-full bg-gray-900/50 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all placeholder:text-gray-600"
                      value={formData.course} onChange={(e) => setFormData({...formData, course: e.target.value})}
                    />
                  </div>

                  <div className="flex items-center gap-3 py-2">
                    <input 
                      type="checkbox" id="terms" required checked={formData.termsAccepted}
                      onChange={(e) => setFormData({...formData, termsAccepted: e.target.checked})}
                      className="w-5 h-5 rounded-lg border-white/10 bg-gray-900 text-purple-600 focus:ring-purple-500/50 transition-all cursor-pointer"
                    />
                    <label htmlFor="terms" className="text-sm text-gray-400 cursor-pointer select-none">
                      I accept the <span className="text-purple-400 hover:underline">Terms & Privacy Policy</span>
                    </label>
                  </div>

                  <button type="submit" disabled={loading} className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-2xl shadow-xl shadow-purple-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading ? <RefreshCw className="animate-spin" size={20} /> : <>Continue <ArrowRight size={18} /></>}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-4">
                    <ShieldCheck className="text-blue-400" size={32} />
                  </div>
                  <h1 className="text-3xl font-bold text-white mb-2">Verify Email</h1>
                  <p className="text-gray-400">We've sent a 6-digit code to <br/><span className="text-purple-400 font-medium">{formData.email}</span></p>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="flex justify-center">
                    <input 
                      type="text" maxLength="6" required placeholder="0 0 0 0 0 0"
                      className="w-full max-w-[280px] bg-gray-900/50 border border-white/5 rounded-2xl py-4 text-center text-3xl font-bold tracking-[0.5em] text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all placeholder:text-gray-800"
                      value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>

                  <button type="submit" disabled={loading} className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-2xl shadow-xl shadow-purple-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading ? <RefreshCw className="animate-spin" size={20} /> : 'Verify & Sign In'}
                  </button>

                  <div className="text-center space-y-4">
                    <button 
                      type="button" onClick={handleResendOtp} disabled={timer > 0 || resendLoading}
                      className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors disabled:text-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2 m-auto"
                    >
                      {resendLoading ? <RefreshCw className="animate-spin" size={14} /> : timer > 0 ? `Resend code in ${timer}s` : "Didn't receive code? Resend"}
                    </button>
                    
                    <button 
                      type="button" onClick={() => setStep(1)}
                      className="text-xs text-gray-500 hover:text-gray-400 transition-colors underline block w-full"
                    >
                      Use a different email address
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-8 text-center relative z-10">
          <p className="text-gray-500 text-sm">
            Already have an account? <Link to="/login" className="text-purple-400 hover:text-purple-300 font-bold transition-colors">Sign In</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
