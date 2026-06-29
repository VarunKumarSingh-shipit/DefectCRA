import React, { useEffect, useState } from 'react';
import './SummaryCards.css';

const SummaryCards = ({ summary }) => {
  if (!summary) return null;

  const { totalDefects, bySeverity, causeCategoryPareto, sprintRange } = summary;
  
  // Find top cause
  let topCause = { category: 'N/A', count: 0 };
  if (causeCategoryPareto && causeCategoryPareto.length > 0) {
    topCause = causeCategoryPareto[0];
  }

  const criticalCount = bySeverity?.Critical || 0;

  return (
    <div className="summary-cards-grid slide-up">
      <div className="summary-card glass-card card-total">
        <div className="card-icon">🐛</div>
        <div className="card-content">
          <p className="card-label">Total Defects</p>
          <h2 className="card-value">{totalDefects}</h2>
        </div>
      </div>

      <div className="summary-card glass-card card-sprint">
        <div className="card-icon">📅</div>
        <div className="card-content">
          <p className="card-label">Sprint Range</p>
          <h2 className="card-value range-value">
            {sprintRange?.from}<br/>
            <span className="to-text">to</span> {sprintRange?.to}
          </h2>
        </div>
      </div>

      <div className="summary-card glass-card card-critical">
        <div className="card-icon">⚠️</div>
        <div className="card-content">
          <p className="card-label">Critical Defects</p>
          <h2 className="card-value">{criticalCount}</h2>
        </div>
      </div>

      <div className="summary-card glass-card card-topcause">
        <div className="card-icon">📊</div>
        <div className="card-content">
          <p className="card-label">Top Cause Category</p>
          <h2 className="card-value text-value" title={topCause.category}>
            {topCause.category}
          </h2>
          <p className="card-subvalue">{topCause.count} defects</p>
        </div>
      </div>
    </div>
  );
};

export default SummaryCards;
