require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

// Import models from /models (single source of truth)
const User = require('./models/User');
const StudentProfile = require('./models/StudentProfile');
const AIInterviewSession = require('./models/AIInterviewSession');
const StudyResource = require('./models/StudyResource');
const LegacyInterview = require('./models/LegacyInterview');
const Enrollment = require('./models/Enrollment');

const app = express();
const PORT = process.env.PORT || 5000;
// Triggering nodemon restart to re-establish MongoDB connection

// Middleware
app.get('env'); // Force env check
app.use((req, res, next) => {
    console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177'],
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

// Connect to MongoDB using robust db.js
const connectDB = require('./config/db');

// Main Startup function
const startServer = async () => {
    try {
        await connectDB();
        
        // Start HTTP Server
        server.listen(PORT, () => {
            console.log(`🚀 Server fully initialized and listening on port ${PORT}`);
        });
    } catch (err) {
        console.error('💥 FATAL: Server failed to start:', err.message);
        process.exit(1);
    }
};

// Main Startup logic moved to the bottom of the file to ensure 'server' is defined


// ─── Auth Middleware ──────────────────────────────────────────
const verifyToken = (req, res, next) => {
    let token = req.cookies.token;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) return res.status(401).json({ error: 'Access denied - No token provided' });
    
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'campus_recruit_jwt_secret_2026_secure_key');
        req.user = verified;
        next();
    } catch (err) {
        console.error('JWT Verification Error:', err.message);
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
        } catch (err) { /* ignore silently for optional */ }
    }
    next();
};

// ─── Routes ──────────────────────────────────────────────────

// 1. AI Chat Route
app.post('/api/chat', async (req, res) => {
    try {
        const { message, history } = req.body;
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ text: "Server Error: AI configuration missing." });
        }
        const chatHistory = (history || []).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));
        const chat = model.startChat({ history: chatHistory });
        const result = await chat.sendMessage(message);
        const response = await result.response;
        res.json({ text: response.text() });
    } catch (error) {
        console.error("Gemini Chat Error:", error);
        res.status(500).json({ text: "I'm having trouble connecting to the AI right now. Please try again later." });
    }
});

