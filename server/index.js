require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieSession = require('cookie-session');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 5000;

// 1. Database Setup (MongoDB)
// Connect to local MongoDB instance. 'campus_recruit' will be the database name in Compass.
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus_recruit')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- Import Models ---
const User = require('./models/User');
const Job = require('./models/Job');
const Course = require('./models/Course');
const CompanyProfile = require('./models/CompanyProfile');
// Note: Interview, Post, Comment, etc. are still inline below, you can move them to separate files later.

const interviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: String,
  subject: String,
  score: Number,
  status: String
});

const postSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  author: String,
  course: String,
  content: String,
  likes: { type: Number, default: 0 },
  timestamp: String
});

const commentSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  author: String,
  content: String,
  timestamp: String
});

const ticketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  email: String,
  subject: String,
  message: String,
  status: { type: String, default: 'Open' },
  timestamp: String
});

const messageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sender: String,
  text: String,
  timestamp: String
});

// --- Models ---
const Interview = mongoose.model('Interview', interviewSchema);
const Post = mongoose.model('Post', postSchema);
const Comment = mongoose.model('Comment', commentSchema);
const SupportTicket = mongoose.model('SupportTicket', ticketSchema);
const Message = mongoose.model('Message', messageSchema);

// Mock Data for Dynamic Questions (In a real app, this would be in the DB)
const questionBank = {
  'React': [
    { id: 1, question: "What is the Virtual DOM in React?", answer: "The Virtual DOM is a lightweight copy of the actual DOM. React uses it to identify changes (diffing) and efficiently update the real DOM (reconciliation) only where necessary.", keywords: ["lightweight", "copy", "diffing", "reconciliation", "efficient"] },
    { id: 2, question: "Explain the difference between state and props.", answer: "State is internal data managed by the component itself and can change over time. Props are external data passed to the component from its parent and are read-only (immutable).", keywords: ["internal", "managed by component", "external", "passed from parent", "immutable", "read-only"] },
    { id: 3, question: "What is the purpose of the useEffect hook?", answer: "useEffect is used to perform side effects in functional components, such as data fetching, subscriptions, or manually changing the DOM. It runs after the render.", keywords: ["side effects", "functional components", "data fetching", "after render"] }
  ],
  'Node.js': [
    { id: 4, question: "What is the event loop in Node.js?", answer: "The event loop allows Node.js to perform non-blocking I/O operations despite the fact that JavaScript is single-threaded.", keywords: ["event loop", "non-blocking", "single-threaded"] },
    { id: 5, question: "Explain middleware in Express.", answer: "Middleware functions are functions that have access to the request object (req), the response object (res), and the next middleware function in the application’s request-response cycle.", keywords: ["request", "response", "next", "cycle"] }
  ],
  'Java': [
    { id: 6, question: "What is the difference between JDK, JRE, and JVM?", answer: "JDK is the development kit, JRE is the runtime environment, and JVM is the virtual machine that executes the bytecode.", keywords: ["development", "runtime", "virtual machine"] }
  ],
  'System Design': [
    { id: 7, question: "How would you design a URL shortening service?", answer: "Key concepts include hashing, database schema (mapping short to long URL), handling collisions, and scaling read/write operations.", keywords: ["hashing", "database", "scaling"] }
  ]
};

// 2. Middleware
app.use(cookieParser());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
    'http://127.0.0.1:5176'
  ],
  credentials: true
}));
app.use(express.json({ limit: '50mb' })); // Increased limit for resume uploads

// Helper: Hash Password
const hash = (pass) => crypto.createHash('sha256').update(pass).digest('hex');

// Seed Default Admin User
const seedAdmin = async () => {
  try {
    // Delete existing admin and create fresh every time server starts
    await User.deleteOne({ email: 'admin@campus.com' });
    
    await User.create({
      name: 'Admin',
      email: 'admin@campus.com',
      password: 'Admin@123!',
      course: 'System Administrator'
    });
    console.log("Default admin created: admin@campus.com / Admin@123!");
  } catch (err) {
    console.error("Failed to seed admin:", err);
  }
};
seedAdmin();

// --- Auth Middleware ---
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

// 3. Routes

// Register
app.post('/api/register', async (req, res) => {
  const { name, email, password, course } = req.body;
  try {
    const user = await User.create({ name, email, password, course });
    res.json({ success: true, userId: user._id });
  } catch (err) {
    res.status(400).json({ error: 'User already exists' });
  }
});

