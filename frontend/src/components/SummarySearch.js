import React, { useState } from 'react';
import axios from 'axios';

function SummarySearch() {
  const [keyword, setKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/summaries/search?keyword=${keyword}`);
      setSearchResults(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Search Summaries</h2>
      <input
        type="text"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      <button onClick={handleSearch}>Search</button>
      <ul>
        {searchResults.map((summary) => (
          <li key={summary.summaryId}>
            {summary.summaryText} (Tags: {summary.tags.join(', ')})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SummarySearch;
