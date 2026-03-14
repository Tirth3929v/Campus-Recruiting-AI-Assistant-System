require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const http = require('http');
const { Server } = require('socket.io');

// Import models from /models (single source of truth)
const User = require('./models/User');
const StudentProfile = require('./models/StudentProfile');
const AIInterviewSession = require('./models/AIInterviewSession');
const StudyResource = require('./models/StudyResource');
const LegacyInterview = require('./models/LegacyInterview');
const Enrollment = require('./models/Enrollment');
const Streak = require('./models/Streak');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use((req, res, next) => {
    console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

const allowedOrigins = [
    'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177',
    'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'http://127.0.0.1:5175', 'http://127.0.0.1:5176', 'http://127.0.0.1:5177'
];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: "You are a helpful, encouraging Placement Assistant and Technical Tutor for Campus Recruit. Answer questions about coding, interviews, and platform navigation concisely."
});

// Connect to MongoDB
const connectDB = require('./config/db');

// Create HTTP server and Socket.io
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

app.set('socketio', io);

io.on('connection', (socket) => {
    socket.on('join_room', (data) => {
        if (typeof data === 'string') {
            socket.join(data);
        } else if (data && data.userId) {
            socket.join(data.userId);
            if (data.role) socket.join(`role:${data.role}`);
        }
    });
});

// ─── Auth Middleware ──────────────────────────────────────────
const verifyToken = (req, res, next) => {
    let token;
    
    // 1. Priority: Authorization Header (Bearer Token)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    } 
    // 2. Fallback: Unique Cookie
    else if (req.cookies.cr_token) {
        token = req.cookies.cr_token;
    } 
    // 3. Legacy Fallback (temporary)
    else if (req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) return res.status(401).json({ error: 'Access denied - No token provided' });
    
    try {
        const secret = process.env.JWT_SECRET || 'campus_recruit_jwt_secret_2026_secure_key';
        const verified = jwt.verify(token, secret);
        req.user = verified;
        next();
    } catch (err) {
        console.error(`❌ [Auth] JWT Error: ${err.message}`);
        res.status(401).json({ error: 'Not authorized, token failed' });
    }
};

const optionalAuth = (req, res, next) => {
    let token = req.cookies.token;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
        try {
            req.user = jwt.verify(token, process.env.JWT_SECRET || 'campus_recruit_jwt_secret_2026_secure_key');
        } catch (err) { /* ignore silently */ }
    }
    next();
};

// ─── Streak Helper ──────────────────────────────────────────
const recordActivity = async (userId, activityType = 'heartbeat') => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        await Streak.findOneAndUpdate({ user: userId, date: today }, { $set: { activityType } }, { upsert: true });
        const user = await User.findById(userId);
        if (!user) return;
        const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
        if (lastActive) lastActive.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (!lastActive) user.currentStreak = 1;
        else if (lastActive.getTime() === yesterday.getTime()) user.currentStreak += 1;
        else if (lastActive.getTime() < yesterday.getTime()) user.currentStreak = 1;

        user.lastActiveDate = new Date();
        await user.save();
        await StudentProfile.findOneAndUpdate({ user: userId }, { $set: { streak: user.currentStreak } });
    } catch (err) { console.error('Streak recording error:', err); }
};

// ─── Routes ──────────────────────────────────────────────────

app.post('/api/chat', async (req, res) => {
    try {
        const { message, history } = req.body;
        if (!process.env.GEMINI_API_KEY) return res.status(500).json({ text: "Server Error: AI configuration missing." });
        const chatHistory = (history || []).map(msg => ({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.text }] }));
        const chat = model.startChat({ history: chatHistory });
        const result = await chat.sendMessage(message);
        const response = await result.response;
        res.json({ text: response.text() });
    } catch (error) {
        console.error("Gemini Chat Error:", error);
        res.status(500).json({ text: "I'm having trouble connecting to the AI right now." });
    }
});

