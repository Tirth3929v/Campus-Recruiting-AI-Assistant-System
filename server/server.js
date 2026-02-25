require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: 'http://localhost:5173', // Your Vite frontend URL
    credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Increased limit for resume uploads
app.use(cookieParser());

// Initialize Gemini
// Make sure GEMINI_API_KEY is in your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: "You are a helpful, encouraging Placement Assistant and Technical Tutor for Campus Recruit. Answer questions about coding, interviews, and platform navigation concisely."
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus_recruit')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define Interview Model
const interviewSchema = new mongoose.Schema({
    userId: String,
    date: String,
    subject: String,
    score: Number,
    status: String
});

const Interview = mongoose.model('Interview', interviewSchema);

// Define User Model (Simplified for Dashboard)
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    course: String,
    weeklyGoal: Number,
    // Add other fields as needed
});
const User = mongoose.model('User', userSchema);

// Auth Middleware
const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Access denied' });
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_123');
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ error: 'Invalid token' });
    }
};

// --- Routes ---

// 1. AI Chat Route
app.post('/api/chat', async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!process.env.GEMINI_API_KEY) {
            console.error("GEMINI_API_KEY is missing in .env");
            return res.status(500).json({ text: "Server Error: AI configuration missing." });
        }

        // Format history for Gemini (it expects 'parts' array)
        const chatHistory = (history || []).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        const chat = model.startChat({
            history: chatHistory,
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();
        
        res.json({ text });
    } catch (error) {
        console.error("Gemini Chat Error:", error);
        res.status(500).json({ text: "I'm having trouble connecting to the AI right now. Please try again later." });
    }
});

// 2. Dashboard Data (Mock)
app.get('/api/dashboard', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        const totalInterviews = await Interview.countDocuments({ userId: req.user.id });
        const recentActivity = await Interview.find({ userId: req.user.id }).sort({ _id: -1 }).limit(3);
        
        // Calculate interviews this week
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        startOfWeek.setHours(0,0,0,0);
        const interviewsThisWeek = await Interview.countDocuments({ 
            userId: req.user.id, 
            date: { $gte: startOfWeek.toLocaleDateString() } // Simplified date check
        });

        // Calculate User Average Score
        const userStats = await Interview.aggregate([
            { $match: { userId: req.user.id } },
            { $group: { _id: null, avgScore: { $avg: "$score" } } }
        ]);
        const avgScore = userStats.length > 0 ? Math.round(userStats[0].avgScore) : 0;

        // Calculate Leaderboard
        const leaderboardData = await Interview.aggregate([
            {
                $group: {
                    _id: "$userId",
                    averageScore: { $avg: "$score" },
                    totalInterviews: { $sum: 1 }
                }
            },
            { $match: { _id: { $ne: 'guest' } } },
            { $sort: { averageScore: -1 } },
            { $limit: 5 }
        ]);

        const leaderboard = await Promise.all(leaderboardData.map(async (entry) => {
            try {
                const lbUser = await User.findById(entry._id);
                return {
                    name: lbUser ? lbUser.name : "Unknown",
                    course: lbUser ? lbUser.course : "N/A",
                    score: Math.round(entry.averageScore)
                };
            } catch (e) { return null; }
        }));

        res.json({
            user: { ...user.toObject(), readiness: avgScore > 0 ? avgScore + 10 : 50 },
            stats: [
                { label: "Total Interviews", value: totalInterviews.toString(), icon: "Activity", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-500/10" },
                { label: "Average Score", value: `${avgScore}%`, icon: "Target", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-500/10" },
                { label: "Global Rank", value: "Top 5%", icon: "Trophy", color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-500/10" },
                { label: "Hours Practiced", value: `${(totalInterviews * 0.5).toFixed(1)} hrs`, icon: "Clock", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/10" }
            ],
            interviewsThisWeek,
            recentActivity,
            leaderboard: leaderboard.filter(l => l !== null)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
    }
});

// 3. User Profile (Mock)
app.get('/api/user', (req, res) => {
    res.json({
        name: "Tirth",
        email: "tirth@example.com",
        course: "BCA",
        bio: "Aspiring Full Stack Developer"
    });
});

// 4. Interview History Routes
app.get('/api/interviews', async (req, res) => {
    try {
        // In a real app, you would filter by req.user.id from auth middleware
        const interviews = await Interview.find().sort({ _id: -1 });
        res.json(interviews);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch history" });
    }
});

app.post('/api/interviews', async (req, res) => {
    try {
        const { subject, score, status, userId } = req.body;
        const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        await Interview.create({ userId: userId || 'guest', date, subject, score, status });
        res.json({ success: true });
    } catch (error) {
        console.error("Save Error:", error);
        res.status(500).json({ error: "Failed to save interview" });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});