import React, { useState } from 'react';
import axios from 'axios';

function FileUpload() {
    const [file, setFile] = useState(null);
    const [summary, setSummary] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setSummary(null); // Reset summary when a new file is selected
    };

    const handleFileUpload = async () => {
        if (!file) {
            alert('Please select a file to upload');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            // Upload the file
            const fileResponse = await axios.post('http://localhost:5000/api/files/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            const fileId = fileResponse.data.file._id;

            // Request summarization for the uploaded file
            const summaryResponse = await axios.post('http://localhost:5000/api/summaries/summarize', {
                fileId: fileId
            });

            setSummary(summaryResponse.data.summary);
        } catch (error) {
            console.error('Error uploading file or summarizing:', error);
        }
    };

    return (
        <div>
            <h2>Upload File</h2>
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleFileUpload}>Upload</button>

            {summary && (
                <div>
                    <h3>Summary</h3>
                    <p>{summary.summaryText}</p>
                    <p><strong>Tags:</strong> {summary.tags.join(', ')}</p>
                </div>
            )}
        </div>
    );
}

export default FileUpload;
