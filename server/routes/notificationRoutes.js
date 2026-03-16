
const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/authMiddleware');

// GET /api/notifications - Get own notifications
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const notifications = await Notification.find({ recipientId: userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/notifications/:id/read - Mark one as read
router.put('/:id/read', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: userId },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json(notification);
  } catch (err) {
    console.error('Mark notification read error:', err);
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    await Notification.updateMany(
      { recipientId: userId, isRead: false },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Mark all notifications read error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
