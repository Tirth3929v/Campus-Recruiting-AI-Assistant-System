import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    CheckCircle, ChevronLeft, ChevronRight,
    BookOpen, PlayCircle, Trophy, Clock,
    BarChart2, Loader2, AlertTriangle, Video, Home, User
} from 'lucide-react';
import { motion } from 'framer-motion';
import axiosInstance from '../api/axiosInstance';
import TryItYourself from '../components/TryItYourself';
import CodeCompiler from '../components/CodeCompiler';
import DOMPurify from 'dompurify';

/* ─── Fallback mock data ──────────────────────────────────────────── */
const MOCK_COURSE = {
    title: 'Python Tutorial',
    instructor: 'CampusRecruit',
    level: 'Beginner',
    chapters: [
        {
            chapterId: 'c1',
            title: 'Python HOME',
            content: `Python is a popular programming language.
Python can be used on a server to create web applications.

## Learning by Examples

With our "Try it Yourself" editor, you can edit Python code and view the result.

\`\`\`python
print("Hello, World!")
\`\`\`

Click on the "Try it Yourself" button to see how it works.

## What is Python?

Python is a popular programming language. It was created by Guido van Rossum, and released in 1991.

It is used for:
- Web development (server-side)
- Software development
- Mathematics and scripting
- Data Science and Machine Learning

## Python Syntax compared to other programming languages

- Python was designed for readability, and has some similarities to the English language with influence from mathematics
- Python uses new lines to complete a command, as opposed to other programming languages which often use semicolons or parentheses
- Python relies on indentation, using whitespace, to define scope; such as the scope of loops, functions and classes`,
            videoUrl: '',
            order: 1,
            exercise: {
                question: 'What is a correct way to display "Hello World" in Python?',
                options: [
                    'echo("Hello World")',
                    'print("Hello World")',
                    'console.log("Hello World")',
                    'printf("Hello World")'
                ],
                answer: 1
            }
        },
        {
            chapterId: 'c2',
            title: 'Python Syntax',
            content: `Python syntax can be executed by writing directly in the Command Line or by creating a python file on the server, using the .py file extension.

## Execute Python Syntax

\`\`\`python
print("Hello, World!")
\`\`\`

## Python Indentation

Indentation refers to the spaces at the beginning of a code line.

Where in other programming languages the indentation in code is for readability only, the indentation in Python is very important.

Python uses indentation to indicate a block of code.

\`\`\`python
if 5 > 2:
    print("Five is greater than two!")
\`\`\`

## Python Variables

In Python, variables are created when you assign a value to it:

\`\`\`python
x = 5
y = "Hello, World!"
print(x)
print(y)
\`\`\``,
            videoUrl: '',
            order: 2,
            exercise: {
                question: 'Which is the correct file extension for Python files?',
                options: ['.py', '.python', '.pt', '.pyt'],
                answer: 0
            }
        }
    ],
};

/* ─── Markdown-lite renderer ──────────────────────────────────────── */
const formatInline = (text) => {
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('`') && part.endsWith('`'))
            return <code key={i} className="bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded text-sm font-mono border border-slate-200 dark:border-slate-700">{part.slice(1, -1)}</code>;
        if (part.startsWith('**') && part.endsWith('**'))
            return <strong key={i} className="font-extrabold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
        return part;
    });
};