app.get('/api/dashboard', verifyToken, async (req, res) => {
    try {
        recordActivity(req.user.id, 'heartbeat');
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: "User not found" });
        const studentProfile = await StudentProfile.findOne({ user: req.user.id });
        const sessions = await AIInterviewSession.find({ user: req.user.id });
        const totalSessions = sessions.length;
        const completedSessions = sessions.filter(s => s.status === 'Completed' || s.status === 'Evaluated');
        const avgScore = completedSessions.length > 0 ? Math.round(completedSessions.reduce((sum, s) => sum + (s.overallScore || 0), 0) / completedSessions.length) : 0;
        
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const interviewsThisWeek = sessions.filter(s => new Date(s.createdAt) >= startOfWeek).length;

        // Leaderboard simplified
        const leaderboardData = await AIInterviewSession.aggregate([{ $match: { status: { $in: ['Completed', 'Evaluated'] } } }, { $group: { _id: '$user', avg: { $avg: '$overallScore' } } }, { $sort: { avg: -1 } }, { $limit: 5 }]);
        const leaderboard = await Promise.all(leaderboardData.map(async entry => {
            const u = await User.findById(entry._id);
            return { name: u?.name || 'Unknown', course: u?.course || 'N/A', score: Math.round(entry.avg) };
        }));

        res.json({
            user: { name: user.name, course: user.course || studentProfile?.course || 'N/A', readiness: avgScore || 50, streak: user.currentStreak || 0 },
            stats: [
                { label: "Total Interviews", value: totalSessions, icon: "Activity", color: "text-blue-600" },
                { label: "Average Score", value: avgScore, suffix: "%", icon: "Target", color: "text-purple-600" }
            ],
            interviewsThisWeek,
            leaderboard: leaderboard.filter(Boolean)
        });
    } catch (e) { res.status(500).json({ error: "Server Error" }); }
});

app.get(['/api/me', '/api/currentuser'], verifyToken, async (req, res) => {
    try {
        // req.user is populated by verifyToken middleware
        const userId = req.user.id || req.user._id;
        console.log(`🔍 [Auth] Checking user with ID: ${userId} (from payload: ${JSON.stringify(req.user)})`);

        if (!userId) {
            return res.status(401).json({ error: 'Not authorized, token missing ID' });
        }

        const user = await User.findById(userId).select('-password');
        if (!user) {
            console.warn(`⚠️ [Auth] User not found in database: ${userId}`);
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(user);
    } catch (err) {
        console.error('❌ [Auth] Current user route error:', err);
        res.status(500).json({ error: 'Server Error', message: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.matchPassword(password))) return res.status(401).json({ error: 'Invalid credentials' });
        if (user.role === 'employee' && !user.isVerified) return res.status(403).json({ error: 'Awaiting admin approval.' });
        
        const token = jwt.sign(
            { id: user._id, _id: user._id, name: user.name, role: user.role }, 
            process.env.JWT_SECRET || 'campus_recruit_jwt_secret_2026_secure_key', 
            { expiresIn: '30d' }
        );
        res.cookie('cr_token', token, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'lax', 
            maxAge: 30 * 24 * 60 * 60 * 1000 
        });
        res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) { res.status(500).json({ error: 'Server Error' }); }
});

app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password, course } = req.body;
        if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ error: 'Email already exists' });
        const user = await User.create({ name, email, password, role: 'student', course: course || '', isVerified: true });
        await StudentProfile.create({ user: user._id, course: course || '' });
        
        const token = jwt.sign({ id: user._id, _id: user._id, name: user.name, role: user.role }, process.env.JWT_SECRET || 'campus_recruit_jwt_secret_2026_secure_key', { expiresIn: '30d' });
        res.cookie('cr_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000 });
        res.status(201).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) { res.status(500).json({ error: 'Server Error' }); }
});

app.post('/api/employee/register', async (req, res) => {
    try {
        const { name, email, password, department } = req.body;
        const user = await User.create({ name, email, password, role: 'employee', course: department || '', isVerified: false });
        res.status(201).json({ success: true, message: 'Awaiting admin approval.' });
    } catch (err) { res.status(500).json({ error: 'Server Error' }); }
});

app.post('/api/logout', (req, res) => { 
    res.clearCookie('cr_token'); 
    res.clearCookie('token'); 
    res.json({ success: true }); 
});

// ─── Route Mounts ──────────────────────────────────────────
const mountRoute = (path, file) => { try { app.use(path, require(file)); } catch (e) { console.error(`Failed to mount ${path}:`, e.message); } };
mountRoute('/api/interviews', './routes/interviewRoutes');
mountRoute('/api/courses', './routes/courseRoutes');
mountRoute('/api/auth', './routes/authRoutes');
mountRoute('/api/ai-interview', './routes/aiInterviewRoutes');
mountRoute('/api/admin', './routes/adminRoutes');
mountRoute('/api/company', './routes/companyRoutes');
mountRoute('/api/jobs', './routes/jobRoutes');
mountRoute('/api/community', './routes/communityRoutes');
mountRoute('/api/notifications', './routes/notificationRoutes');

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(`❌ [Global Error] ${err.message}`);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Final Start
const startServer = async () => {
    try {
        await connectDB();
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server listening on port ${PORT} (0.0.0.0)`);
        }).on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`💥 Port ${PORT} already in use. Try: taskkill /F /IM node.exe`);
            } else { console.error(`💥 Listen error:`, err); }
            process.exit(1);
        });
    } catch (err) { console.error('💥 Fatal failure:', err); process.exit(1); }
};

startServer();