// --- SIGN UP ROUTE ---
app.post('/api/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 1. Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // 2. Encrypt (Hash) the password

    // 3. Create the new user object
    const newUser = new User({
      name: username, // Mapping username to existing 'name' field
      email,
      password, // Mapping password to existing 'password' field
      role: 'user'
    });

    // 4. Save to MongoDB
    await newUser.save();

    res.status(201).json({ message: 'User created successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  // 1. Add this line to see exactly what React is sending:
  console.log("Incoming Login Data:", req.body);
  const { email, password } = req.body;
  
  console.log('Login request received:', { email, body: req.body });
  
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: 'Request body is empty. Ensure Content-Type is application/json.' });
  }

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password' });
  }

  try {
    // 1. Find user
    const user = await User.findOne({ email }).select('+password');
    // 2. Add this line to see if the database is actually finding the user:
    console.log("Database Search Result:", user);
    console.log('User found:', user ? user.email : 'null');
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    if (!user.password) {
      console.error('User found but no password field present');
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // 2. Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // 3. Generate JWT
    const payload = { id: user._id, username: user.name, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret_key_123', { expiresIn: '24h' });

    // 4. Set HTTP-only Cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true in production
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    res.json({ 
      success: true, 
      user: { id: user._id, name: user.name, email: user.email, role: user.role } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout
app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

// Forgot Password
app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user) {
      // In a real app, generate token and send email here
      res.json({ success: true, message: 'Password reset link sent to your email.' });
    } else {
      res.json({ success: true, message: 'If an account exists, a reset link has been sent.' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Current User (Protected Test Route)
app.get('/api/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Alias for /api/currentuser (for frontend compatibility)
app.get('/api/currentuser', async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json(null);
  }
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_123');
    const user = await User.findById(verified.id).select('-password');
    res.json(user);
  } catch (err) {
    res.json(null);
  }
});

// Get Dashboard Data
app.get('/api/dashboard', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('name course streak weeklyGoal');
    const activities = await Interview.find({ userId: req.user.id }).sort({ _id: -1 }).limit(3);
    const totalInterviews = await Interview.countDocuments({ userId: req.user.id });
    
    // Calculate Leaderboard (Top 5 by Average Score)
    const leaderboard = await Interview.aggregate([
      {
        $group: {
          _id: "$userId",
          avgScore: { $avg: "$score" }
        }
      },
      { $sort: { avgScore: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          name: "$user.name",
          course: "$user.course",
          score: { $toInt: "$avgScore" }
        }
      }
    ]);

    // Calculate Interviews This Week
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const allInterviews = await Interview.find({ userId: req.user.id }).select('date');
    const interviewsThisWeek = allInterviews.filter(i => new Date(i.date) >= startOfWeek).length;

    let finalLeaderboard = leaderboard;
    if (finalLeaderboard.length === 0) {
      finalLeaderboard = [
        { name: "Alice Johnson", course: "B.Tech CS", score: 98 },
        { name: "Bob Smith", course: "BCA Final", score: 92 },
        { name: "Charlie Davis", course: "MCA", score: 88 },
        { name: "Diana Evans", course: "B.Tech IT", score: 85 },
        { name: "Ethan Hunt", course: "BCA Second", score: 82 }
      ];
    }

    // Map _id to id for frontend compatibility
    const mappedActivities = activities.map(a => ({ ...a.toObject(), id: a._id }));

    res.json({
      user: { ...user.toObject(), readiness: 85 },
      stats: [
        { label: "Total Interviews", value: totalInterviews.toString(), icon: "Activity", color: "text-blue-400", bg: "bg-blue-500/10" },
        { label: "Average Score", value: "78%", icon: "Target", color: "text-purple-400", bg: "bg-purple-500/10" },
        { label: "Global Rank", value: "Top 5%", icon: "Trophy", color: "text-yellow-400", bg: "bg-yellow-500/10" },
        { label: "Hours Practiced", value: "4.5 hrs", icon: "Clock", color: "text-emerald-400", bg: "bg-emerald-500/10" }
      ],
      skills: [
        { subject: 'Technical', A: 120, fullMark: 150 },
        { subject: 'Communication', A: 86, fullMark: 150 },
        { subject: 'Confidence', A: 99, fullMark: 150 },
        { subject: 'Body Language', A: 85, fullMark: 150 },
        { subject: 'Logic', A: 85, fullMark: 150 },
      ],
      recentActivity: mappedActivities,
      leaderboard: finalLeaderboard,
      interviewsThisWeek
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Profile
app.get('/api/user', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('name email phone course bio skills resume resumeName twoFactorEnabled emailNotifications pushNotifications');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Interview History
app.get('/api/interviews', verifyToken, async (req, res) => {
  try {
    const interviews = await Interview.find({ userId: req.user.id }).sort({ _id: -1 });
    res.json(interviews);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Save Interview Result
app.post('/api/interviews', verifyToken, async (req, res) => {
  const { subject, score, status } = req.body;
  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  
  try {
    await Interview.create({ userId: req.user.id, date, subject, score, status });
    res.json({ success: true });
  } catch (err) {
    console.error("Error saving interview:", err);
    res.status(500).json({ error: 'Failed to save interview' });
  }
});

// Update Profile
app.put('/api/user', verifyToken, async (req, res) => {
  const { name, phone, course, bio, skills, resume, resumeName, twoFactorEnabled, emailNotifications, pushNotifications } = req.body;
  
  try {
    await User.findByIdAndUpdate(req.user.id, {
      name, phone, course, bio, skills, resume, resumeName,
      twoFactorEnabled: twoFactorEnabled ? 1 : 0,
      emailNotifications: emailNotifications ? 1 : 0,
      pushNotifications: pushNotifications ? 1 : 0
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Change Password
app.put('/api/user/password', verifyToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  try {
    const user = await User.findOne({ _id: req.user.id });
    
    // Verify current password with bcrypt
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Incorrect current password' });

    user.password = newPassword;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete Account
app.delete('/api/user', verifyToken, async (req, res) => {
  const userId = req.user.id;
  
  try {
    await Interview.deleteMany({ userId });
    await Post.deleteMany({ userId });
    await Comment.deleteMany({ userId });
    await SupportTicket.deleteMany({ userId });
    await Message.deleteMany({ userId });
    await User.findByIdAndDelete(userId);
    
    res.clearCookie('token');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update Weekly Goal
app.post('/api/user/goal', verifyToken, async (req, res) => {
  const { weeklyGoal } = req.body;
  try {
    await User.findByIdAndUpdate(req.user.id, { weeklyGoal });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Community Posts
app.get('/api/posts', verifyToken, async (req, res) => {
  try {
    const posts = await Post.aggregate([
      { $sort: { _id: -1 } },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "postId",
          as: "comments"
        }
      },
      {
        $addFields: {
          commentsCount: { $size: "$comments" },
          id: "$_id"
        }
      },
      { $project: { comments: 0, _id: 0 } }
    ]);
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create Post
app.post('/api/posts', verifyToken, async (req, res) => {
  const { content } = req.body;
  const date = new Date().toLocaleString();
  
  try {
    const user = await User.findById(req.user.id);
    const post = await Post.create({
      userId: req.user.id,
      author: user.name,
      course: user.course,
      content,
      timestamp: date
    });
    
    res.json({ success: true, id: post._id, author: user.name, course: user.course, timestamp: date, likes: 0 });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Like Post
app.post('/api/posts/:id/like', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    await Post.findByIdAndUpdate(id, { $inc: { likes: 1 } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Comments for a Post
app.get('/api/posts/:id/comments', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const comments = await Comment.find({ postId: id }).sort({ _id: 1 });
    const mappedComments = comments.map(c => ({ ...c.toObject(), id: c._id }));
    res.json(mappedComments);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add Comment
app.post('/api/posts/:id/comments', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const date = new Date().toLocaleString();
  
  try {
    const user = await User.findById(req.user.id);
    const comment = await Comment.create({
      postId: id,
      userId: req.user.id,
      author: user.name,
      content,
      timestamp: date
    });
    
    res.json({ success: true, id: comment._id, author: user.name, content, timestamp: date });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Questions by Subject
app.get('/api/questions', (req, res) => {
  const { subject } = req.query;
  const questions = questionBank[subject] || questionBank['React'];
  res.json(questions);
});

// Generate Questions from Resume
app.post('/api/generate-questions', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user || !user.resume) {
      return res.status(400).json({ error: 'No resume found. Please upload one in Profile Settings.' });
    }

    // 1. Try Gemini API if Key exists
    if (process.env.GEMINI_API_KEY) {
      try {
        const skills = user.skills || 'General';
        const prompt = `Generate 5 interview questions for a candidate with these skills: ${skills}. Return ONLY a raw JSON array (no markdown code blocks) of objects with keys: id (unique string), question (string), type (string: "technical", "behavioral", or "experience").`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        const data = await response.json();
        if (data.candidates && data.candidates[0].content) {
          const text = data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
          const questions = JSON.parse(text);
          return res.json(questions);
        }
      } catch (err) {
        console.error("Gemini API failed, falling back to mock data:", err);
      }
    }

    // Simulate Resume Analysis
    const skills = user.skills ? user.skills.toLowerCase() : '';
    let generatedQuestions = [
      { id: 'r1', question: "Walk me through the most impressive project listed on your resume.", type: "experience" },
      { id: 'r2', question: "I noticed a gap in your timeline. Can you explain that?", type: "behavioral" }
    ];

    if (skills.includes('react')) {
      generatedQuestions.push({ id: 'r3', question: "I see React on your resume. Explain the Virtual DOM and how it improves performance.", type: "technical" });
    }
    if (skills.includes('node')) {
      generatedQuestions.push({ id: 'r4', question: "How have you used Node.js in your past projects to handle asynchronous operations?", type: "technical" });
    }
    if (skills.includes('python')) {
      generatedQuestions.push({ id: 'r5', question: "Describe a Python script you wrote to automate a task.", type: "technical" });
    }

    res.json(generatedQuestions);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Analyze Answer with Gemini
app.post('/api/analyze-answer', verifyToken, async (req, res) => {
  const { question, userAnswer, subject } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.json({ feedback: "Good attempt (Mock Analysis)", score: 7, status: "Good" });
  }

  try {
    const prompt = `
      You are an expert technical interviewer for a ${subject} role.
      Evaluate the following candidate answer.
      
      Question: "${question}"
      Candidate Answer: "${userAnswer}"
      
      Return ONLY a raw JSON object (no markdown formatting) with these fields:
      - feedback: A concise, constructive feedback string (max 30 words).
      - score: An integer from 0 to 10.
      - status: One of ["Outstanding", "Excellent", "Good", "Average", "Needs Improvement"].
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();
    if (data.candidates && data.candidates[0].content) {
      const text = data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
      return res.json(JSON.parse(text));
    }
    throw new Error("No content from Gemini");
  } catch (err) {
    console.error("Gemini analysis failed:", err);
    res.json({ feedback: "Could not analyze at this time.", score: 5, status: "Average" });
  }
});

// Contact Support
app.post('/api/contact', verifyToken, async (req, res) => {
  const { subject, message } = req.body;
  const date = new Date().toLocaleString();
  
  try {
    const user = await User.findById(req.user.id);
    await SupportTicket.create({
      userId: req.user.id,
      name: user.name,
      email: user.email,
      subject,
      message,
      timestamp: date
    });
    
    res.json({ success: true, message: 'Support ticket created successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Chat Messages
app.get('/api/messages', verifyToken, async (req, res) => {
  try {
    const messages = await Message.find({ userId: req.user.id }).sort({ _id: 1 });
    const mappedMessages = messages.map(m => ({ ...m.toObject(), id: m._id }));
    res.json(mappedMessages);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Send Chat Message
app.post('/api/messages', verifyToken, async (req, res) => {
  const { text } = req.body;
  const date = new Date().toLocaleString();
  
  try {
    const message = await Message.create({
      userId: req.user.id,
      sender: 'user',
      text,
      timestamp: date
    });
    
    // Simulate Support Reply
    setTimeout(async () => {
      const replyDate = new Date().toLocaleString();
      await Message.create({
        userId: req.user.id,
        sender: 'support',
        text: "Thanks for reaching out! An agent will be with you shortly.",
        timestamp: replyDate
      });
    }, 3000);

    res.json({ success: true, id: message._id, sender: 'user', text, timestamp: date });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Get All Users
app.get('/api/admin/users', verifyToken, async (req, res) => {
  try {
    const users = await User.find().select('name email course streak');
    const mappedUsers = users.map(u => ({ ...u.toObject(), id: u._id }));
    res.json(mappedUsers);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Get All Tickets
app.get('/api/admin/tickets', verifyToken, async (req, res) => {
  try {
    const tickets = await SupportTicket.find().sort({ _id: -1 });
    const mappedTickets = tickets.map(t => ({ ...t.toObject(), id: t._id }));
    res.json(mappedTickets);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Update Ticket Status
app.put('/api/admin/tickets/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await SupportTicket.findByIdAndUpdate(id, { status });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Get Dashboard Stats
app.get('/api/admin/stats', verifyToken, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalInterviews = await Interview.countDocuments();
    const totalPosts = await Post.countDocuments();
    const totalTickets = await SupportTicket.countDocuments();
    const recentUsers = await User.find().sort({ _id: -1 }).limit(5).select('name email createdAt');
    const recentInterviews = await Interview.find().sort({ _id: -1 }).limit(5).populate('userId', 'name');
    res.json({
      totalUsers, totalInterviews, totalPosts, totalTickets,
      recentUsers: recentUsers.map(u => ({ ...u.toObject(), id: u._id })),
      recentInterviews: recentInterviews.map(i => ({ ...i.toObject(), id: i._id, userName: i.userId ? i.userId.name : 'Unknown' }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Jobs
app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await Job.find({ status: 'Open' }).populate('company', 'companyName logo location').sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Courses
app.get('/api/courses', async (req, res) => {
  try {
    const { search, category, level } = req.query;
    const query = {};

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    if (category && category !== 'All') {
      query.category = category;
    }
    if (level && level !== 'All') {
      query.level = level;
    }

    const courses = await Course.find(query).sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(port, () => {
  console.log(`✅ CORRECT Server (index.js) running on http://localhost:${port}`);
});