const renderContent = (raw) => {
    if (!raw) return null;
    
    // Check if content looks like HTML (Rich Text Editor output)
    const isHTML = raw.trim().startsWith('<') || raw.includes('</');
    
    if (isHTML) {
        return (
            <div 
                className="rich-text-content prose prose-slate dark:prose-invert max-w-none 
                    prose-table:border-collapse prose-table:border prose-table:border-white/10
                    prose-th:border prose-th:border-white/10 prose-th:px-4 prose-th:py-2 prose-th:bg-white/5
                    prose-td:border prose-td:border-white/10 prose-td:px-4 prose-td:py-2"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(raw) }} 
            />
        );
    }

    // Fallback to legacy markdown-lite renderer for older courses
    const blocks = [];
    const lines = raw.split('\n');
    let inCode = false, codeLines = [], codeLang = '';
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim().startsWith('```')) {
            if (inCode) {
                blocks.push({ type: 'code', language: codeLang, content: codeLines.join('\n') });
                inCode = false; codeLines = [];
            } else {
                inCode = true; codeLang = line.replace('```', '').trim();
            }
        } else if (inCode) {
            codeLines.push(line);
        } else {
            blocks.push({ type: 'text', content: line });
        }
    }
    return blocks.map((block, i) => {
        if (block.type === 'code') {
            if (block.language === 'python' || block.language === 'py') {
                return <TryItYourself key={`code-${i}`} defaultCode={block.content} />;
            }
            return (
                <div key={`code-${i}`} className="my-6 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-slate-950">
                    <div className="bg-slate-900 px-4 py-2 text-[10px] text-slate-500 font-black uppercase tracking-widest border-b border-white/5">
                        {block.language || 'code'}
                    </div>
                    <pre className="text-emerald-400 text-sm font-mono p-6 overflow-x-auto selection:bg-emerald-500/30"><code>{block.content}</code></pre>
                </div>
            );
        }
        const line = block.content;
        if (line.startsWith('### ')) return <h3 key={i} className="text-2xl font-black text-slate-900 dark:text-white mt-10 mb-4 tracking-tight">{line.slice(4)}</h3>;
        if (line.startsWith('## ')) return <h2 key={i} className="text-3xl font-black text-slate-900 dark:text-white mt-12 mb-6 pb-2 border-b-4 border-emerald-500 w-fit">{line.slice(3)}</h2>;
        if (line.startsWith('# ')) return <h1 key={i} className="text-4xl font-black text-slate-900 dark:text-white mt-14 mb-8 tracking-tighter">{line.slice(2)}</h1>;
        if (line.startsWith('- ')) return (
            <li key={i} className="flex items-start gap-4 text-slate-800 dark:text-slate-200 ml-4 mb-3 leading-relaxed text-lg group">
                <span className="mt-2.5 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] group-hover:scale-125 transition-transform shrink-0" />
                {formatInline(line.slice(2))}
            </li>
        );
        if (line.trim() === '') return <div key={i} className="h-4" />;
        return <p key={i} className="text-slate-800 dark:text-slate-200 leading-relaxed mb-6 text-lg font-medium">{formatInline(line)}</p>;
    });
};

/* ─── YouTube embed converter ─────────────────────────────────────── */
const toEmbedUrl = (url) => {
    if (!url) return '';
    if (url.includes('/embed/')) return url;
    try {
        const u = new URL(url);
        let id = '';
        if (u.hostname === 'youtu.be') id = u.pathname.slice(1);
        else if (u.pathname.startsWith('/shorts/')) id = u.pathname.split('/shorts/')[1];
        else if (u.searchParams.has('v')) id = u.searchParams.get('v');
        return id ? `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1` : url;
    } catch { return url; }
};

