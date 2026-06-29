import React, { useState } from 'react';
import './FiveWhyCard.css';

const FiveWhyCard = ({
  rank,
  category,
  defectCount,
  percentage,
  problemDescription,
  onGenerateFiveWhy,
  onCancel,
  result,
  loading,
  progressLevel = 0,
  onResultChange
}) => {
  const [directCause, setDirectCause] = useState(result?.directCause || '');

  const handleGenerate = () => {
    onGenerateFiveWhy(category, directCause);
  };

  const handleChange = (field, value) => {
    onResultChange(category, { ...(result || {}), [field]: value });
  };

  const colors = ['#6366f1', '#22d3ee', '#10b981', '#f59e0b', '#a855f7'];
  const rankColor = colors[(rank - 1) % colors.length];

  // Reveal whys progressively as they stream in
  const filledCount = [1, 2, 3, 4, 5].filter(n => result && result[`why${n}`]).length;

  return (
    <div className="five-why-card glass-card slide-up" style={{ borderLeftColor: rankColor }}>
      <div className="fw-header">
        <div className="fw-title">
          <span className="rank-badge" style={{ backgroundColor: rankColor }}>#{rank}</span>
          <h2>{category}</h2>
        </div>
        <div className="fw-stats">
          <span className="stat-pill">{defectCount} defects</span>
          <span className="stat-pill primary">{percentage}% of total</span>
        </div>
      </div>

      <div className="fw-body">
        <div className="form-group">
          <label>Problem Description</label>
          <p className="read-only-text">{problemDescription}</p>
        </div>

        <div className="form-group">
          <label>Direct Cause <span className="required">*</span></label>
          <textarea
            className="highlight-input"
            value={directCause}
            onChange={(e) => {
              setDirectCause(e.target.value);
              handleChange('directCause', e.target.value);
            }}
            placeholder="What is the immediate, direct cause of these defects? (Be specific)"
            rows={2}
            disabled={loading}
          />
        </div>

        {!result?.why1 && !loading && (
          <div className="action-row left">
            <button
              className="btn btn-primary"
              onClick={handleGenerate}
              disabled={!directCause}
            >
              Generate 5 Why Analysis 🤖
            </button>
          </div>
        )}

        {loading && (
          <div className="chain-progress slide-up">
            <div className="chain-progress-header">
              <span className="spinner small"></span>
              <strong>Building the {filledCount + 1 === 5 ? '5th Why' : `${filledCount + 1}${filledCount === 0 ? 'st' : filledCount + 1 === 2 ? 'nd' : filledCount + 1 === 3 ? 'rd' : 'th'} Why`} from the previous response…</strong>
            </div>
            <div className="chain-progress-steps">
              {[1, 2, 3, 4, 5].map(n => (
                <div
                  key={n}
                  className={`chain-step ${n <= filledCount ? 'done' : n === filledCount + 1 ? 'active' : 'pending'}`}
                  style={{ borderColor: rankColor }}
                >
                  Why {n}
                </div>
              ))}
            </div>
            <div className="action-row left mt-2">
              <button className="btn btn-ghost" onClick={() => onCancel(category)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {(result?.why1 || (!loading && filledCount > 0)) && (
          <div className="fw-results fade-in">
            <h3 className="results-title">Analysis Results</h3>

            {[1, 2, 3, 4, 5].map(num => {
              const value = result[`why${num}`];
              const isFilled = !!value;
              const isActive = loading && num === filledCount + 1;
              if (!isFilled && !isActive) return null;
              return (
                <div className="why-step" key={`why${num}`}>
                  <div className="why-indicator" style={{ backgroundColor: rankColor }}>{num}</div>
                  <div className="why-content">
                    <label>Why {num}?</label>
                    {result[`why${num}_question`] && (
                      <p className="why-question-text">{result[`why${num}_question`]}</p>
                    )}
                    {isActive ? (
                      <div className="why-pending">
                        <span className="spinner small"></span> Generating…
                      </div>
                    ) : (
                      <textarea
                        value={value}
                        onChange={(e) => handleChange(`why${num}`, e.target.value)}
                        rows={3}
                        disabled={loading}
                      />
                    )}
                  </div>
                </div>
              );
            })}

            {result.rootCause !== undefined && (
              <div className="form-group root-cause-group">
                <label>Root Cause</label>
                {loading && !result.rootCause ? (
                  <div className="why-pending"><span className="spinner small"></span> Summarizing…</div>
                ) : (
                  <textarea
                    className="root-cause-input"
                    value={result.rootCause || ''}
                    onChange={(e) => handleChange('rootCause', e.target.value)}
                    rows={3}
                    disabled={loading}
                  />
                )}
              </div>
            )}

            {result.actions !== undefined && (
              <div className="form-group">
                <label>Recommended Actions (One per line)</label>
                {loading && (!result.actions || result.actions.length === 0) ? (
                  <div className="why-pending"><span className="spinner small"></span> Drafting actions…</div>
                ) : (
                  <textarea
                    value={(result.actions || []).join('\n')}
                    onChange={(e) => handleChange('actions', e.target.value.split('\n'))}
                    rows={4}
                    disabled={loading}
                  />
                )}
              </div>
            )}

            {!loading && (
              <div className="action-row left mt-4">
                <button
                  className="btn btn-secondary"
                  onClick={handleGenerate}
                  disabled={!directCause}
                >
                  Regenerate Analysis 🔄
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FiveWhyCard;