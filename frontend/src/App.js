import React, { useState, useEffect } from 'react';
import UploadForm from './components/UploadForm';
import ResultDisplay from './components/ResultDisplay';
import './App.css';

function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [slowLoad, setSlowLoad] = useState(false);

  // The backend sleeps when idle (free hosting), so the first read of the
  // day can take a while. If loading runs long, say so — otherwise people
  // assume the app is broken and leave.
  useEffect(() => {
    if (!loading) {
      setSlowLoad(false);
      return;
    }
    const timer = setTimeout(() => setSlowLoad(true), 6000);
    return () => clearTimeout(timer);
  }, [loading]);

  const handleUpload = async (file) => {
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/interpret`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        // The backend sends a specific, human-readable reason for every
        // failure ("this doesn't look like a lab report", "AI is busy",
        // file too large...). Show THAT, not a generic message.
        throw new Error(
          (data && data.error) || 'Failed to interpret results. Please try again.'
        );
      }

      setResult(data);
    } catch (error) {
      // A network-level failure (server unreachable, connection dropped)
      // lands here with a browser message like "Failed to fetch" — replace
      // it with something a person can act on.
      const isNetworkError = error instanceof TypeError;
      setResult({
        error: isNetworkError
          ? 'Could not reach the server. It may be waking up — wait a few seconds and try again.'
          : error.message,
      });
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
          <div className="loading-wrap">
            <div className="loading">
              <span className="loading-dot"></span>
              <span className="loading-dot"></span>
              <span className="loading-dot"></span>
              <span className="loading-text">Reading your report</span>
            </div>
            {slowLoad && (
              <p className="loading-note">
                Still working — the first read of the day can take up to a
                minute while the server wakes up.
              </p>
            )}
          </div>
        )}
        {result && <ResultDisplay result={result} />}
      </main>

      <footer className="app-footer">
        <p>
          VitalScope explains lab results in plain language. It is not medical
          advice and does not replace your doctor — always discuss your
          results with a healthcare professional.
        </p>
      </footer>
    </div>
  );
}

export default App;
