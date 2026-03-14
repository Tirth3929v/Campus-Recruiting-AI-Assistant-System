import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    CheckCircle, ChevronLeft, ChevronRight,
    BookOpen, PlayCircle, Trophy, Clock,
    BarChart2, Loader2, AlertTriangle, Video, Home
} from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import TryItYourself from '../components/TryItYourself';

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
            return <code key={i} className="bg-[#282c34] text-[#e06c75] px-1.5 py-0.5 rounded text-sm font-mono border border-gray-700">{part.slice(1, -1)}</code>;
        if (part.startsWith('**') && part.endsWith('**'))
            return <strong key={i} className="font-semibold text-gray-800">{part.slice(2, -2)}</strong>;
        return part;
    });
};

const renderContent = (raw) => {
    if (!raw) return null;
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
                <div key={`code-${i}`} className="my-4 rounded-lg overflow-hidden border border-gray-300 shadow-sm">
                    <div className="bg-[#282c34] px-4 py-2 text-xs text-gray-400 font-mono border-b border-gray-600">
                        {block.language || 'code'}
                    </div>
                    <pre className="bg-[#1e2127] text-green-300 text-sm font-mono p-4 overflow-x-auto"><code>{block.content}</code></pre>
                </div>
            );
        }
        const line = block.content;
        if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-bold text-gray-800 mt-7 mb-3">{line.slice(4)}</h3>;
        if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold text-gray-800 mt-8 mb-4 pb-2 border-b border-gray-200">{line.slice(3)}</h2>;
        if (line.startsWith('# ')) return <h1 key={i} className="text-3xl font-bold text-gray-800 mt-8 mb-4">{line.slice(2)}</h1>;
        if (line.startsWith('- ')) return (
            <li key={i} className="flex items-start gap-2 text-gray-700 ml-4 mb-1 leading-relaxed">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-green-600 shrink-0" />
                {formatInline(line.slice(2))}
            </li>
        );
        if (line.trim() === '') return <div key={i} className="h-2" />;
        return <p key={i} className="text-gray-700 leading-relaxed mb-2">{formatInline(line)}</p>;
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

    const handleMarkComplete = async () => {
        const chapter = course?.chapters[activeIndex];
        if (!chapter) return;
        const next = new Set(completed);
        next.add(chapter.chapterId);
        setCompleted(next);
        if (courseId) {
            try { await axiosInstance.put(`/courses/${courseId}/progress`, { chapterId: chapter.chapterId }); } catch { /* silent */ }
        }
        if (activeIndex < course.chapters.length - 1) setActiveIndex(prev => prev + 1);
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
        <div className="flex h-screen bg-white font-sans overflow-hidden" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>

            {/* ══ LEFT SIDEBAR ══════════════════════════════════════════ */}
            <aside className="w-[230px] shrink-0 h-full bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden">
                {/* Course title */}
                <div className="bg-[#282a35] text-white px-4 py-3 shrink-0">
                    <h1 className="font-bold text-sm leading-snug">{course.title}</h1>
                    {course.instructor && (
                        <p className="text-xs text-gray-400 mt-0.5">By {course.instructor}</p>
                    )}
                </div>

                {/* Progress */}
                <div className="px-3 py-2 bg-white border-b border-gray-200 shrink-0">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span className="font-bold text-green-600">{progressPercent}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                        <div className="h-full rounded-full bg-green-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">{completedCount}/{totalChapters} chapters</p>
                </div>

                {/* Chapter list */}
                <div className="flex-1 overflow-y-auto">
                    {chapters.map((ch, idx) => {
                        const isActive = idx === activeIndex;
                        const isDone = completed.has(ch.chapterId);
                        return (
                            <button
                                key={ch.chapterId}
                                onClick={() => setActiveIndex(idx)}
                                className={`w-full text-left px-4 py-2 text-sm flex items-start gap-2 border-b border-gray-100 transition-colors ${
                                    isActive
                                        ? 'bg-[#04aa6d] text-white font-semibold'
                                        : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                <span className="shrink-0 mt-0.5">
                                    {isDone
                                        ? <CheckCircle size={13} className={isActive ? 'text-white' : 'text-green-500'} />
                                        : isActive
                                            ? <PlayCircle size={13} className="text-white" />
                                            : <BookOpen size={13} className="text-gray-400" />
                                    }
                                </span>
                                <span className="leading-snug">{ch.title}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Bottom stats */}
                <div className="shrink-0 border-t border-gray-200 px-3 py-2 bg-white flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Clock size={11} /></span>
                    <span className="flex items-center gap-1"><Trophy size={11} className="text-yellow-500" /> {completedCount}/{totalChapters}</span>
                </div>
            </aside>

            {/* ══ MAIN CONTENT AREA ═════════════════════════════════════ */}
            <main className="flex-1 h-full flex flex-col overflow-hidden bg-white">

                {/* Top Nav bar */}
                <div className="shrink-0 bg-gray-100 border-b border-gray-300 px-4 py-2 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/student/courses')}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-[#282a35] text-white text-sm rounded hover:bg-gray-700 transition-colors"
                    >
                        <Home size={14} /> Home
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setActiveIndex(prev => Math.max(0, prev - 1))}
                            disabled={!hasPrev}
                            className="flex items-center gap-1 px-4 py-1.5 bg-[#282a35] text-white text-sm rounded hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={14} /> Previous
                        </button>
                        <span className="text-xs text-gray-500 px-2">
                            {activeIndex + 1} / {totalChapters}
                        </span>
                        <button
                            onClick={() => hasNext ? setActiveIndex(prev => prev + 1) : handleMarkComplete()}
                            className="flex items-center gap-1 px-4 py-1.5 bg-[#04aa6d] text-white text-sm rounded hover:bg-green-600 transition-colors"
                        >
                            Next <ChevronRight size={14} />
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="shrink-0 flex items-center gap-2 bg-amber-50 border-b border-amber-200 text-amber-700 text-xs px-5 py-2">
                        <AlertTriangle size={13} /> {error}
                    </div>
                )}

                {/* Progress bar (thin W3Schools style green bar) */}
                <div className="shrink-0 h-1 bg-gray-200">
                    <div className="h-full bg-[#04aa6d] transition-all duration-500" style={{ width: `${((activeIndex + 1) / totalChapters) * 100}%` }} />
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-4xl mx-auto px-8 py-8">

                        {/* Green intro banner */}
                        <div className="bg-[#D4EDDA] border border-[#C3E6CB] rounded-sm px-6 py-5 mb-8">
                            <h1 className="text-2xl font-bold text-gray-800 mb-2">
                                {activeChapter?.title}
                            </h1>
                            {isCurrentComplete && (
                                <div className="flex items-center gap-1.5 text-green-700 text-sm mt-2">
                                    <CheckCircle size={14} /> Chapter completed
                                </div>
                            )}
                        </div>

                        {/* Video embed */}
                        {activeChapter?.videoUrl && (
                            <div className="mb-8 rounded-lg overflow-hidden border border-gray-200 shadow">
                                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
                                    <Video size={14} className="text-green-600" />
                                    <span className="text-xs font-semibold text-gray-600">Video Resource</span>
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

                        {/* Chapter text content */}
                        <div className="text-gray-700 leading-relaxed">
                            {renderContent(activeChapter?.content)}
                        </div>

                        {/* Exercise section */}
                        {activeChapter?.exercise && (
                            <ExerciseQuiz exercise={activeChapter.exercise} key={activeChapter.chapterId} />
                        )}

                        {/* Tip: sign in to track progress (W3Schools style) */}
                        {!isCurrentComplete && (
                            <div className="mt-6 flex items-center gap-2 text-xs text-gray-500 border border-gray-200 rounded px-4 py-2 bg-gray-50">
                                <span className="text-green-600 font-bold">Tip:</span>
                                Mark this chapter as complete to track your progress.
                            </div>
                        )}

                        {/* Completion banner */}
                        {progressPercent === 100 && (
                            <div className="mt-8 p-6 rounded-lg bg-green-50 border border-green-300 flex items-center gap-4">
                                <Trophy size={32} className="text-green-600 shrink-0" />
                                <div>
                                    <p className="font-bold text-green-700 text-lg">Course Complete! 🎉</p>
                                    <p className="text-sm text-gray-600">You've finished all {totalChapters} chapters of <strong>{course.title}</strong>.</p>
                                </div>
                            </div>
                        )}

                        {/* Bottom Prev/Next */}
                        <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-200">
                            <button
                                onClick={() => setActiveIndex(prev => Math.max(0, prev - 1))}
                                disabled={!hasPrev}
                                className="flex items-center gap-2 px-6 py-2.5 bg-[#282a35] text-white rounded font-semibold text-sm hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={16} /> Previous
                            </button>

                            <button
                                onClick={handleMarkComplete}
                                disabled={isCurrentComplete && !hasNext}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded font-semibold text-sm transition-colors ${
                                    isCurrentComplete
                                        ? 'bg-gray-200 text-gray-500 cursor-default'
                                        : 'bg-[#04aa6d] hover:bg-green-600 text-white'
                                }`}
                            >
                                {isCurrentComplete
                                    ? <><CheckCircle size={16} /> Completed</>
                                    : <>{hasNext ? 'Mark Complete & Next' : 'Finish Course'} <ChevronRight size={16} /></>
                                }
                            </button>
                        </div>

                        <div className="h-10" />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CourseViewer;
