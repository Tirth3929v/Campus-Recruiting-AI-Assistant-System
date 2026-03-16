const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const companyUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  location: {
    type: String,
    required: [true, 'Please add a company location']
  },
  employeeCount: {
    type: String,
    required: [true, 'Please specify employee count range']
  },
  ownerEmail: {
    type: String,
    required: [true, 'Please add owner email'],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid owner email'
    ]
  },
  hrEmail: {
    type: String,
    required: [true, 'Please add HR email'],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid HR email'
    ]
  },
  industry: String,
  website: String,
  description: String,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  role: {
    type: String,
    default: 'company',
    immutable: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  lastActiveDate: {
    type: Date
  },
  otp: String,
  otpExpires: Date,
  profilePicture: {
    type: String
  }
}, { timestamps: true });

companyUserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

companyUserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id, role: 'company' }, process.env.JWT_SECRET || 'campus_recruit_jwt_secret_2026_secure_key', {
    expiresIn: '30d'
  });
};

companyUserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('CompanyUser', companyUserSchema);
