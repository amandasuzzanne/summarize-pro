const express = require('express');
const { DocumentProcessorServiceClient } = require('@google-cloud/documentai').v1;
const Summary = require('../models/Summary');
const File = require('../models/File');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const router = express.Router();

// Initialize Document AI client
const client = new DocumentProcessorServiceClient();

// Use your actual Google Cloud project ID and location
const projectId = process.env.GOOGLE_PROJECT_ID;
const location = 'us'; // or 'eu' if using Europe
const processorId = '55081f6c41f393bf'; // Your processor ID

const getSummaryFromAI = async (filePath) => {
    const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;

    // Read the file into memory
    const fileData = await fs.readFile(filePath);

    // Convert the file data to a Buffer and base64 encode it
    const encodedFile = Buffer.from(fileData).toString('base64');

    const request = {
        name,
        rawDocument: {
            content: encodedFile,
            mimeType: 'application/pdf', // Change mimeType if uploading other file types
        },
    };

    // Call the Document AI API to process the document
    const [result] = await client.processDocument(request);
    const { document } = result;

    // Extract text from the document
    const { text } = document;

    // Extract and concatenate all paragraphs
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

// Function to generate tags based on the text
const generateTags = (text) => {
    const words = text.split(/\s+/);
    const wordCount = {};
    words.forEach(word => {
        word = word.toLowerCase();
        if (wordCount[word]) {
            wordCount[word]++;
        } else {
            wordCount[word] = 1;
        }
    });

    // Sort by frequency and return the top 3 words as tags
    return Object.keys(wordCount)
        .sort((a, b) => wordCount[b] - wordCount[a])
        .slice(0, 3);
};

// Route to handle summarization
router.post('/summarize', async (req, res) => {
    const { fileId, originalText } = req.body;

    if (!fileId || !originalText) {
        return res.status(400).json({ message: 'fileId and originalText are required' });
    }

    try {
        // Fetch the file path from the database
        const file = await File.findById(fileId);
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        const filePath = path.join(__dirname, '..', 'uploads', file.filename);

        // Call the AI API to get the summary
        const summaryText = await getSummaryFromAI(filePath);

        // Generate tags from the summary text
        const tags = generateTags(summaryText);

        const newSummary = new Summary({
            fileId,
            originalText,
            summaryText,
            summaryId: uuidv4(),
            tags, // Automatically generate tags from the summary text
        });

        await newSummary.save();
        res.status(200).json({ message: 'Summary created successfully', summary: newSummary });
    } catch (err) {
        console.error('Error during summarization:', err);
        res.status(500).json({ message: 'Summarization failed', error: err.message }); // Send error message
    }
});


// Route to retrieve summaries by keywords or tags
router.get('/search', async (req, res) => {
    const { keyword } = req.query;

    try {
        const summaries = await Summary.find({
            $text: { $search: keyword }
        });
        res.status(200).json(summaries);
    } catch (err) {
        res.status(500).json({ message: 'Search failed', error: err });
    }
});

// GET /api/summaries - Fetch all summaries
router.get('/', async (req, res) => {
    try {
        const summaries = await Summary.find({});
        res.json(summaries);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching summaries', error: err });
    }
});

module.exports = router;
