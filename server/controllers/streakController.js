const Streak = require('../models/Streak');
// Note: We don't import user models here to avoid circular dependencies if models eventually reference this.
// Instead, we operate on the user document passed to the function and save it.

/**
 * @desc    Record daily activity and update streaks
 * @param   {Object} user - The user document from Mongoose
 * @param   {String} modelName - The name of the model (Student, Admin, etc.)
 */
exports.recordDailyActivity = async (user, modelName) => {
  try {
    const now = new Date();
    // Normalize to YYYY-MM-DD in UTC
    const dateString = now.toISOString().split('T')[0];
    const today = new Date(dateString);

    const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate.toISOString().split('T')[0]) : null;

    // 1. Check if already logged today
    if (lastActive && lastActive.getTime() === today.getTime()) {
      // Increment activity count for today
      await Streak.findOneAndUpdate(
        { user: user._id, dateString },
        { $inc: { activitiesCount: 1 } },
        { upsert: true }
      );
      return;
    }

    // 2. Upsert the Streak history record
    await Streak.findOneAndUpdate(
      { user: user._id, dateString },
      { $setOnInsert: { user: user._id, userModel: modelName, date: today, dateString }, $inc: { activitiesCount: 1 } },
      { upsert: true }
    );

    // 3. Update User Streak Logic
    if (!lastActive) {
      // First time activity
      user.currentStreak = 1;
    } else {
      const diffTime = today.getTime() - lastActive.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day
        user.currentStreak += 1;
      } else {
        // Streak broken
        user.currentStreak = 1;
      }
    }

    // Update longest streak
    if (user.currentStreak > user.longestStreak) {
      user.longestStreak = user.currentStreak;
    }

    user.lastActiveDate = now;
    await user.save();
    
    console.log(`🔥 Streak Updated for ${user.email}: ${user.currentStreak} days`);
  } catch (error) {
    console.error('❌ Streak Recording Error:', error);
  }
};
