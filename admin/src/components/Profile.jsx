import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Award, Calendar, MapPin, Camera, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePicture', file);

    setUploading(true);
    try {
      const res = await axiosInstance.put('/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.profilePicture) {
        setUser({ ...user, profilePicture: res.data.profilePicture });
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  // Mock Certificates
  const certificates = [
    { id: 1, title: "PHP Mastery", date: "Oct 12, 2023", id_code: "CERT-1234" },
    { id: 2, title: "React Fundamentals", date: "Nov 05, 2023", id_code: "CERT-5678" }
  ];

  return (
    <div className="min-h-screen bg-[#080C16] text-white p-6 md:p-12 font-sans relative">
      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-8 backdrop-blur-xl"
        >
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-4xl font-bold shadow-2xl shadow-blue-500/20 overflow-hidden border-4 border-white/10">
                {user?.profilePicture ? (
                  <img src={`http://localhost:5001/${user.profilePicture}`} alt="" className="w-full h-full object-cover" />
                ) : (
                  (user?.name?.[0] || 'U').toUpperCase()
                )}
                
                {uploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="animate-spin text-white" size={24} />
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full text-white shadow-lg hover:bg-blue-500 transition-colors border-2 border-[#080C16] group-hover:scale-110 duration-200"
              >
                <Camera size={16} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handlePhotoUpload} 
                className="hidden" 
                accept="image/*" 
              />
            </div>
            
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl font-bold mb-2">{user?.name || 'Administrator'}</h1>
              <p className="text-white/40 mb-4">{user?.email || 'admin@example.com'}</p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <div className="flex items-center gap-2 text-sm text-white/60 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                  <MapPin size={14} className="text-blue-400" /> San Francisco, CA
                </div>
                <div className="flex items-center gap-2 text-sm text-white/60 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                  <Calendar size={14} className="text-purple-400" /> Joined Sept 2023
                </div>
              </div>
            </div>
            
            <button className="px-6 py-2.5 border border-white/10 bg-white/5 text-white/80 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium">
              Edit Details
            </button>
          </div>
        </motion.div>

        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Award className="text-yellow-500" /> My Certificates
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert) => (
            <motion.div 
              key={cert.id}
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 p-6 rounded-2xl relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Award size={100} />
              </div>
              
              <h3 className="text-xl font-bold mb-2">{cert.title}</h3>
              <p className="text-gray-400 text-sm mb-4">Completed on {cert.date}</p>
              
              <div className="flex justify-between items-end">
                <span className="text-xs font-mono text-gray-500">{cert.id_code}</span>
                <button className="text-sm text-purple-400 hover:text-purple-300 font-medium">
                  Download PDF
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;
