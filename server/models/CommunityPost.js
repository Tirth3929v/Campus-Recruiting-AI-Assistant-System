const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, refPath: 'authorModel', required: true },
    authorModel: { type: String, enum: ['Student', 'Admin', 'Employee', 'CompanyUser', 'User'], default: 'Student' },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const communityPostSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, refPath: 'authorModel', required: true },
    authorModel: { type: String, enum: ['Student', 'Admin', 'Employee', 'CompanyUser', 'User'], default: 'Student' },
    content: { type: String, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Keep User for simplicity if not populating, or update if needed
    comments: [commentSchema],
    tags: [String]
}, { timestamps: true });

communityPostSchema.index({ createdAt: -1 });

module.exports = mongoose.model('CommunityPost', communityPostSchema);