// 2. Student Dashboard — real data from DB
app.get('/api/dashboard', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        const studentProfile = await StudentProfile.findOne({ user: req.user.id });

        // Get most recently updated active enrollment for "My Learning" widget
        let inProgressCourse = null;
        if (studentProfile) {
            const activeEnrollment = await Enrollment.findOne({
                student: studentProfile._id
            })
                .sort({ updatedAt: -1 })
                .populate('course');

            if (activeEnrollment && activeEnrollment.course) {
                inProgressCourse = {
                    courseId: activeEnrollment.course._id,
                    title: activeEnrollment.course.title,
                    thumbnail: activeEnrollment.course.thumbnail || '',
                    level: activeEnrollment.course.level || 'Beginner',
                    progress: activeEnrollment.progress || 0,
                    completedChapters: activeEnrollment.completedChapters || [],
                    chaptersTotal: activeEnrollment.course.chapters?.length || 0,
                    chapters: activeEnrollment.course.chapters || []
                };
            }
        }

        // AI Interview sessions
        const sessions = await AIInterviewSession.find({ user: req.user.id });
        const totalSessions = sessions.length;
        const completedSessions = sessions.filter(s => s.status === 'Completed' || s.status === 'Evaluated');
        const avgScore = completedSessions.length > 0
            ? Math.round(completedSessions.reduce((sum, s) => sum + (s.overallScore || 0), 0) / completedSessions.length)
            : 0;

        // Interviews this week
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const interviewsThisWeek = sessions.filter(s => new Date(s.createdAt) >= startOfWeek).length;

        // Recent activity from AI sessions
        const recentSessions = await AIInterviewSession.find({ user: req.user.id })
            .sort({ createdAt: -1 }).limit(3);
        const recentActivity = recentSessions.map(s => ({
            id: s._id,
            date: new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            subject: s.focusAreas?.[0] || s.sessionType || 'General',
            score: s.overallScore || 0,
            status: s.overallScore >= 80 ? 'Excellent' : s.overallScore >= 60 ? 'Good' : 'Needs Work'
        }));

        // Also check legacy interview model
        const legacyInterviews = await LegacyInterview.find({ userId: req.user.id });
        const combinedTotal = totalSessions + legacyInterviews.length;
        const legacyAvg = legacyInterviews.length > 0
            ? Math.round(legacyInterviews.reduce((s, i) => s + (i.score || 0), 0) / legacyInterviews.length)
            : 0;
        const finalAvg = combinedTotal > 0
            ? Math.round((avgScore * totalSessions + legacyAvg * legacyInterviews.length) / combinedTotal)
            : 0;

        // Legacy recent activity (merge if needed)
        if (recentActivity.length < 3) {
            const legacyRecent = await LegacyInterview.find({ userId: req.user.id }).sort({ _id: -1 }).limit(3 - recentActivity.length);
            legacyRecent.forEach(i => {
                recentActivity.push({
                    id: i._id,
                    date: i.date,
                    subject: i.subject,
                    score: i.score,
                    status: i.status || (i.score >= 80 ? 'Excellent' : i.score >= 60 ? 'Good' : 'Needs Work')
                });
            });
        }

        // Skills from sessions
        const skillMap = {};
        completedSessions.forEach(s => {
            (s.focusAreas || []).forEach(area => {
                if (!skillMap[area]) skillMap[area] = { total: 0, count: 0 };
                skillMap[area].total += s.overallScore || 0;
                skillMap[area].count += 1;
            });
        });
        const skills = Object.entries(skillMap).map(([subject, data]) => ({
            subject,
            A: Math.round(data.total / data.count),
            fullMark: 150
        }));
        const finalSkills = skills.length >= 3 ? skills : [
            { subject: 'Technical', A: Math.min(finalAvg + 20, 150), fullMark: 150 },
            { subject: 'Communication', A: Math.min(finalAvg + 5, 150), fullMark: 150 },
            { subject: 'Problem Solving', A: Math.min(finalAvg + 10, 150), fullMark: 150 },
            { subject: 'Confidence', A: Math.min(finalAvg + 15, 150), fullMark: 150 },
            { subject: 'Logic', A: Math.min(finalAvg, 150), fullMark: 150 },
        ];

        // Leaderboard
        const leaderboardData = await AIInterviewSession.aggregate([
            { $match: { status: { $in: ['Completed', 'Evaluated'] } } },
            { $group: { _id: '$user', averageScore: { $avg: '$overallScore' }, count: { $sum: 1 } } },
            { $sort: { averageScore: -1 } },
            { $limit: 5 }
        ]);
        const leaderboard = await Promise.all(leaderboardData.map(async (entry) => {
            try {
                const lbUser = await User.findById(entry._id);
                return {
                    name: lbUser ? lbUser.name : "Unknown",
                    course: lbUser ? (lbUser.course || 'N/A') : "N/A",
                    score: Math.round(entry.averageScore)
                };
            } catch (e) { return null; }
        }));

        res.json({
            user: {
                name: user.name,
                course: user.course || studentProfile?.course || 'N/A',
                readiness: finalAvg > 0 ? Math.min(finalAvg + 10, 100) : 50,
                weeklyGoal: studentProfile?.weeklyGoal || 3,
                streak: user.currentStreak || studentProfile?.streak || 0
            },
            stats: [
                { label: "Total Interviews", value: combinedTotal, icon: "Activity", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-500/10", accent: "from-blue-500 to-cyan-500" },
                { label: "Average Score", value: finalAvg, suffix: "%", icon: "Target", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-500/10", accent: "from-purple-500 to-pink-500" },
                { label: "Global Rank", value: "Top 5%", icon: "Trophy", color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-500/10", accent: "from-yellow-500 to-orange-500" },
                { label: "Hours Practiced", value: ((combinedTotal * 0.5)).toFixed(1), suffix: " hrs", icon: "Clock", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/10", accent: "from-emerald-500 to-teal-500" }
            ],
            skills: finalSkills,
            interviewsThisWeek,
            recentActivity,
            leaderboard: leaderboard.filter(l => l !== null),
            inProgressCourse
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: "Server Error" });
    }
});

// 3. User Profile — real data from DB
app.get('/api/user', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        const studentProfile = await StudentProfile.findOne({ user: req.user.id });
        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            course: user.course || studentProfile?.course || '',
            bio: studentProfile?.bio || '',
            phone: studentProfile?.phone || '',
            skills: studentProfile?.skills || [],
            resume: studentProfile?.resume || '',
            resumeName: studentProfile?.resumeName || '',
            cgpa: studentProfile?.cgpa || 0,
            graduationYear: studentProfile?.graduationYear || 0,
            streak: user.currentStreak || studentProfile?.streak || 0,
            weeklyGoal: studentProfile?.weeklyGoal || 2
        });
    } catch (err) {
        console.error('User profile error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/user', verifyToken, async (req, res) => {
    try {
        const { name, course, bio, skills, resumeName, resume } = req.body;

        let user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (name) user.name = name;
        if (course) user.course = course;
        await user.save();

        let parsedSkills = [];
        if (Array.isArray(skills)) {
            parsedSkills = skills;
        } else if (typeof skills === 'string') {
            parsedSkills = skills.split(',').map(s => s.trim()).filter(Boolean);
        }

        const profileData = {
            course: course || user.course,
            bio: bio !== undefined ? bio : undefined,
            skills: parsedSkills.length > 0 ? parsedSkills : undefined,
            resumeName: resumeName !== undefined ? resumeName : undefined,
            resume: resume !== undefined ? resume : undefined
        };

        // Remove undefined fields
        Object.keys(profileData).forEach(key => profileData[key] === undefined && delete profileData[key]);

        const studentProfile = await StudentProfile.findOneAndUpdate(
            { user: req.user.id },
            { $set: profileData },
            { new: true, upsert: true }
        );

        res.json({ success: true, user, studentProfile });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// 4. Authentication Routes (Login, CurrentUser, Logout)
app.get('/api/me', (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Access denied. Please login.' });
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'campus_recruit_jwt_secret_2026_secure_key');
        res.json({ id: verified.id, name: verified.name || "User", email: verified.email || "" });
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Please provide email and password' });

        const user = await User.findOne({ email }).select('+password');
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const isMatch = await user.matchPassword(password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

        // Block pending employee accounts
        if (user.role === 'employee' && !user.isVerified) {
            return res.status(403).json({ error: 'Your account is awaiting admin approval. Please check back later.' });
        }

        const token = user.getSignedJwtToken();
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });

        res.status(200).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server Error', message: err.message, stack: err.stack });
    }
});

app.get('/api/currentuser', verifyToken, async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'Not authorized' });
        }
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.status(200).json(user);
    } catch (err) {
        console.error('Current user error:', err);
        res.status(500).json({ error: 'Server Error' });
    }
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
});