/* ─── Exercise Quiz ───────────────────────────────────────────────── */
const ExerciseQuiz = ({ exercise }) => {
    const [selected, setSelected] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    if (!exercise) return null;
    const isCorrect = selected === exercise.answer;
    return (
        <div className="mt-8 mb-4 rounded-xl overflow-hidden border border-gray-300 shadow-md">
            <div className="bg-gray-800 text-white px-5 py-3 flex items-center gap-2">
                <Trophy size={16} className="text-yellow-400" />
                <span className="font-bold text-sm">Exercise</span>
                <span className="ml-auto text-yellow-400 text-xs">?</span>
            </div>
            <div className="bg-white px-5 py-4">
                <p className="text-gray-800 font-semibold mb-4">{exercise.question}</p>
                <div className="space-y-2">
                    {exercise.options.map((opt, i) => (
                        <button
                            key={i}
                            onClick={() => { if (!submitted) setSelected(i); }}
                            className={`w-full text-left px-4 py-3 rounded-md border text-sm transition-all flex items-center gap-3 ${
                                submitted
                                    ? i === exercise.answer
                                        ? 'bg-green-50 border-green-500 text-green-800'
                                        : i === selected && !isCorrect
                                            ? 'bg-red-50 border-red-400 text-red-700'
                                            : 'bg-gray-50 border-gray-200 text-gray-600'
                                    : selected === i
                                        ? 'bg-blue-50 border-blue-400 text-blue-800'
                                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                submitted && i === exercise.answer ? 'border-green-500 bg-green-500' :
                                selected === i && !submitted ? 'border-blue-500' : 'border-gray-300'
                            }`}>
                                {submitted && i === exercise.answer && <span className="text-white text-xs">✓</span>}
                            </span>
                            {opt}
                        </button>
                    ))}
                </div>
                <div className="mt-4 flex items-center gap-3">
                    <button
                        onClick={() => { if (selected !== null) setSubmitted(true); }}
                        disabled={submitted || selected === null}
                        className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-bold transition-colors disabled:opacity-50"
                    >
                        Submit Answer »
                    </button>
                    {submitted && (
                        <span className={`text-sm font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                            {isCorrect ? '✓ Correct!' : '✗ Incorrect. Try again!'}
                        </span>
                    )}
                    {submitted && !isCorrect && (
                        <button onClick={() => { setSelected(null); setSubmitted(false); }}
                            className="text-xs text-blue-600 hover:underline">Reset</button>
                    )}
                </div>
            </div>
        </div>
    );
};

/* ─── Main Component ──────────────────────────────────────────────── */
const CourseViewer = () => {
    const { id: courseId } = useParams();
    const navigate = useNavigate();

    const [course, setCourse] = useState(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [completed, setCompleted] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchCourse = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            if (courseId) {
                const { data } = await axiosInstance.get(`/courses/${courseId}`);
                const sorted = [...(data.chapters || [])].sort((a, b) => a.order - b.order);
                setCourse({ ...data, chapters: sorted });
                try {
                    const enrollRes = await axiosInstance.post(`/courses/${courseId}/enroll`);
                    if (enrollRes.data?.enrollment?.completedChapters)
                        setCompleted(new Set(enrollRes.data.enrollment.completedChapters));
                } catch { /* silent */ }
            } else {
                setCourse(MOCK_COURSE);
            }
        } catch {
            setCourse(MOCK_COURSE);
            setError('Could not load course from server — showing demo content.');
        } finally {
            setLoading(false);
        }
    }, [courseId]);

    useEffect(() => { fetchCourse(); }, [fetchCourse]);

    const handleMarkComplete = async (silent = false) => {
        const chapter = course?.chapters[activeIndex];
        if (!chapter) return;
        
        const nextSet = new Set(completed);
        const alreadyDone = nextSet.has(chapter.chapterId);
        
        if (!alreadyDone) {
            nextSet.add(chapter.chapterId);
            setCompleted(nextSet);
            if (courseId) {
                try { 
                    await axiosInstance.put(`/courses/${courseId}/progress`, { chapterId: chapter.chapterId }); 
                } catch (err) {
                    console.error('Failed to save progress:', err);
                }
            }
        }
        
        if (!silent) {
            if (activeIndex < course.chapters.length - 1) setActiveIndex(prev => prev + 1);
        }
    };

    if (loading) return (
        <div className="flex h-screen bg-gray-100 items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-gray-500">
                <Loader2 size={40} className="animate-spin text-green-600" />
                <p className="text-sm font-medium">Loading course…</p>
            </div>
        </div>
    );

    if (!course) return (
        <div className="flex h-screen bg-gray-100 items-center justify-center text-gray-500">
            <p>No course found.</p>
        </div>
    );

    const chapters = course.chapters || [];
    const activeChapter = chapters[activeIndex];
    const totalChapters = chapters.length;
    const completedCount = completed.size;
    const progressPercent = totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 0;
    const isCurrentComplete = activeChapter ? completed.has(activeChapter.chapterId) : false;
    const hasPrev = activeIndex > 0;
    const hasNext = activeIndex < totalChapters - 1;

    return (
        <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] font-sans overflow-hidden transition-colors">

            {/* ══ LEFT SIDEBAR ══════════════════════════════════════════ */}
            <aside className="w-[300px] shrink-0 h-full bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden text-slate-300 shadow-2xl z-20">
                {/* Course title */}
                <div className="bg-slate-950 px-6 py-8 shrink-0 border-b border-slate-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full -mr-16 -mt-16" />
                    <h1 className="font-bold text-xl leading-tight text-white relative z-10 tracking-tight">{course.title}</h1>
                    {course.instructor && (
                        <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1.5 font-bold uppercase tracking-[0.1em]">
                            <User size={12} className="text-emerald-500" />
                            {course.instructor}
                        </p>
                    )}
                </div>

                {/* Progress */}
                <div className="px-6 py-5 bg-slate-900/40 border-b border-slate-800 shrink-0">
                    <div className="flex justify-between text-[10px] uppercase tracking-widest font-black text-slate-500 mb-2.5">
                        <span>Completion</span>
                        <span className="text-emerald-400 font-mono">{progressPercent}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800/50 overflow-hidden shadow-inner border border-slate-700/30">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercent}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-400" 
                        />
                    </div>
                    <div className="flex items-center justify-between mt-3">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{completedCount} / {totalChapters} Lessons</p>
                        <Trophy size={14} className={progressPercent === 100 ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" : "text-slate-700"} />
                    </div>
                </div>

                {/* Chapter list */}
                <div className="flex-1 overflow-y-auto custom-scrollbar-dark py-4 px-3 space-y-1">
                    {chapters.map((ch, idx) => {
                        const isActive = idx === activeIndex;
                        const isDone = completed.has(ch.chapterId);
                        return (
                            <button
                                key={ch.chapterId}
                                onClick={() => setActiveIndex(idx)}
                                className={`w-full text-left px-4 py-3.5 text-sm flex items-start gap-3.5 transition-all rounded-xl relative group ${
                                    isActive
                                        ? 'bg-emerald-500/10 text-white'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                                }`}
                            >
                                {isActive && (
                                    <motion.div 
                                      layoutId="active-chapter-pill"
                                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-emerald-500 rounded-r-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" 
                                    />
                                )}
                                <span className={`shrink-0 mt-0.5 p-1.5 rounded-lg transition-colors ${
                                    isActive 
                                        ? 'bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/10' 
                                        : isDone ? 'text-emerald-600/60' : 'text-slate-700 group-hover:text-slate-500'
                                }`}>
                                    {isDone
                                        ? <CheckCircle size={14} className={isActive ? 'text-emerald-400 shadow-emerald-400/50' : ''} />
                                        : isActive
                                            ? <PlayCircle size={14} className="animate-pulse" />
                                            : <BookOpen size={14} />
                                    }
                                </span>
                                <div className="flex flex-col gap-0.5">
                                    <span className={`leading-snug font-semibold text-[13px] ${isActive ? 'text-white' : 'text-slate-400'}`}>{ch.title}</span>
                                    <span className="text-[10px] text-slate-600 font-medium uppercase tracking-wider">Lesson {idx + 1}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Sidebar Footer */}
                <div className="shrink-0 border-t border-slate-800 p-6 bg-slate-950/50 backdrop-blur-md">
                    <button 
                        onClick={() => navigate('/student/courses')}
                        className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold uppercase tracking-[0.1em] transition-all border border-slate-700/50 hover:border-emerald-500/30 group"
                    >
                        <Home size={14} className="text-emerald-500 group-hover:scale-110 transition-transform" /> Exit Academy
                    </button>
                </div>
            </aside>

            {/* ══ MAIN CONTENT AREA ═════════════════════════════════════ */}
            <main className="flex-1 h-screen flex flex-col overflow-hidden relative z-10 transition-colors">
                
                {/* Visual background decoration */}
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-emerald-500/5 blur-[120px] rounded-full -tr-1/4 -te-1/4 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-blue-500/5 blur-[100px] rounded-full -bl-1/4 pointer-events-none" />

                {/* Top Header */}
                <header className="shrink-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between sticky top-0 z-30 transition-all">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                            <BookOpen size={20} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 leading-none mb-1">Current Module</p>
                            <h2 className="font-bold text-slate-800 dark:text-white leading-tight">{activeChapter?.title}</h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
                            <motion.button
                                whileHover={{ x: -2, backgroundColor: "white" }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setActiveIndex(prev => Math.max(0, prev - 1))}
                                disabled={!hasPrev}
                                className="p-2 text-slate-400 hover:text-emerald-600 disabled:opacity-20 transition-all rounded-xl dark:hover:bg-slate-700"
                            >
                                <ChevronLeft size={20} />
                            </motion.button>
                            
                            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
                            
                            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-4 font-mono">
                                {activeIndex + 1} <span className="opacity-30 mx-1">/</span> {totalChapters}
                            </span>
                            
                            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

                            <motion.button
                                whileHover={{ x: 2, scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={async () => {
                                    await handleMarkComplete(true); // Mark current as done
                                    if (hasNext) setActiveIndex(prev => prev + 1);
                                }}
                                className={`p-2 transition-all rounded-xl dark:hover:bg-slate-700 ${
                                    hasNext 
                                        ? 'text-slate-400 hover:text-emerald-600' 
                                        : 'text-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/10'
                                }`}
                            >
                                <ChevronRight size={20} />
                            </motion.button>
                        </div>
                    </div>
                </header>

                {error && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="shrink-0 flex items-center gap-3 bg-amber-50 dark:bg-amber-900/10 border-b border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 text-[11px] font-bold px-8 py-2.5 z-20"
                    >
                        <AlertTriangle size={14} className="animate-bounce" /> {error}
                    </motion.div>
                )}

                {/* Full Progress Micro-bar */}
                <div className="shrink-0 h-1 bg-slate-100 dark:bg-slate-800 relative overflow-hidden z-20">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${((activeIndex + 1) / totalChapters) * 100}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                    />
                </div>

                {/* Scrollable Content Container */}
                <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
                    <div className="max-w-4xl mx-auto px-8 md:px-12 py-12 pb-32">
                        
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={activeChapter?.chapterId}
                        >
                            {/* Intro Badge */}
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-6 border border-emerald-500/20">
                                <Video size={12} /> Video & Interactive Content
                            </div>

                            <h1 className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white mb-8 tracking-tight leading-[1.1]">
                                {activeChapter?.title}
                            </h1>

                            {/* Video section */}
                            {activeChapter?.videoUrl && (
                                <div className="mb-12 rounded-[2rem] overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl relative group bg-black aspect-video">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none" />
                                    <iframe
                                        src={toEmbedUrl(activeChapter.videoUrl)}
                                        title={activeChapter.title}
                                        className="w-full h-full relative z-0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                            )}

                            {/* Main Reading Content */}
                            <article className="prose prose-slate dark:prose-invert prose-emerald max-w-none 
                                prose-h1:text-5xl prose-h1:font-black prose-h1:tracking-tighter prose-h1:mb-10
                                prose-h2:text-3xl prose-h2:font-black prose-h2:tracking-tight prose-h2:mt-12 prose-h2:mb-6 prose-h2:border-b-4 prose-h2:border-emerald-500 prose-h2:w-fit prose-h2:pb-2
                                prose-p:text-slate-900 dark:prose-p:text-slate-100 prose-p:leading-relaxed prose-p:text-lg prose-p:font-medium
                                prose-strong:text-slate-950 dark:prose-strong:text-white prose-strong:font-black
                                prose-code:bg-slate-100 dark:prose-code:bg-slate-800/80 prose-code:text-emerald-600 dark:prose-code:text-emerald-400 prose-code:px-2 prose-code:py-1 prose-code:rounded-lg prose-code:before:content-none prose-code:after:content-none prose-code:font-black prose-code:border prose-code:border-slate-200 dark:prose-code:border-slate-700
                                prose-li:text-slate-900 dark:prose-li:text-slate-100 prose-li:text-lg prose-li:font-medium
                            ">
                                {renderContent(activeChapter?.content)}
                            </article>

                            {/* Interactive Code Blocks */}
                            {activeChapter?.interactiveCodes && activeChapter.interactiveCodes.length > 0 && (
                                <div className="mt-12 space-y-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="h-px flex-1 bg-white/10" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 whitespace-nowrap">Interactive Experiments</span>
                                        <div className="h-px flex-1 bg-white/10" />
                                    </div>
                                    {activeChapter.interactiveCodes.map((block, idx) => (
                                        <div key={idx} className="animate-fade-in-up" style={{ animationDelay: `${idx * 150}ms` }}>
                                            <CodeCompiler 
                                                title={block.title} 
                                                initialCode={block.initialCode} 
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Interaction Area (Quiz/Exercise) */}
                            {activeChapter?.exercise && (
                                <section className="mt-16 relative">
                                    <div className="absolute -inset-4 bg-gradient-to-br from-emerald-500/5 to-blue-500/5 blur-2xl rounded-[3rem] -z-10" />
                                    <ExerciseQuiz exercise={activeChapter.exercise} key={activeChapter.chapterId} />
                                </section>
                            )}

                            {/* Reward/Congratulations */}
                            {progressPercent === 100 && (
                                <motion.div 
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="mt-20 p-8 rounded-[2.5rem] bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-3xl shadow-emerald-500/20 relative overflow-hidden flex flex-col items-center text-center"
                                >
                                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                                        <div className="absolute top-10 left-10 w-40 h-40 bg-white blur-3xl rounded-full" />
                                        <div className="absolute bottom-10 right-10 w-32 h-32 bg-yellow-400 blur-3xl rounded-full" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center mb-6 shadow-xl border border-white/30">
                                            <Trophy size={40} className="text-yellow-300 drop-shadow-lg" />
                                        </div>
                                        <h3 className="text-3xl font-black mb-2 tracking-tight">Magnificent Work!</h3>
                                        <p className="text-emerald-50/80 font-medium mb-8 max-w-md mx-auto">
                                            You've mastered every chapter of <strong>{course.title}</strong>. 
                                            Your skill score has been updated.
                                        </p>
                                        <button 
                                            onClick={() => navigate('/student/courses')}
                                            className="px-8 py-3 bg-white text-emerald-700 rounded-2xl font-black uppercase tracking-widest text-xs hover:shadow-2xl transition-all active:scale-95"
                                        >
                                            Return to Skill Center
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Bottom Navigation Controls */}
                            <footer className="mt-24 pt-12 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 pb-20">
                                <button
                                    onClick={() => setActiveIndex(prev => Math.max(0, prev - 1))}
                                    disabled={!hasPrev}
                                    className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white rounded-2xl font-bold transition-all hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 border border-transparent active:scale-95"
                                >
                                    <ChevronLeft size={20} /> Previous Phase
                                </button>

                                <button
                                    onClick={handleMarkComplete}
                                    disabled={isCurrentComplete && !hasNext}
                                    className={`w-full md:w-auto flex items-center justify-center gap-3 px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
                                        isCurrentComplete
                                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default opacity-80'
                                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/25 ring-4 ring-emerald-500/10'
                                    }`}
                                >
                                    {isCurrentComplete
                                        ? <><CheckCircle size={20} /> Chapter Finished</>
                                        : <>{hasNext ? 'Complete & Next' : 'Finalize Course'} <ChevronRight size={20} /></>
                                    }
                                </button>
                            </footer>
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CourseViewer;
