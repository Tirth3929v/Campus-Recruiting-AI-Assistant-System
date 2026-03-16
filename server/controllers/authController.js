const Student = require('../models/Student');
const { protect } = require('../middleware/authMiddleware');
const streakController = require('./streakController');
const Admin = require('../models/Admin');
const Employee = require('../models/Employee');
const CompanyUser = require('../models/CompanyUser');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

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

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendOTPEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Campus Recruit" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify your email - Campus Recruit',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #0B0F19; color: white; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
          <h2 style="color: #8b5cf6; text-align: center; font-size: 24px; margin-bottom: 24px;">Verify Your Email</h2>
          <p style="color: #94a3b8; line-height: 1.6;">Hello,</p>
          <p style="color: #94a3b8; line-height: 1.6;">Thank you for joining Campus Recruit. To complete your registration, please enter the 6-digit verification code below:</p>
          <div style="background: rgba(139, 92, 246, 0.1); padding: 32px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #8b5cf6; border-radius: 12px; margin: 32px 0; border: 1px solid rgba(139, 92, 246, 0.2);">
              ${otp}
          </div>
          <p style="color: #64748b; font-size: 13px; text-align: center;">This code will expire in 10 minutes.</p>
          <div style="margin-top: 40px; border-top: 1px solid rgba(255,255,255,0.05); pt: 24px;">
              <p style="color: #64748b; font-size: 12px;">If you did not request this code, please ignore this email.</p>
              <p style="color: #64748b; font-size: 12px;">© 2026 Campus Recruit. All rights reserved.</p>
          </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, course } = req.body;
    const targetRole = role || 'student';
    
    // Check if user exists across all collections
    let user;
    const allModels = [Student, Admin, Employee, CompanyUser, User];
    for (const M of allModels) {
      user = await M.findOne({ email });
      if (user) break;
    }

    const otp = generateOTP();
    const otpExpires = Date.now() + 10 * 60 * 1000;

    if (user) {
      if (user.isVerified) {
        return res.status(400).json({ message: 'User already exists and is verified' });
      }
      // Update existing unverified user
      user.otp = otp;
      user.otpExpires = otpExpires;
      if (password) user.password = password; // Allow updating password if they retry
      await user.save();
    } else {
      const Model = getModelByRole(targetRole);
      user = new Model({ 
        name, 
        email, 
        password, 
        role: targetRole, 
        course,
        isVerified: false, 
        otp, 
        otpExpires 
      });
      await user.save();
      
      if (targetRole === 'student') {
        await StudentProfile.create({ user: user._id, course: course || '' });
      }
    }

    await sendOTPEmail(email, otp);
    res.status(200).json({ success: true, message: 'OTP sent to email. Please verify to continue.' });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Server Error during registration' });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    let user;
    const allModels = [Student, Admin, Employee, CompanyUser, User];
    for (const M of allModels) {
      user = await M.findOne({ email }).select('+otp +otpExpires');
      if (user) break;
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = user.getSignedJwtToken();
    const cookieOptions = { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'lax', 
      maxAge: 30 * 24 * 60 * 60 * 1000 
    };

    res.cookie(`${user.role}_token`, token, cookieOptions);
    res.cookie('cr_token', token, cookieOptions);

    res.status(200).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ message: 'Server Error during verification' });
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    let user;
    const allModels = [Student, Admin, Employee, CompanyUser, User];
    for (const M of allModels) {
      user = await M.findOne({ email });
      if (user) break;
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Account is already verified' });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendOTPEmail(email, otp);
    res.status(200).json({ success: true, message: 'New OTP sent to email' });
  } catch (error) {
    console.error('Resend OTP Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    let user;
    const allModels = [Student, Admin, Employee, CompanyUser, User];
    for (const M of allModels) {
      user = await M.findOne({ email }).select('+password');
      if (user) break;
    }

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ 
        message: 'Email not verified. Please verify your email to log in.',
        isUnverified: true 
      });
    }

    // Role specific checks
    if (user.role === 'company' && user.status !== 'approved') {
      const msg = user.status === 'pending' ? 'Awaiting employee approval' : 'Account rejected';
      return res.status(403).json({ message: msg });
    }

    const token = user.getSignedJwtToken();
    const cookieOptions = { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'lax', 
        maxAge: 30 * 24 * 60 * 60 * 1000 
    };

    res.cookie(`${user.role}_token`, token, cookieOptions);
    res.cookie('cr_token', token, cookieOptions);

    // Record Streak Activity
    await streakController.recordDailyActivity(user, user.constructor.modelName);

    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Logout user
exports.logout = (req, res) => {
  res.clearCookie('cr_token');
  res.clearCookie('student_token');
  res.clearCookie('company_token');
  res.clearCookie('admin_token');
  res.clearCookie('employee_token');
  res.status(200).json({ success: true });
};

// @desc    Forgot Password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Find user across all collections
    let user;
    const allModels = [Student, Admin, Employee, CompanyUser, User];
    for (const M of allModels) {
      user = await M.findOne({ email });
      if (user) break;
    }

    if (!user) {
      return res.status(200).json({ success: true, message: 'Email sent successfully' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');

    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes

    await user.save();

    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;

    const message = `
      <h1>You have requested a password reset</h1>
      <p>Please go to this link to reset your password:</p>
      <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
      <p>This link will expire in 15 minutes.</p>
    `;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Campus Recruit" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Password Reset Request',
      html: message,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ message: 'Email could not be sent' });
  }
};

// @desc    Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');

    // Find user with this token across all collections
    let user;
    const allModels = [Student, Admin, Employee, CompanyUser, User];
    for (const M of allModels) {
      user = await M.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
      });
      if (user) break;
    }

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update User Profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const role = req.user.role;
    const Model = getModelByRole(role);
    
    const user = await Model.findById(userId);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      
      if (req.body.password) {
        user.password = req.body.password;
      }

      if (req.files) {
        if (req.files.resume) {
          user.resume = req.files.resume[0].path;
        }
        if (req.files.profilePicture) {
          user.profilePicture = req.files.profilePicture[0].path;
        }
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        resume: updatedUser.resume,
        profilePicture: updatedUser.profilePicture,
        token: req.headers.authorization.split(' ')[1], // Return the same token
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};