const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'recipientModel',
        required: true
    },
    recipientModel: {
        type: String,
        required: true,
        enum: ['Student', 'Admin', 'Employee', 'CompanyUser', 'User'],
        default: 'Student'
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['manual', 'job_update', 'account_approval', 'system'],
        default: 'manual'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    sentBy: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'senderModel'
    },
    senderModel: {
        type: String,
        enum: ['Student', 'Admin', 'Employee', 'CompanyUser', 'User'],
        default: 'Admin'
    }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
