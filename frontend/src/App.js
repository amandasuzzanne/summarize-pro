import './App.css';
import React from 'react';
import FileUpload from './components/FileUpload';
import SummaryList from './components/SummaryList';
import SummarySearch from './components/SummarySearch';

function App() {
  return (
    <div className="App">
      <h1>Text Summarization App</h1>
      <FileUpload />
      <SummarySearch />
      <SummaryList />
    </div>
  );
}

export default App;
