import React, { useState, useEffect } from 'react';
import axios from 'axios';

function SummaryList() {
  const [summaries, setSummaries] = useState([]);

  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/summaries');
        setSummaries(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchSummaries();
  }, []);

  return (
    <div>
      <h2>Summaries</h2>
      <ul>
        {summaries.map((summary) => (
          <li key={summary.summaryId}>
            {summary.summaryText} (Tags: {summary.tags.join(', ')})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SummaryList;
