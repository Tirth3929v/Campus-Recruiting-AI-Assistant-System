const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const Employee = require('../models/Employee');
const CompanyUser = require('../models/CompanyUser');
const User = require('../models/User');

const getModelByRole = (role) => {
  const normalizedRole = (role || '').toLowerCase();
  switch (normalizedRole) {
    case 'student': return Student;
    case 'admin': return Admin;
    case 'employee': return Employee;
    case 'company': return CompanyUser;
    default: return User;
  }
};

const protect = async (req, res, next) => {
  let token;

  // 1. Priority: Authorization Header (Bearer Token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } 
  // 2. Role-Specific Cookies (Priority over generic)
  else if (req.cookies.student_token) token = req.cookies.student_token;
  else if (req.cookies.company_token) token = req.cookies.company_token;
  else if (req.cookies.admin_token) token = req.cookies.admin_token;
  else if (req.cookies.employee_token) token = req.cookies.employee_token;
  // 3. Fallback: Generic cr_token or generic token
  else if (req.cookies.cr_token) token = req.cookies.cr_token;
  else if (req.cookies.token) token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Access denied - No token provided' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'campus_recruit_jwt_secret_2026_secure_key';
    const decoded = jwt.verify(token, secret);

    console.log(`🔑 [AuthMiddleware] Decoded token: ID=${decoded.id || decoded._id}, Role=${decoded.role}`);

    const Model = getModelByRole(decoded.role);
    const user = await Model.findById(decoded.id || decoded._id).select('-password');

    if (!user) {
      console.warn(`⚠️ [AuthMiddleware] User not found in ${Model.modelName}. ID: ${decoded.id || decoded._id}`);
      return res.status(401).json({ error: 'Not authorized, user not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('❌ [AuthMiddleware] JWT Error:', error.message);
    res.status(401).json({ error: 'Not authorized, token failed' });
  }
};

module.exports = { protect };