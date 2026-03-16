import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Play, RotateCcw, Monitor, Code2, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const CodeCompiler = ({ initialCode = '', title = 'Try it Yourself' }) => {
    const [code, setCode] = useState(initialCode);
    const [previewContent, setPreviewContent] = useState('');
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        // Initial run
        runCode();
    }, []);

    const runCode = () => {
        setIsRunning(true);
        // Simulate a small delay for premium feel
        setTimeout(() => {
            setPreviewContent(code);
            setIsRunning(false);
        }, 300);
    };

    const resetCode = () => {
        setCode(initialCode);
    };

    return (
        <div className="flex flex-col w-full h-[600px] bg-[#0B0F19] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 bg-white/5 border-b border-white/10 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <Code2 size={18} className="text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white tracking-wide uppercase">{title}</h3>
                        <p className="text-[10px] text-white/40 font-medium">Interactive Playground</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <motion.button 
                        whileHover={{ scale: 1.02 }} 
                        whileTap={{ scale: 0.98 }}
                        onClick={resetCode}
                        className="p-2 text-white/40 hover:text-white transition-colors"
                        title="Reset Code"
                    >
                        <RotateCcw size={18} />
                    </motion.button>
                    
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={runCode}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/20 transition-all"
                    >
                        {isRunning ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Play size={14} fill="currentColor" />
                        )}
                        RUN CODE
                    </motion.button>
                </div>
            </div>

            {/* Split Screen Layout */}
            <div className="flex flex-1 overflow-hidden">
                {/* Editor Side */}
                <div className="w-1/2 border-r border-white/10 relative">
                    <Editor
                        height="100%"
                        defaultLanguage="html"
                        theme="vs-dark"
                        value={code}
                        onChange={(value) => setCode(value || '')}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            padding: { top: 20 },
                            backgroundColor: '#0B0F19'
                        }}
                    />
                </div>

                {/* Preview Side */}
                <div className="w-1/2 bg-white flex flex-col relative">
                    <div className="absolute top-4 right-4 z-10 opacity-40">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/5 text-[10px] font-bold text-black/60 uppercase tracking-tighter">
                            <Monitor size={10} /> Live Preview
                        </div>
                    </div>
                    {isRunning && (
                        <div className="absolute inset-0 z-20 bg-white/50 backdrop-blur-[2px] flex items-center justify-center">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center gap-2"
                            >
                                <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Compiling...</span>
                            </motion.div>
                        </div>
                    )}
                    <iframe
                        title="Preview"
                        srcDoc={previewContent}
                        className="w-full h-full border-none"
                        sandbox="allow-scripts"
                    />
                </div>
            </div>

            {/* Footer / Status Bar */}
            <div className="px-6 py-2 bg-white/5 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-white/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Runtime: Browser (Secure Sandbox)
                    </div>
                </div>
                <div className="text-[10px] font-bold text-white/20 tracking-widest uppercase">
                    Campus Recruit v2.0
                </div>
            </div>
        </div>
    );
};

export default CodeCompiler;
