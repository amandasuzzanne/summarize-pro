const express = require('express');
const multer = require('multer');
const path = require('path');
const File = require('../models/File');
const Summary = require('../models/Summary');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const { DocumentProcessorServiceClient } = require('@google-cloud/documentai').v1;
require('dotenv').config();

const router = express.Router();

// Initialize Document AI client
const client = new DocumentProcessorServiceClient();

// Google Cloud configuration
const projectId = process.env.GOOGLE_PROJECT_ID;
const location = 'us'; // or 'eu' if using Europe
const processorId = process.env.GOOGLE_PROCESSOR_ID; // Your processor ID

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`);
    },
});

const upload = multer({ storage });

// Function to get summary from AI
const getSummaryFromAI = async (filePath) => {
    const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;
    const fileData = await fs.readFile(filePath);
    const encodedFile = Buffer.from(fileData).toString('base64');

    const request = {
        name,
        rawDocument: {
            content: encodedFile,
            mimeType: 'application/pdf', // Adjust based on your file type
        },
    };

    const [result] = await client.processDocument(request);
    const { document } = result;
    const { text } = document;

    const getText = textAnchor => {
        if (!textAnchor.textSegments || textAnchor.textSegments.length === 0) {
            return '';
        }
        const startIndex = textAnchor.textSegments[0].startIndex || 0;
        const endIndex = textAnchor.textSegments[0].endIndex;
        return text.substring(startIndex, endIndex);
    };

    let fullText = '';
    const [page1] = document.pages;
    const { paragraphs } = page1;

    for (const paragraph of paragraphs) {
        fullText += getText(paragraph.layout.textAnchor) + '\n';
    }

    return fullText;
};

// Route to handle file uploads and summarization
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const newFile = new File({
            filename: req.file.filename,
            filepath: req.file.path,
            filetype: req.file.mimetype,
        });

        await newFile.save();

        // Summarize the file content
        const summaryText = await getSummaryFromAI(newFile.filepath);

        const newSummary = new Summary({
            fileId: newFile._id,
            originalText: '', // Add the original text if needed
            summaryText,
            summaryId: uuidv4(),
            tags: ["example", "summary"], // Replace with actual tags
        });

        await newSummary.save();

        res.status(200).json({ 
            message: 'File uploaded and summarized successfully', 
            file: newFile, 
            summary: newSummary 
        });
    } catch (err) {
        res.status(500).json({ message: 'File upload or summarization failed', error: err });
    }
});

module.exports = router;
