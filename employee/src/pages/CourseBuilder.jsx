import React, { useState } from 'react';
import {
    PlusCircle, Trash2, Send, Image as ImageIcon,
    BookOpen, ChevronDown, ChevronUp, Video, FileText,
    CheckCircle2, Loader2, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from './axiosInstance';

const Toast = ({ type, message }) => {
    const styles = {
        success: 'bg-emerald-600',
        error: 'bg-red-600',
        loading: 'bg-blue-600',
    };
    const icons = {
        success: <CheckCircle2 size={17} />,
        error: <AlertCircle size={17} />,
        loading: <Loader2 size={17} className="animate-spin" />,
    };
    return (
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-white text-sm font-semibold ${styles[type]}`}>
            {icons[type]} {message}
        </motion.div>
    );
};

const fieldBase = 'w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all';
const fieldStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' };
const labelCls = 'block text-xs font-bold text-white/30 uppercase tracking-widest mb-1.5';

const CourseBuilder = () => {
    const [courseData, setCourseData] = useState({
        title: '', description: '', instructor: '', level: 'Beginner',
        category: 'Development', duration: '', thumbnail: '', createdBy: '',
    });
    const [chapters, setChapters] = useState([]);
    const [collapsedIds, setCollapsedIds] = useState(new Set());
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);
    const thumbnailInputRef = React.useRef(null);

    const showToast = (type, message, ms = 3500) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), ms);
    };

    const handleCourseChange = (e) => {
        const { name, value } = e.target;
        setCourseData(prev => ({ ...prev, [name]: value }));
    };

    const handleThumbnailFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { showToast('error', 'Please select an image file.'); return; }
        if (file.size > 5 * 1024 * 1024) { showToast('error', 'Image must be under 5 MB.'); return; }
        const reader = new FileReader();
        reader.onload = (ev) => setCourseData(prev => ({ ...prev, thumbnail: ev.target.result }));
        reader.readAsDataURL(file);
    };

    const clearThumbnail = () => {
        setCourseData(prev => ({ ...prev, thumbnail: '' }));
        if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
    };

    const addChapter = () => {
        const newId = `chap_${Date.now()}`;
        setChapters(prev => [...prev, { chapterId: newId, title: '', content: '', videoUrl: '', order: prev.length + 1 }]);
    };

    const removeChapter = (id) => {
        setChapters(prev => prev.filter(c => c.chapterId !== id).map((c, i) => ({ ...c, order: i + 1 })));
        setCollapsedIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    };

    const updateChapter = (id, field, value) =>
        setChapters(prev => prev.map(c => c.chapterId === id ? { ...c, [field]: value } : c));

    const toggleCollapse = (id) => {
        setCollapsedIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
    };

    const handleSubmit = async (e) => {
        if (e?.preventDefault) e.preventDefault();
        if (!courseData.title.trim() || !courseData.instructor.trim() || !courseData.description.trim()) {
            showToast('error', 'Title, Instructor, and Description are required.'); return;
        }
        if (chapters.length === 0) { showToast('error', 'Add at least one chapter.'); return; }
        for (const ch of chapters) {
            if (!ch.title.trim() || !ch.content.trim()) {
                showToast('error', `Chapter ${ch.order} needs a title and content.`); return;
            }
        }
        setSubmitting(true);
        showToast('loading', 'Submitting course…', 30000);
        try {
            const res = await axiosInstance.post('/courses', { ...courseData, chapters });
            showToast('success', `"${res.data.course.title}" submitted! 🎉`);
            setCourseData({ title: '', description: '', instructor: '', level: 'Beginner', category: 'Development', duration: '', thumbnail: '', createdBy: '' });
            setChapters([]);
        } catch (err) {
            showToast('error', err.response?.data?.message || 'Submission failed.');
        } finally { setSubmitting(false); }
    };

    return (
        <div className="max-w-5xl space-y-6">
            <AnimatePresence>
                {toast && <Toast key="toast" type={toast.type} message={toast.message} />}
            </AnimatePresence>

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <div className="inline-flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold px-3 py-1 rounded-full mb-3">
                        <BookOpen size={12} /> Course Builder
                    </div>
                    <h2 className="text-2xl font-bold text-white">Design a New Course</h2>
                    <p className="text-sm text-white/30 mt-1">Fill in the info, build chapters, then submit for admin approval.</p>
                </div>
                <motion.button onClick={handleSubmit} disabled={submitting} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 text-white px-6 py-3 rounded-xl font-bold disabled:opacity-60 flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 8px 24px rgba(139,92,246,0.25)' }}>
                    {submitting ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                    Submit for Approval
                </motion.button>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Basic Info Panel */}
                <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                    className="lg:col-span-1 glass-card rounded-2xl p-6 space-y-5 sticky top-6">
                    <h3 className="text-sm font-bold text-white border-b border-white/8 pb-3 flex items-center gap-2">
                        <FileText size={15} className="text-purple-400" /> Basic Info
                    </h3>

                    {[
                        { label: 'Course Title *', name: 'title', type: 'text', placeholder: 'e.g. Master MERN Stack' },
                        { label: 'Instructor Name *', name: 'instructor', type: 'text', placeholder: 'e.g. Jane Doe' },
                        { label: 'Your Name / Email', name: 'createdBy', type: 'text', placeholder: 'employee@company.com' },
                    ].map(({ label, name, type, placeholder }) => (
                        <div key={name}>
                            <label className={labelCls}>{label}</label>
                            <input type={type} name={name} value={courseData[name]}
                                onChange={handleCourseChange} placeholder={placeholder}
                                className={fieldBase} style={fieldStyle} />
                        </div>
                    ))}

                    <div>
                        <label className={labelCls}>Description *</label>
                        <textarea name="description" rows={3} value={courseData.description}
                            onChange={handleCourseChange} placeholder="Briefly describe what students will learn…"
                            className={`${fieldBase} resize-none`} style={fieldStyle} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'Level', name: 'level', options: ['Beginner', 'Intermediate', 'Advanced'] },
                            { label: 'Category', name: 'category', options: ['Development', 'Design', 'Data Science', 'Business', 'Marketing', 'Soft Skills'] },
                        ].map(({ label, name, options }) => (
                            <div key={name}>
                                <label className={labelCls}>{label}</label>
                                <select name={name} value={courseData[name]} onChange={handleCourseChange}
                                    className={fieldBase} style={{ ...fieldStyle, color: 'white' }}>
                                    {options.map(o => <option key={o} value={o} style={{ background: '#111827' }}>{o}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>

                    <div>
                        <label className={labelCls}>Duration</label>
                        <input type="text" name="duration" value={courseData.duration}
                            onChange={handleCourseChange} placeholder="e.g. 5h 30m"
                            className={fieldBase} style={fieldStyle} />
                    </div>

                    {/* Thumbnail */}
                    <div>
                        <label className={labelCls}>Course Thumbnail</label>
                        <input ref={thumbnailInputRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnailFile} />
                        {courseData.thumbnail ? (
                            <div className="relative group">
                                <img src={courseData.thumbnail} alt="Thumbnail" className="w-full h-28 object-cover rounded-xl border border-white/10" />
                                <button type="button" onClick={clearThumbnail}
                                    className="absolute top-2 right-2 bg-red-600/80 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <div onClick={() => thumbnailInputRef.current?.click()}
                                className="flex flex-col items-center justify-center gap-2 w-full h-28 rounded-xl cursor-pointer transition-all"
                                style={{ border: '2px dashed rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.05)' }}
                                onMouseOver={e => e.currentTarget.style.background = 'rgba(139,92,246,0.1)'}
                                onMouseOut={e => e.currentTarget.style.background = 'rgba(139,92,246,0.05)'}>
                                <ImageIcon size={22} className="text-purple-400" />
                                <p className="text-xs text-purple-400 font-medium">Click to upload</p>
                                <p className="text-[10px] text-white/20">PNG, JPG, WEBP · max 5 MB</p>
                            </div>
                        )}
                        <div className="mt-2">
                            <input type="url" name="thumbnail"
                                value={courseData.thumbnail.startsWith('data:') ? '' : courseData.thumbnail}
                                onChange={handleCourseChange} placeholder="Or paste image URL…"
                                className={`${fieldBase} text-xs`} style={fieldStyle} />
                        </div>
                    </div>
                </motion.div>

                {/* Chapter Builder */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <BookOpen size={18} className="text-purple-400" /> Chapter Builder
                            {chapters.length > 0 && (
                                <span className="text-sm font-bold bg-purple-500/15 text-purple-400 border border-purple-500/20 px-2.5 py-0.5 rounded-full">
                                    {chapters.length}
                                </span>
                            )}
                        </h3>
                        <motion.button onClick={addChapter} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-purple-400 border border-purple-500/20 hover:bg-purple-500/10 transition-all">
                            <PlusCircle size={16} /> Add Chapter
                        </motion.button>
                    </div>

                    {chapters.length === 0 && (
                        <div className="text-center py-20 flex flex-col items-center gap-3"
                            style={{ border: '2px dashed rgba(255,255,255,0.08)', borderRadius: '1rem', background: 'rgba(255,255,255,0.02)' }}>
                            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/15 flex items-center justify-center">
                                <PlusCircle size={30} className="text-purple-400 opacity-50" />
                            </div>
                            <p className="text-white/30 font-semibold">No chapters yet</p>
                            <p className="text-sm text-white/15 max-w-xs">Click <span className="text-purple-400">Add Chapter</span> to start building your curriculum.</p>
                        </div>
                    )}

                    <AnimatePresence>
                        {chapters.map((chapter) => {
                            const isCollapsed = collapsedIds.has(chapter.chapterId);
                            return (
                                <motion.div key={chapter.chapterId} layout
                                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                                    className="glass-card rounded-2xl overflow-hidden">
                                    {/* Chapter header */}
                                    <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
                                        <span className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm">
                                            {chapter.order}
                                        </span>
                                        <span className="flex-1 text-sm font-semibold text-white/70 truncate">
                                            {chapter.title || <span className="italic text-white/25">Untitled Chapter</span>}
                                        </span>
                                        <button onClick={() => toggleCollapse(chapter.chapterId)}
                                            className="p-1.5 text-white/25 hover:text-white/70 hover:bg-white/5 rounded-lg transition-colors">
                                            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                                        </button>
                                        <button onClick={() => removeChapter(chapter.chapterId)}
                                            className="p-1.5 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <AnimatePresence initial={false}>
                                        {!isCollapsed && (
                                            <motion.div key="body" initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25, ease: 'easeInOut' }} className="overflow-hidden">
                                                <div className="p-5 space-y-4">
                                                    <div>
                                                        <label className={labelCls}>Chapter Title *</label>
                                                        <input type="text" value={chapter.title}
                                                            onChange={e => updateChapter(chapter.chapterId, 'title', e.target.value)}
                                                            placeholder="e.g. Introduction to Context API"
                                                            className={`${fieldBase} font-semibold`} style={fieldStyle} />
                                                    </div>
                                                    <div>
                                                        <label className={labelCls}>Content / Learning Material *</label>
                                                        <textarea rows={6} value={chapter.content}
                                                            onChange={e => updateChapter(chapter.chapterId, 'content', e.target.value)}
                                                            placeholder="Paste or type your chapter content here…"
                                                            className={`${fieldBase} resize-y font-mono text-sm leading-relaxed`} style={fieldStyle} />
                                                        <p className="text-xs text-white/20 mt-1 flex items-center gap-1">
                                                            <FileText size={10} /> Supports plain text, Markdown, or HTML
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <label className={labelCls}><span className="flex items-center gap-1"><Video size={11} /> Video URL (optional)</span></label>
                                                        <input type="url" value={chapter.videoUrl}
                                                            onChange={e => updateChapter(chapter.chapterId, 'videoUrl', e.target.value)}
                                                            placeholder="https://youtube.com/watch?v=…"
                                                            className={fieldBase} style={fieldStyle} />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {chapters.length > 0 && (
                        <motion.button onClick={handleSubmit} disabled={submitting}
                            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                            className="w-full py-4 text-white font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 8px 24px rgba(139,92,246,0.2)' }}>
                            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            Submit Course for Approval
                        </motion.button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CourseBuilder;
