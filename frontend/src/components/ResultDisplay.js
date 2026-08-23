import React from 'react';
import './ResultDisplay.css';

function ResultDisplay({ result }) {
  if (result.error) {
    return (
      <div className="result-container error">
        <h2>Error</h2>
        <p>{result.error}</p>
      </div>
    );
  }

  const { summary, values, healthTips, criticalWarnings } = result;

  return (
    <div className="result-container">
      <div className="result-content">
        <h2>Your results</h2>

        {criticalWarnings && criticalWarnings.length > 0 && (
          <div className="critical-warnings">
            <h3>Critical warnings</h3>
            <ul>
              {criticalWarnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {summary && (
          <div className="interpretation">
            <p>{summary}</p>
          </div>
        )}

        {values && values.length > 0 && (
          <div className="values-section">
            <h3>Test values</h3>
            <ul>
              {values.map((value, idx) => (
                <li key={idx} className={value.status}>
                  <div className="value-header">
                    <span className="value-name">{value.name}</span>
                    <span className="value-result">
                      {value.result} <span className="value-unit">{value.unit}</span>
                    </span>
                    <span className={`status-pill ${value.status}`}>
                      {value.status === 'abnormal' ? 'Abnormal' : 'Normal'}
                    </span>
                  </div>
                  {value.range && (
                    <div className="value-range">Normal range: {value.range}</div>
                  )}
                  {value.explanation && (
                    <div className="value-explanation">{value.explanation}</div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {healthTips && healthTips.length > 0 && (
          <div className="health-tips">
            <h3>Health tips</h3>
            <ul>
              {healthTips.map((tip, idx) => (
                <li key={idx}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResultDisplay;

