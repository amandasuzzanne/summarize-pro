const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    filename: String,
    filepath: String,
    filetype: String,
    uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('File', fileSchema);
