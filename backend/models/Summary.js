const mongoose = require('mongoose');

const summarySchema = new mongoose.Schema({
    fileId: mongoose.Schema.Types.ObjectId,
    originalText: String,
    summaryText: String,
    summaryId: String,
    createdAt: { type: Date, default: Date.now },
    tags: [String],
});

// Create a text index on originalText and tags fields
summarySchema.index({ originalText: 'text', tags: 'text' });

module.exports = mongoose.model('Summary', summarySchema);
