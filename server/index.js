require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');

// Import models from /models (single source of truth)
const Student = require('./models/Student');
const Admin = require('./models/Admin');
const Employee = require('./models/Employee');
const CompanyUser = require('./models/CompanyUser');
const CompanyProfile = require('./models/CompanyProfile');
const User = require('./models/User'); // Keep for legacy if needed or phase out
const StudentProfile = require('./models/StudentProfile');
const AIInterviewSession = require('./models/AIInterviewSession');
const StudyResource = require('./models/StudyResource');
const LegacyInterview = require('./models/LegacyInterview');
const Enrollment = require('./models/Enrollment');
const Streak = require('./models/Streak');

// Import routes
const authRoutes = require('./routes/authRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const courseRoutes = require('./routes/courseRoutes');
const aiInterviewRoutes = require('./routes/aiInterviewRoutes');
const adminRoutes = require('./routes/adminRoutes');
const companyRoutes = require('./routes/companyRoutes');
const jobRoutes = require('./routes/jobRoutes');
const communityRoutes = require('./routes/communityRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const streakController = require('./controllers/streakController');

const { protect } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5001;

// Helper to get model by role
const getModelByRole = (role) => {
    const normalizedRole = (role || '').toLowerCase();
    switch (normalizedRole) {
        case 'student': return Student;
        case 'admin': return Admin;
        case 'employee': return Employee;
        case 'company': return CompanyUser;
        default: 
            console.warn(`⚠️ [ModelResolver] Unknown role: ${role}, falling back to legacy User model`);
            return User;
    }
};

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
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

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

// Use centralized protect middleware from middleware/authMiddleware.js

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

// ─── Sanitizer Helper ──────────────────────────────────────────
const sanitizeError = (err) => {
    if (err.name === 'ValidationError') {
        // Map through errors and remove the "Value" part which contains the raw input (unsafe for passwords)
        const messages = Object.values(err.errors).map(val => {
            let msg = val.message;
            // Specifically target "Path `field` (raw_value) is shorter than minimum" patterns
            return msg.replace(/\(`[^`]*`\)\s*/g, '').trim(); 
        });
        return messages.join(', ');
    }
    return err.message || 'Server Error';
};

// ─── Streak Helper ──────────────────────────────────────────
const recordActivity = async (userId, activityType = 'heartbeat') => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        await Streak.findOneAndUpdate({ user: userId, date: today }, { $set: { activityType } }, { upsert: true });
        
        // Find user across collections
        let userFound = await Student.findById(userId) || await Admin.findById(userId) || await Employee.findById(userId) || await CompanyUser.findById(userId) || await User.findById(userId);
        
        if (!userFound) return;
        const lastActive = userFound.lastActiveDate ? new Date(userFound.lastActiveDate) : null;
        if (lastActive) lastActive.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (!lastActive) userFound.currentStreak = 1;
        else if (lastActive.getTime() === yesterday.getTime()) userFound.currentStreak += 1;
        else if (lastActive.getTime() < yesterday.getTime()) userFound.currentStreak = 1;

        userFound.lastActiveDate = new Date();
        await userFound.save();
        if (userFound.role === 'student') {
            await StudentProfile.findOneAndUpdate({ user: userId }, { $set: { streak: userFound.currentStreak } });
        }
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

app.get('/api/dashboard', protect, async (req, res) => {
    try {
        recordActivity(req.user.id, 'heartbeat');
        const userFound = await Student.findById(req.user.id);
        if (!userFound) return res.status(404).json({ error: "Student not found" });
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

        // Leaderboard simplified (only for students, across all students)
        const leaderboardData = await AIInterviewSession.aggregate([{ $match: { status: { $in: ['Completed', 'Evaluated'] } } }, { $group: { _id: '$user', avg: { $avg: '$overallScore' } } }, { $sort: { avg: -1 } }, { $limit: 5 }]);
        const leaderboard = await Promise.all(leaderboardData.map(async entry => {
            const u = await Student.findById(entry._id);
            return { name: u?.name || 'Unknown', course: u?.course || 'N/A', score: Math.round(entry.avg) };
        }));

        res.json({
            user: { name: userFound.name, course: userFound.course || studentProfile?.course || 'N/A', readiness: avgScore || 50, streak: userFound.currentStreak || 0 },
            stats: [
                { label: "Total Interviews", value: totalSessions, icon: "Activity", color: "text-blue-600" },
                { label: "Average Score", value: avgScore, suffix: "%", icon: "Target", color: "text-purple-600" }
            ],
            interviewsThisWeek,
            leaderboard: leaderboard.filter(Boolean)
        });
    } catch (e) { res.status(500).json({ error: "Server Error" }); }
});

app.get('/api/resources', async (req, res) => {
    try {
        const resources = await StudyResource.find({});
        res.json(resources);
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

app.get(['/api/me', '/api/currentuser', '/api/user'], protect, async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const role = req.user.role;
        
        console.log(`🔍 [Auth] Checking user with ID: ${userId}, role: ${role}`);

        if (!userId) {
            console.warn('⚠️ [Auth] No userID found in req.user:', req.user);
            return res.status(401).json({ error: 'Not authorized, token missing ID' });
        }

        const UserModel = getModelByRole(role);
        console.log(`📂 [Auth] Selected model: ${UserModel.modelName} for role: ${role}`);

        const user = await UserModel.findById(userId).select('-password');
        
        if (user && role === 'company' && user.status !== 'approved') {
            console.warn(`🛑 [Auth] Denying session for unapproved company: ${user.name} (${user.status})`);
            return res.status(403).json({ error: 'Access denied. Account not approved.', status: user.status });
        }

        if (!user) {
            console.warn(`⚠️ [Auth] User not found in database. Search ID: ${userId}, Model: ${UserModel.modelName}`);
            // Fallback: Check all models if not found in primary
            const allModels = [Student, Admin, Employee, CompanyUser, User];
            let foundUser = null;
            let foundModel = null;
            for (const M of allModels) {
                if (M.modelName === UserModel.modelName) continue;
                foundUser = await M.findById(userId).select('-password');
                if (foundUser) {
                    foundModel = M.modelName;
                    break;
                }
            }

            if (foundUser) {
                console.info(`✅ [Auth] User found in ALTERNATIVE model: ${foundModel}. Token role (${role}) might be incorrect.`);
                foundUser.roleWarning = `Token role mismatch: expected ${foundModel}, got ${role}`;
                if (role === 'student' || foundModel === 'Student') {
                    const studentProfile = await StudentProfile.findOne({ user: userId }).lean();
                    if (studentProfile) foundUser.profile = studentProfile;
                }
                return res.status(200).json(foundUser);
            }

            return res.status(404).json({ error: 'User not found in any collection' });
        }

        if (role === 'student' || UserModel.modelName === 'Student') {
            const studentProfile = await StudentProfile.findOne({ user: userId }).lean();
            if (studentProfile) user.profile = studentProfile;
        }

        // Record Streak Activity
        await streakController.recordDailyActivity(user, UserModel.modelName);

        res.status(200).json(user);
    } catch (err) {
        console.error('❌ [Auth] Current user route error:', err);
        res.status(500).json({ error: sanitizeError(err) });
    }
});

// Redundant routes removed, using /api/auth routes instead

app.post('/api/employee/register', async (req, res) => {
    try {
        const { name, email, password, department } = req.body;
        
        // Check uniqueness
        const models = [Student, Admin, Employee, CompanyUser, User];
        for (const Model of models) {
            if (await Model.findOne({ email })) {
                return res.status(400).json({ error: 'Email already exists' });
            }
        }

        await Employee.create({ 
            name, email, password, role: 'employee', course: department || '', isVerified: false 
        });
        res.status(201).json({ success: true, message: 'Awaiting admin approval.' });
    } catch (err) { 
        console.error('Employee registration error:', err);
        res.status(500).json({ error: sanitizeError(err) }); 
    }
});

app.post('/api/company/register', async (req, res) => {
    try {
        const { name, email, password, location, employeeCount, ownerEmail, hrEmail, industry, website, description } = req.body;
        
        // Check uniqueness across all models
        const models = [Student, Admin, Employee, CompanyUser, User];
        for (const Model of models) {
            if (await Model.findOne({ email })) {
                return res.status(400).json({ error: 'Email already exists' });
            }
        }

        const company = await CompanyUser.create({ 
            name, email, password, 
            location, employeeCount, ownerEmail, hrEmail, 
            industry, website, description 
        });
        
        // Auto-create basic profile
        await CompanyProfile.create({ 
            userId: company._id, 
            companyName: name,
            location: location,
            industry: industry || '',
            description: description || ''
        });
        
        res.status(201).json({ 
            success: true, 
            message: 'Registration successful! Your account is now awaiting employee approval. You will be able to login once verified.' 
        });
    } catch (err) { 
        console.error('Company registration error:', err);
        res.status(500).json({ error: sanitizeError(err) }); 
    }
});

// ─── Company Approval Routes (Employee Only) ────────────────
app.get('/api/employee/pending-companies', protect, async (req, res) => {
    try {
        if (req.user.role !== 'employee' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized access' });
        }
        const pendingCompanies = await CompanyUser.find({ status: 'pending' }).select('-password');
        res.json(pendingCompanies);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch pending companies' });
    }
});

app.post('/api/employee/verify-company/:id', protect, async (req, res) => {
    try {
        if (req.user.role !== 'employee' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized access' });
        }
        const { status } = req.body; // 'approved' or 'rejected'
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        const company = await CompanyUser.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!company) return res.status(404).json({ error: 'Company not found' });
        
        res.json({ success: true, message: `Company ${status} successfully`, company });
    } catch (err) {
        res.status(500).json({ error: 'Verification failed' });
    }
});

app.post('/api/logout', (req, res) => { 
    res.clearCookie('cr_token'); 
    res.clearCookie('token'); 
    res.clearCookie('student_token');
    res.clearCookie('company_token');
    res.clearCookie('admin_token');
    res.clearCookie('employee_token');
    res.json({ success: true }); 
});

// Debugging Route
app.get('/api/test-auth', (req, res) => res.json({ message: "Auth API is reachable", time: new Date().toISOString() }));

// ─── Route Mounts ──────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/ai-interview', aiInterviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/notifications', notificationRoutes);

// Detailed 404 Catch-all
app.use((req, res) => {
    console.log(`🚫 [404] Not Found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        error: "Route not found",
        method: req.method,
        path: req.originalUrl,
        serverTime: new Date().toISOString(),
        tip: "Ensure your frontend is hitting the correct port (5001) and path (/api/auth/register)"
    });
});

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