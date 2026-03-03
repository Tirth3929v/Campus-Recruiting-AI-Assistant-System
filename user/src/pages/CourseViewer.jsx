import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
    CheckCircle, ChevronRight, BookOpen, PlayCircle,
    Trophy, Clock, BarChart2, Loader2, AlertTriangle, Video
} from 'lucide-react';
import axiosInstance from './axiosInstance';

/* ─── Fallback mock (used when no courseId is available) ─────────── */
const MOCK_COURSE = {
    title: 'Advanced React Architecture',
    instructor: 'Jane Doe',
    level: 'Intermediate',
    chapters: [
        {
            chapterId: 'c1',
            title: 'Welcome to React Architecture',
            content: `In this chapter, we will explore **React Architecture** from the ground up.

Component structure is the backbone of every scalable React application. A well-designed component tree reduces re-renders, improves DX, and makes debugging far easier.

### Key Topics
- Atomic Design Principles
- Thinking in Components
- When to split vs. compose
- Presentational vs. Container components`,
            videoUrl: '',
            order: 1,
        },
        {
            chapterId: 'c2',
            title: 'Custom Hooks & Reusability',
            content: `Custom hooks are one of React's most powerful patterns. When you extract state logic from a component into a \`use...\` function, you make it reusable across your entire application without prop-drilling or context complexity.

### What you'll build
- \`useFetch\` — generic data fetching hook
- \`useLocalStorage\` — persistent state
- \`useDebounce\` — delay-driven search inputs

Custom hooks encourage **separation of concerns** and make unit testing your logic trivial.`,
            videoUrl: 'https://www.youtube.com/embed/TNhaISOUy6Q',
            order: 2,
        },
        {
            chapterId: 'c3',
            title: 'Performance Profiling & Optimization',
            content: `Performance issues in React often stem from unnecessary re-renders. In this chapter, we discover how to profile components with **React DevTools Profiler** and eliminate waste.

### Optimization signals to watch
- Commit duration spikes
- Wasted renders in pure components
- Long lists without virtualization

### Tools we'll use
- \`React.memo\` & \`useCallback\`
- \`useMemo\` for expensive computations
- \`react-window\` for list virtualization`,
            videoUrl: '',
            order: 3,
        },
    ],
};

/* ─── Markdown-lite renderer ─────────────────────────────────────── */
const renderContent = (raw) => {
    if (!raw) return null;
    return raw.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold text-white mt-6 mb-2">{line.slice(4)}</h3>;
        if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-white mt-7 mb-3">{line.slice(3)}</h2>;
        if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-extrabold text-white mt-8 mb-3">{line.slice(2)}</h1>;
        if (line.startsWith('- ')) return (
            <li key={i} className="flex items-start gap-2 text-gray-300 ml-4 mb-1">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                {formatInline(line.slice(2))}
            </li>
        );
        if (line.trim() === '') return <div key={i} className="h-3" />;
        return <p key={i} className="text-gray-300 leading-relaxed mb-1">{formatInline(line)}</p>;
    });
};

const formatInline = (text) => {
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('`') && part.endsWith('`'))
            return <code key={i} className="bg-white/10 text-purple-300 px-1.5 py-0.5 rounded text-sm font-mono">{part.slice(1, -1)}</code>;
        if (part.startsWith('**') && part.endsWith('**'))
            return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
        return part;
    });
};