// 4a. Student Registration
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password, course } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Please provide name, email and password' });
        }
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ error: 'Email already in use' });

        const user = await User.create({
            name,
            email,
            password,
            role: 'student',
            course: course || '',
            isVerified: true
        });

        // Auto-create StudentProfile
        await StudentProfile.create({
            user: user._id,
            course: course || ''
        });

        const token = user.getSignedJwtToken();
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });

        res.status(201).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: err.message || 'Server error' });
    }
});

// 4b. Employee Registration (creates a pending account, awaiting admin approval)
app.post('/api/employee/register', async (req, res) => {
    try {
        const { name, email, password, department } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Please provide name, email and password' });
        }
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ error: 'Email already in use' });

        await User.create({
            name,
            email,
            password,
            role: 'employee',
            course: department || '',
            isVerified: false // Pending admin approval
        });

        res.status(201).json({ success: true, message: 'Registration request submitted. An admin will review your account.' });
    } catch (err) {
        console.error('Employee register error:', err);
        res.status(500).json({ error: err.message || 'Server error' });
    }
});

// 5. Weekly Goal
app.post('/api/user/goal', verifyToken, async (req, res) => {
    try {
        const { weeklyGoal } = req.body;
        await StudentProfile.findOneAndUpdate(
            { user: req.user.id },
            { weeklyGoal },
            { upsert: true, new: true }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save goal' });
    }
});

// 6. Study Resources
app.get('/api/resources', async (req, res) => {
    try {
        const resources = await StudyResource.find().sort({ createdAt: -1 });
        res.json(resources);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 7. Start Interview (shorthand)
app.post('/api/start-interview', async (req, res) => {
    try {
        const interviewId = `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        res.status(200).json({ success: true, message: "Interview session initialized", interviewId });
    } catch (error) {
        res.status(500).json({ message: "Failed to start interview", error: error.message });
    }
});

// 8. Legacy Interview Routes (backward compat)
app.get('/api/interviews/legacy', async (req, res) => {
    try {
        const interviews = await LegacyInterview.find().sort({ _id: -1 });
        res.json(interviews);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch history" });
    }
});

app.post('/api/interviews/legacy', async (req, res) => {
    try {
        const { subject, score, status, userId } = req.body;
        const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        await LegacyInterview.create({ userId: userId || 'guest', date, subject, score, status });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to save interview" });
    }
});

// ─── Mount Route Files ───────────────────────────────────────
const interviewRoutes = require('./routes/interviewRoutes');
app.use('/api/interviews', interviewRoutes);

const courseRoutes = require('./routes/courseRoutes');
app.use('/api/courses', courseRoutes);

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const aiInterviewRoutes = require('./routes/aiInterviewRoutes');
app.use('/api/ai-interview', verifyToken, aiInterviewRoutes);

// New dynamic routes
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

const companyRoutes = require('./routes/companyRoutes');
app.use('/api/company', optionalAuth, companyRoutes);

const jobRoutes = require('./routes/jobRoutes');
app.use('/api/jobs', optionalAuth, jobRoutes);

const communityRoutes = require('./routes/communityRoutes');
app.use('/api/community', optionalAuth, communityRoutes);

// New dynamic route for notifications
const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);

// Create HTTP server and attach Socket.io
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177'],
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

// Make socket.io available in routes
app.set('socketio', io);

io.on('connection', (socket) => {
    socket.on('join_room', (data) => {
        if (typeof data === 'string') {
            socket.join(data);
            console.log(`User ${data} joined their notification room via socket ${socket.id}`);
        } else if (data && data.userId) {
            socket.join(data.userId);
            if (data.role) {
                socket.join(`role:${data.role}`);
            }
            console.log(`User ${data.userId} and role ${data.role} joined rooms via socket ${socket.id}`);
        }
    });

    socket.on('disconnect', () => {
        // Automatically handled
    });
});

// Server startup moved to startServer() at the top


// Start Server after all middleware and routes are mounted
startServer();