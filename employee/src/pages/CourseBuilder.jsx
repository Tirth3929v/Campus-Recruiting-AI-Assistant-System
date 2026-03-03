import React, { useState } from 'react';
import {
    PlusCircle, Trash2, Send, Image as ImageIcon,
    BookOpen, ChevronDown, ChevronUp, Video, FileText,
    CheckCircle2, Loader2, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from './axiosInstance';

/* ─── Toast Helper ────────────────────────────────────────────────── */
const Toast = ({ type, message }) => {
    const styles = {
        success: 'bg-emerald-50 border-emerald-400 text-emerald-800',
        error: 'bg-red-50   border-red-400   text-red-800',
        loading: 'bg-indigo-50 border-indigo-400 text-indigo-800',
    };
    const icons = {
        success: <CheckCircle2 size={18} className="text-emerald-500" />,
        error: <AlertCircle size={18} className="text-red-500" />,
        loading: <Loader2 size={18} className="text-indigo-500 animate-spin" />,
    };
    return (
        <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-lg text-sm font-medium ${styles[type]}`}
        >
            {icons[type]}
            {message}
        </motion.div>
    );
};

/* ─── Main Component ──────────────────────────────────────────────── */
const CourseBuilder = () => {
    /* — State — */
    const [courseData, setCourseData] = useState({
        title: '',
        description: '',
        instructor: '',
        level: 'Beginner',
        category: 'Development',
        duration: '',
        thumbnail: '',
        createdBy: '',
    });
    const [chapters, setChapters] = useState([]);
    const [collapsedIds, setCollapsedIds] = useState(new Set());
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);
    const thumbnailInputRef = React.useRef(null);

    /* — Helpers — */
    const showToast = (type, message, ms = 3500) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), ms);
    };

    const handleCourseChange = (e) => {
        const { name, value } = e.target;
        setCourseData(prev => ({ ...prev, [name]: value }));
    };

    // Convert local image file → base64 and store in courseData.thumbnail
    const handleThumbnailFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            showToast('error', 'Please select a valid image file.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showToast('error', 'Image must be under 5 MB.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            setCourseData(prev => ({ ...prev, thumbnail: ev.target.result }));
        };
        reader.readAsDataURL(file);
    };

    const clearThumbnail = () => {
        setCourseData(prev => ({ ...prev, thumbnail: '' }));
        if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
    };

    /* — Chapter CRUD — */
    const addChapter = () => {
        const newId = `chap_${Date.now()}`;
        setChapters(prev => [
            ...prev,
            { chapterId: newId, title: '', content: '', videoUrl: '', order: prev.length + 1 }
        ]);
    };

    const removeChapter = (id) => {
        setChapters(prev => {
            const next = prev.filter(c => c.chapterId !== id);
            return next.map((c, i) => ({ ...c, order: i + 1 }));
        });
        setCollapsedIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    };

    const updateChapter = (id, field, value) => {
        setChapters(prev =>
            prev.map(c => c.chapterId === id ? { ...c, [field]: value } : c)
        );
    };

    const toggleCollapse = (id) => {
        setCollapsedIds(prev => {
            const s = new Set(prev);
            s.has(id) ? s.delete(id) : s.add(id);
            return s;
        });
    };

    /* — Submit — */
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!courseData.title.trim() || !courseData.instructor.trim() || !courseData.description.trim()) {
            showToast('error', 'Title, Instructor, and Description are required.');
            return;
        }
        if (chapters.length === 0) {
            showToast('error', 'Please add at least one chapter before submitting.');
            return;
        }
        for (const ch of chapters) {
            if (!ch.title.trim() || !ch.content.trim()) {
                showToast('error', `Chapter ${ch.order} is missing a title or content.`);
                return;
            }
        }

        setSubmitting(true);
        showToast('loading', 'Submitting course for approval…', 30000);

        const payload = { ...courseData, chapters };

        try {
            const res = await axiosInstance.post('/courses', payload);
            showToast('success', `"${res.data.course.title}" submitted for approval! 🎉`);
            // Reset form
            setCourseData({ title: '', description: '', instructor: '', level: 'Beginner', category: 'Development', duration: '', thumbnail: '', createdBy: '' });
            setChapters([]);
        } catch (err) {
            const msg = err.response?.data?.message || 'Submission failed. Please try again.';
            showToast('error', msg);
        } finally {
            setSubmitting(false);
        }
    };

    /* — Input class helper — */
    const inputCls = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-gray-400';
    const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5';

    /* ─── Render ─────────────────────────────────────────────────────── */
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/40 p-6 md:p-10 font-sans">

            {/* Toast */}
            <AnimatePresence>
                {toast && <Toast key="toast" type={toast.type} message={toast.message} />}
            </AnimatePresence>

            <div className="max-w-5xl mx-auto space-y-8">

                {/* ── Page Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full mb-3">
                            <BookOpen size={13} /> Employee Course Builder
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                            Design a New Course
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Fill in the basic info, build your chapters, then submit for admin approval.
                        </p>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-7 py-3 rounded-xl font-bold shadow-md shadow-indigo-200 transition-all hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap"
                    >
                        {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        Submit for Approval
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                    {/* ── LEFT: Basic Info ── */}
                    <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100/80 p-6 space-y-5 sticky top-6">
                        <h2 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
                            <FileText size={16} className="text-indigo-500" /> Basic Info
                        </h2>

                        <div>
                            <label className={labelCls}>Course Title *</label>
                            <input type="text" name="title" value={courseData.title} onChange={handleCourseChange}
                                placeholder="e.g. Master MERN Stack" className={inputCls} />
                        </div>

                        <div>
                            <label className={labelCls}>Instructor Name *</label>
                            <input type="text" name="instructor" value={courseData.instructor} onChange={handleCourseChange}
                                placeholder="e.g. Jane Doe" className={inputCls} />
                        </div>

                        <div>
                            <label className={labelCls}>Your Name / Email</label>
                            <input type="text" name="createdBy" value={courseData.createdBy} onChange={handleCourseChange}
                                placeholder="employee@company.com" className={inputCls} />
                        </div>

                        <div>
                            <label className={labelCls}>Description *</label>
                            <textarea name="description" rows="3" value={courseData.description} onChange={handleCourseChange}
                                placeholder="Briefly describe what students will learn…"
                                className={`${inputCls} resize-none`} />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelCls}>Level</label>
                                <select name="level" value={courseData.level} onChange={handleCourseChange}
                                    className={inputCls}>
                                    <option>Beginner</option>
                                    <option>Intermediate</option>
                                    <option>Advanced</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Category</label>
                                <select name="category" value={courseData.category} onChange={handleCourseChange}
                                    className={inputCls}>
                                    <option>Development</option>
                                    <option>Design</option>
                                    <option>Data Science</option>
                                    <option>Business</option>
                                    <option>Marketing</option>
                                    <option>Soft Skills</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className={labelCls}>Duration</label>
                            <input type="text" name="duration" placeholder="e.g. 5h 30m" value={courseData.duration}
                                onChange={handleCourseChange} className={inputCls} />
                        </div>

                        {/* ── Thumbnail Upload ── */}
                        <div>
                            <label className={labelCls}>Course Thumbnail</label>

                            {/* Hidden file input */}
                            <input
                                ref={thumbnailInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleThumbnailFile}
                            />

                            {courseData.thumbnail ? (
                                /* Preview with remove button */
                                <div className="relative group">
                                    <img
                                        src={courseData.thumbnail}
                                        alt="Thumbnail preview"
                                        className="w-full h-32 object-cover rounded-xl border border-gray-200"
                                    />
                                    <button
                                        type="button"
                                        onClick={clearThumbnail}
                                        className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ) : (
                                /* Upload zone */
                                <div
                                    onClick={() => thumbnailInputRef.current?.click()}
                                    className="flex flex-col items-center justify-center gap-2 w-full h-32 border-2 border-dashed border-indigo-200 rounded-xl cursor-pointer bg-indigo-50/40 hover:bg-indigo-50 hover:border-indigo-400 transition-all"
                                >
                                    <ImageIcon size={24} className="text-indigo-400" />
                                    <p className="text-xs text-indigo-500 font-medium">Click to upload from your PC</p>
                                    <p className="text-[10px] text-gray-400">PNG, JPG, WEBP · max 5 MB</p>
                                </div>
                            )}

                            {/* URL fallback */}
                            <div className="mt-2">
                                <input
                                    type="url"
                                    name="thumbnail"
                                    value={courseData.thumbnail.startsWith('data:') ? '' : courseData.thumbnail}
                                    onChange={handleCourseChange}
                                    placeholder="Or paste image URL…"
                                    className={`${inputCls} text-xs`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT: Chapter Builder ── */}
                    <div className="lg:col-span-2 space-y-5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                                <BookOpen size={20} className="text-indigo-500" />
                                Chapter Builder
                                {chapters.length > 0 && (
                                    <span className="text-sm font-semibold bg-indigo-100 text-indigo-600 px-2.5 py-0.5 rounded-full">
                                        {chapters.length}
                                    </span>
                                )}
                            </h2>
                            <button
                                onClick={addChapter}
                                className="flex items-center gap-1.5 text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 border border-indigo-200 hover:border-indigo-600 px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
                            >
                                <PlusCircle size={17} /> Add New Chapter
                            </button>
                        </div>

                        {/* Empty state */}
                        {chapters.length === 0 && (
                            <div className="text-center py-20 bg-white border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center gap-3 text-gray-400">
                                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center">
                                    <PlusCircle size={32} className="text-indigo-300" />
                                </div>
                                <p className="text-base font-semibold text-gray-500">No chapters yet</p>
                                <p className="text-sm max-w-xs">Click <strong className="text-indigo-600">Add New Chapter</strong> to start building your course curriculum.</p>
                            </div>
                        )}

                        <AnimatePresence>
                            {chapters.map((chapter) => {
                                const isCollapsed = collapsedIds.has(chapter.chapterId);
                                return (
                                    <motion.div
                                        key={chapter.chapterId}
                                        layout
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                                        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                                    >
                                        {/* Chapter header bar */}
                                        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/60">
                                            <span className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-extrabold shrink-0">
                                                {chapter.order}
                                            </span>
                                            <span className="flex-1 text-sm font-semibold text-gray-600 truncate">
                                                {chapter.title || <span className="italic text-gray-400">Untitled Chapter</span>}
                                            </span>
                                            <button
                                                onClick={() => toggleCollapse(chapter.chapterId)}
                                                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                                title={isCollapsed ? 'Expand' : 'Collapse'}
                                            >
                                                {isCollapsed ? <ChevronDown size={17} /> : <ChevronUp size={17} />}
                                            </button>
                                            <button
                                                onClick={() => removeChapter(chapter.chapterId)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Remove Chapter"
                                            >
                                                <Trash2 size={17} />
                                            </button>
                                        </div>

                                        {/* Chapter body */}
                                        <AnimatePresence initial={false}>
                                            {!isCollapsed && (
                                                <motion.div
                                                    key="body"
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="p-5 space-y-4">
                                                        <div>
                                                            <label className={labelCls}>Chapter Title *</label>
                                                            <input
                                                                type="text"
                                                                value={chapter.title}
                                                                onChange={e => updateChapter(chapter.chapterId, 'title', e.target.value)}
                                                                placeholder="e.g. Introduction to Context API"
                                                                className={`${inputCls} text-base font-semibold`}
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className={labelCls}>Content / Learning Material *</label>
                                                            <textarea
                                                                rows="6"
                                                                value={chapter.content}
                                                                onChange={e => updateChapter(chapter.chapterId, 'content', e.target.value)}
                                                                placeholder="Paste or type your chapter content here (supports plain text, Markdown, or HTML)…"
                                                                className={`${inputCls} resize-y font-mono text-sm leading-relaxed`}
                                                            />
                                                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                                                <FileText size={11} /> Supports plain text, Markdown, or HTML
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <label className={labelCls}>
                                                                <span className="flex items-center gap-1"><Video size={12} /> Video Resource URL (optional)</span>
                                                            </label>
                                                            <input
                                                                type="url"
                                                                value={chapter.videoUrl}
                                                                onChange={e => updateChapter(chapter.chapterId, 'videoUrl', e.target.value)}
                                                                placeholder="https://youtube.com/watch?v=…"
                                                                className={inputCls}
                                                            />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {/* Bottom submit shortcut */}
                        {chapters.length > 0 && (
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {submitting ? <Loader2 size={19} className="animate-spin" /> : <Send size={19} />}
                                Submit Course for Approval
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseBuilder;
