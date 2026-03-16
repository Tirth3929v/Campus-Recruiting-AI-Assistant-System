const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Configure Multer for file upload
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/'); // Ensure this folder exists in your server root
  },
  filename(req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-otp', authController.verifyOTP);
router.post('/resend-otp', authController.resendOTP);

router.post('/forgot-password', authController.forgotPassword);
router.put('/reset-password/:resetToken', authController.resetPassword);

router.put('/profile', protect, upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'profilePicture', maxCount: 1 }
]), authController.updateProfile);

router.post('/logout', authController.logout);

module.exports = router;