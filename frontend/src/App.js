import React, { useState } from 'react';
import UploadForm from './components/UploadForm';
import ResultDisplay from './components/ResultDisplay';
import './App.css';

function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (file) => {
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:5000/api/interpret', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to interpret results');
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="header">
        <div className="pulse-wrap" aria-hidden="true">
          <svg className="pulse-line" viewBox="0 0 600 60" preserveAspectRatio="none">
            <polyline
              className="pulse-path"
              points="0,30 80,30 100,30 115,10 130,50 145,5 160,55 175,30 190,30 600,30"
              fill="none"
            />
          </svg>
        </div>
        <div className="header-content">
          <span className="eyebrow">Read your results, not just numbers</span>
          <h1>Lab Results Interpreter</h1>
          <p>Upload a report. Get a plain-language read on every value.</p>
        </div>
      </header>

      <main className="container">
        <UploadForm onUpload={handleUpload} loading={loading} />
        {loading && (
          <div className="loading">
            <span className="loading-dot"></span>
            <span className="loading-dot"></span>
            <span className="loading-dot"></span>
            <span className="loading-text">Reading your report</span>
          </div>
        )}
        {result && <ResultDisplay result={result} />}
      </main>
    </div>
  );
}

export default App;