/* ─── YouTube URL → embed converter ────────────────────────────── */
const toEmbedUrl = (url) => {
    if (!url) return '';
    // Already an embed URL
    if (url.includes('/embed/')) return url;
    try {
        const u = new URL(url);
        let videoId = '';

        // youtu.be/VIDEO_ID
        if (u.hostname === 'youtu.be') {
            videoId = u.pathname.slice(1);
        }
        // youtube.com/shorts/VIDEO_ID
        else if (u.pathname.startsWith('/shorts/')) {
            videoId = u.pathname.split('/shorts/')[1];
        }
        // youtube.com/watch?v=VIDEO_ID  OR  m.youtube.com/watch?v=VIDEO_ID
        else if (u.searchParams.has('v')) {
            videoId = u.searchParams.get('v');
        }

        return videoId
            ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`
            : url; // fallback: return original if we can't parse it
    } catch {
        return url;
    }
};

/* ─── Main Component ─────────────────────────────────────────────── */
const CourseViewer = () => {
    const { id: courseId } = useParams(); // Route uses :id → alias to courseId

    const [course, setCourse] = useState(null);
    const [activeChapter, setActiveChapter] = useState(null);
    const [completed, setCompleted] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /* — Fetch or fall back to mock — */
    const fetchCourse = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (courseId) {
                const { data } = await axiosInstance.get(`/courses/${courseId}`);
                const sorted = [...(data.chapters || [])].sort((a, b) => a.order - b.order);
                const populated = { ...data, chapters: sorted };
                setCourse(populated);
                setActiveChapter(sorted[0] ?? null);
            } else {
                setCourse(MOCK_COURSE);
                setActiveChapter(MOCK_COURSE.chapters[0]);
            }
        } catch (err) {
            console.error('Failed to fetch course:', err);
            // Fall back to mock on error so UI is always useful
            setCourse(MOCK_COURSE);
            setActiveChapter(MOCK_COURSE.chapters[0]);
            setError('Could not load course from server — showing demo content.');
        } finally {
            setLoading(false);
        }
    }, [courseId]);

    useEffect(() => { fetchCourse(); }, [fetchCourse]);

    /* — Mark complete & advance — */
    const handleMarkComplete = () => {
        if (!activeChapter) return;
        const nextCompleted = new Set(completed);
        nextCompleted.add(activeChapter.chapterId);
        setCompleted(nextCompleted);

        const idx = (course.chapters || []).findIndex(c => c.chapterId === activeChapter.chapterId);
        if (idx < course.chapters.length - 1) {
            setActiveChapter(course.chapters[idx + 1]);
        }
    };

    /* — Progress — */
    const totalChapters = course?.chapters?.length ?? 0;
    const completedCount = completed.size;
    const progressPercent = totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 0;
    const isCurrentComplete = activeChapter ? completed.has(activeChapter.chapterId) : false;
    const isLastChapter = course?.chapters && activeChapter
        ? activeChapter.chapterId === course.chapters[course.chapters.length - 1]?.chapterId
        : false;

    /* ─── Loading ─────────────────────────────────────────────────── */
    if (loading) return (
        <div className="flex h-screen bg-[#0B0F19] items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-gray-400">
                <Loader2 size={40} className="animate-spin text-purple-500" />
                <p className="text-sm font-medium">Loading course…</p>
            </div>
        </div>
    );

    /* ─── No chapter guard ────────────────────────────────────────── */
    if (!course || !activeChapter) return (
        <div className="flex h-screen bg-[#0B0F19] items-center justify-center text-gray-400">
            <p>No chapters found for this course.</p>
        </div>
    );

    /* ─── Render ─────────────────────────────────────────────────── */
    return (
        <div className="flex h-screen bg-[#0B0F19] text-gray-200 font-sans overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* ── LEFT SIDEBAR (w-1/4) ── */}
            <aside className="w-1/4 min-w-[220px] max-w-[300px] h-full border-r border-white/10 flex flex-col shrink-0 bg-[#0D1220]/90 backdrop-blur-md">

                {/* Course header */}
                <div className="p-5 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Course</span>
                        {course.level && (
                            <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                                {course.level}
                            </span>
                        )}
                    </div>
                    <h2 className="text-base font-bold text-white leading-snug line-clamp-3 mb-1">{course.title}</h2>
                    {course.instructor && <p className="text-xs text-gray-500">By {course.instructor}</p>}
                </div>

                {/* Progress bar */}
                <div className="px-5 py-3 border-b border-white/10 shrink-0">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                        <span className="flex items-center gap-1"><BarChart2 size={11} /> Progress</span>
                        <span className="font-bold text-purple-400">{progressPercent}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-purple-600 to-blue-500 transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{completedCount} / {totalChapters} chapters</p>
                </div>

                {/* Chapter list */}
                <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#2d3748 transparent' }}>
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-widest px-2 mb-3 flex items-center gap-1.5">
                        <BookOpen size={12} /> Chapters
                    </p>

                    {course.chapters.map((chapter, index) => {
                        const isActive = activeChapter.chapterId === chapter.chapterId;
                        const isDone = completed.has(chapter.chapterId);
                        return (
                            <button
                                key={chapter.chapterId}
                                onClick={() => setActiveChapter(chapter)}
                                className={`w-full text-left px-3 py-3 rounded-xl flex items-start gap-3 transition-all duration-200 group ${isActive
                                    ? 'bg-gradient-to-r from-purple-600/25 to-blue-500/15 border border-purple-500/30 shadow-[inset_0_1px_0_rgba(168,85,247,0.15)]'
                                    : 'hover:bg-white/5 border border-transparent'
                                    }`}
                            >
                                {/* Icon */}
                                <div className="shrink-0 mt-0.5">
                                    {isDone ? (
                                        <CheckCircle size={16} className="text-emerald-400" />
                                    ) : isActive ? (
                                        <PlayCircle size={16} className="text-purple-400" />
                                    ) : (
                                        <div className="w-4 h-4 rounded-full border-2 border-gray-600 group-hover:border-gray-400 transition-colors" />
                                    )}
                                </div>

                                {/* Label */}
                                <span className={`flex-1 text-xs font-medium leading-snug ${isActive ? 'text-purple-100' : isDone ? 'text-gray-400' : 'text-gray-400 group-hover:text-gray-200'
                                    }`}>
                                    <span className={`block text-[10px] mb-0.5 ${isActive ? 'text-purple-400' : 'text-gray-600'}`}>
                                        Chapter {index + 1}
                                    </span>
                                    {chapter.title}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Stats strip */}
                <div className="border-t border-white/10 p-4 grid grid-cols-2 gap-2 shrink-0">
                    <div className="bg-white/5 rounded-xl p-2.5 text-center">
                        <Clock size={14} className="text-gray-500 mx-auto mb-1" />
                        <p className="text-xs font-bold text-white">{course.duration || 'N/A'}</p>
                        <p className="text-[10px] text-gray-600">Duration</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-2.5 text-center">
                        <Trophy size={14} className="text-gray-500 mx-auto mb-1" />
                        <p className="text-xs font-bold text-white">{completedCount}/{totalChapters}</p>
                        <p className="text-[10px] text-gray-600">Completed</p>
                    </div>
                </div>
            </aside>

            {/* ── MAIN CONTENT (w-3/4) ── */}
            <main className="flex-1 h-full flex flex-col bg-gradient-to-b from-[#0B0F19] to-[#060810] relative overflow-hidden">

                {/* Error banner */}
                {error && (
                    <div className="shrink-0 flex items-center gap-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-400 text-xs px-6 py-2">
                        <AlertTriangle size={13} /> {error}
                    </div>
                )}

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-10 lg:px-16 pt-12 pb-36" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e2535 transparent' }}>
                    <div className="max-w-3xl mx-auto w-full">

                        {/* Chapter badge */}
                        <div className="flex items-center gap-2 mb-5">
                            <span className="text-xs font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 px-3 py-1 rounded-full">
                                Chapter {(course.chapters || []).findIndex(c => c.chapterId === activeChapter.chapterId) + 1} of {totalChapters}
                            </span>
                            {isCurrentComplete && (
                                <span className="text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1">
                                    <CheckCircle size={11} /> Completed
                                </span>
                            )}
                        </div>

                        {/* Chapter title */}
                        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-8 tracking-tight leading-tight">
                            {activeChapter.title}
                        </h1>

                        {/* Video embed (if provided) */}
                        {activeChapter.videoUrl && (
                            <div className="mb-8 rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
                                <div className="bg-black/40 px-4 py-2.5 border-b border-white/10 flex items-center gap-2">
                                    <Video size={14} className="text-purple-400" />
                                    <span className="text-xs font-semibold text-gray-400">Video Resource</span>
                                </div>
                                <iframe
                                    src={toEmbedUrl(activeChapter.videoUrl)}
                                    title={activeChapter.title}
                                    className="w-full aspect-video"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        )}

                        {/* Chapter content */}
                        <div className="prose-custom">
                            {renderContent(activeChapter.content)}
                        </div>

                        {/* All done banner */}
                        {progressPercent === 100 && (
                            <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex items-center gap-4">
                                <Trophy size={32} className="text-emerald-400 shrink-0" />
                                <div>
                                    <p className="font-bold text-emerald-300 text-lg">Course Complete! 🎉</p>
                                    <p className="text-sm text-gray-400">You've finished all {totalChapters} chapters of <strong className="text-white">{course.title}</strong>.</p>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* ── FLOATING BOTTOM ACTION ── */}
                <div className="absolute bottom-0 left-0 right-0 z-10">
                    {/* Gradient fade */}
                    <div className="h-16 bg-gradient-to-t from-[#060810] to-transparent pointer-events-none" />

                    <div className="bg-[#060810]/95 backdrop-blur-sm border-t border-white/5 px-10 py-5 flex items-center justify-center gap-4">
                        {isCurrentComplete && !isLastChapter ? (
                            <button
                                onClick={() => {
                                    const idx = course.chapters.findIndex(c => c.chapterId === activeChapter.chapterId);
                                    if (idx < course.chapters.length - 1) setActiveChapter(course.chapters[idx + 1]);
                                }}
                                className="px-10 py-3.5 rounded-2xl flex items-center gap-3 font-bold text-base bg-white/10 hover:bg-white/15 border border-white/10 text-white transition-all hover:-translate-y-0.5"
                            >
                                <ChevronRight size={20} /> Next Chapter
                            </button>
                        ) : (
                            <button
                                onClick={handleMarkComplete}
                                disabled={isCurrentComplete}
                                className={`px-10 py-3.5 rounded-2xl flex items-center gap-3 font-bold text-base transition-all shadow-lg ${isCurrentComplete
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white hover:-translate-y-1 hover:shadow-purple-500/30 border border-white/10 shadow-purple-500/20'
                                    }`}
                            >
                                {isCurrentComplete
                                    ? <><CheckCircle size={20} /> Chapter Completed</>
                                    : <><ChevronRight size={20} /> Mark as Complete &amp; Next Chapter</>
                                }
                            </button>
                        )}
                    </div>
                </div>

            </main>
        </div>
    );
};

export default CourseViewer;
