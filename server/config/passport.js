const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const Employee = require('../models/Employee');
const CompanyUser = require('../models/CompanyUser');
const User = require('../models/User'); // Legacy
const bcrypt = require('bcryptjs');

const getModelByRole = (role) => {
  switch (role) {
    case 'student': return Student;
    case 'admin': return Admin;
    case 'employee': return Employee;
    case 'company': return CompanyUser;
    default: return User;
  }
};

// Local Strategy
passport.use(new LocalStrategy({
  usernameField: 'email'
}, async (email, password, done) => {
  try {
    // Check all collections for the email
    let user;
    const models = [Student, Admin, Employee, CompanyUser, User];
    for (const Model of models) {
      user = await Model.findOne({ email }).select('+password');
      if (user) break;
    }

    if (!user) {
      return done(null, false, { message: 'Invalid credentials' });
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return done(null, false, { message: 'Invalid credentials' });
    }
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

// JWT Strategy
const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'campus_recruit_jwt_secret_2026_secure_key'
};

passport.use(new JwtStrategy(opts, async (jwt_payload, done) => {
  try {
    const Model = getModelByRole(jwt_payload.role);
    const user = await Model.findById(jwt_payload.id).select('-password');
    if (user) {
      return done(null, user);
    }
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
}));

// Google OAuth Strategy (Defaulting to Student)
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await Student.findOne({ googleId: profile.id });
    if (user) {
      return done(null, user);
    }
    
    // Check if email already used in other colelction
    const email = profile.emails[0].value;
    const models = [Admin, Employee, CompanyUser, User];
    for (const M of models) {
      if (await M.findOne({ email })) {
        return done(null, false, { message: 'Email already registered in another role' });
      }
    }

    user = new Student({
      googleId: profile.id,
      name: profile.displayName,
      email: email,
      role: 'student'
    });
    await user.save();
    return done(null, user);
  } catch (error) {
    return done(error, false);
  }
}));

module.exports = passport;
