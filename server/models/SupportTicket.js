const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, refPath: 'userModel' },
    userModel: { type: String, enum: ['Student', 'Admin', 'Employee', 'CompanyUser', 'User'], default: 'Student' },
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['Open', 'In Progress', 'Closed'], default: 'Open' }
}, { timestamps: true });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
