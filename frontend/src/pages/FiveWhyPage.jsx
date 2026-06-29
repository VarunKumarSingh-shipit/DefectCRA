import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import FiveWhyCard from '../components/FiveWhyCard';
import { generateFiveWhyChain, exportWord } from '../services/api';
import './FiveWhyPage.css';

const FiveWhyPage = () => {
  const { sessionId, analysisData, fiveWhyResults, setFiveWhyResults, provider, apiKey, ollamaUrl, ollamaModel, ollamaMode } = useContext(AppContext);
  const [vitalFewCount, setVitalFewCount] = useState(3);
  const [loadingMap, setLoadingMap] = useState({});
  const [progressMap, setProgressMap] = useState({}); // category -> { currentLevel }
  const [exporting, setExporting] = useState(false);
  const abortRef = useRef({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!sessionId || !analysisData) {
      navigate('/dashboard');
    }
  }, [sessionId, analysisData, navigate]);

  // Clean up streams on unmount
  useEffect(() => {
    return () => {
      Object.values(abortRef.current).forEach(ctrl => ctrl && ctrl.abort());
    };
  }, []);

  if (!analysisData) return null;

  const pareto = analysisData.causeCategoryPareto || [];
  const maxCategories = pareto.length;
  const safeCount = Math.min(Math.max(1, vitalFewCount), maxCategories);
  const topCategories = pareto.slice(0, safeCount);

  // Helper: upsert card state for a category with a partial result patch
  const patchResult = (category, patch) => {
    setFiveWhyResults(prev => {
      const idx = prev.findIndex(r => r.category === category);
      if (idx === -1) return prev;
      const existing = prev[idx];
      const newResult = { ...(existing.result || {}), ...patch };
      const next = [...prev];
      next[idx] = { ...existing, result: newResult };
      return next;
    });
  };

  // Helper: create a fresh card entry once generation starts
  const initResult = (category, problemDescription, directCause) => {
    setFiveWhyResults(prev => {
      const idx = prev.findIndex(r => r.category === category);
      const entry = { category, problemDescription, directCause, result: {} };
      if (idx === -1) return [...prev, entry];
      const next = [...prev];
      next[idx] = { ...next[idx], problemDescription, directCause, result: {} };
      return next;
    });
  };

  const handleGenerate = async (category, directCause) => {
    if (provider === 'gemini' && !apiKey) {
      alert("Please configure your Gemini API Key in settings first.");
      return;
    }
    if (provider === 'ollama' && ollamaMode === 'local' && !ollamaUrl) {
      alert("Please configure your Ollama Base URL in settings first.");
      return;
    }
    if (provider === 'ollama' && ollamaMode === 'cloud' && !apiKey) {
      alert("Please configure your Ollama Cloud API key in settings first.");
      return;
    }

    // Cancel any in-flight stream for this category
    if (abortRef.current[category]) abortRef.current[category].abort();
    const controller = new AbortController();
    abortRef.current[category] = controller;

    const catData = pareto.find(p => p.category === category);
    const problemDescription = `${catData.percentage}% of defects (${catData.count} out of ${analysisData.summary.totalDefects}) are caused by ${category}`;

    setLoadingMap(prev => ({ ...prev, [category]: true }));
    setProgressMap(prev => ({ ...prev, [category]: { currentLevel: 0 } }));
    initResult(category, problemDescription, directCause);

    try {
      await generateFiveWhyChain({
        provider,
        apiKey,
        ollamaUrl,
        ollamaModel,
        ollamaMode,
        category,
        directCause,
        defectCount: catData.count,
        percentage: catData.percentage,
        sampleDefects: [
          { id: "Sample-1", summary: `Defect related to ${category}` },
          { id: "Sample-2", summary: `Another defect caused by ${category}` }
        ]
      }, ({ type, payload }) => {
        if (type === 'why') {
          // payload: { level, question, response }
          // Strip "Why N:" / "Question N:" / "Answer:" prefixes from question; UI labels each Why.
          const cleanQuestion = (payload.question || '').replace(/^\s*(Why\s*\d+\s*[:.\-]\s*|Question\s*\d*\s*[:.\-]\s*|Answer\s*[:.\-]\s*)/i, '').trim();
          const cleanResponse = (payload.response || '').replace(/^\s*(Why\s*\d+\s*[:.\-]\s*|Response\s*\d+\s*[:.\-]\s*|Answer\s*[:.\-]\s*)/i, '').trim();
          patchResult(category, {
            [`why${payload.level}_question`]: cleanQuestion,
            [`why${payload.level}`]: cleanResponse
          });
          setProgressMap(prev => ({ ...prev, [category]: { currentLevel: payload.level } }));
        } else if (type === 'summary') {
          patchResult(category, {
            rootCause: payload.rootCause || '',
            actions: payload.actions || []
          });
        } else if (type === 'error') {
          alert(`Error: ${payload.message}`);
        }
      }, controller.signal);
    } catch (err) {
      if (err.name !== 'AbortError') {
        alert(`Error generating analysis: ${err.message}`);
      }
    } finally {
      setLoadingMap(prev => ({ ...prev, [category]: false }));
      abortRef.current[category] = null;
    }
  };

  const handleCancel = (category) => {
    if (abortRef.current[category]) abortRef.current[category].abort();
  };

  const handleResultChange = (category, updatedResultObj) => {
    setFiveWhyResults(prev => {
      const idx = prev.findIndex(r => r.category === category);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        directCause: updatedResultObj.directCause,
        result: {
          why1: updatedResultObj.why1,
          why2: updatedResultObj.why2,
          why3: updatedResultObj.why3,
          why4: updatedResultObj.why4,
          why5: updatedResultObj.why5,
          rootCause: updatedResultObj.rootCause,
          actions: updatedResultObj.actions
        }
      };
      return next;
    });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportWord({ analysisData, fiveWhyResults });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Defect-RCA-Report.docx');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="page-container five-why-page fade-in">
      <div className="five-why-header">
        <h1 className="gradient-text">5 Why Root Cause Analysis</h1>
        <p>Each Why is built from the previous response. Watch the chain unfold.</p>
      </div>

      <div className="config-bar glass-card slide-up">
        <div className="config-item">
          <label>Number of Vital Few Categories to Analyze:</label>
          <div className="number-input-wrap">
            <input
              type="number"
              min="1"
              max={maxCategories}
              value={vitalFewCount}
              onChange={(e) => setVitalFewCount(parseInt(e.target.value) || 1)}
            />
            <span className="max-text">/ {maxCategories}</span>
          </div>
        </div>
      </div>

      <div className="cards-list">
        {topCategories.map((cat, index) => {
          const existingResult = fiveWhyResults.find(r => r.category === cat.category);
          const progress = progressMap[cat.category];
          return (
            <FiveWhyCard
              key={cat.category}
              rank={index + 1}
              category={cat.category}
              defectCount={cat.count}
              percentage={cat.percentage}
              problemDescription={`${cat.percentage}% of defects (${cat.count} out of ${analysisData.summary.totalDefects}) are caused by ${cat.category}`}
              result={existingResult ? { ...existingResult.result, directCause: existingResult.directCause } : null}
              loading={loadingMap[cat.category]}
              progressLevel={progress ? progress.currentLevel : 0}
              onGenerateFiveWhy={handleGenerate}
              onCancel={handleCancel}
              onResultChange={handleResultChange}
            />
          );
        })}
      </div>

      <div className="action-row slide-up mt-4">
        <button
          className="btn btn-primary export-btn"
          onClick={handleExport}
          disabled={exporting || fiveWhyResults.length === 0}
        >
          {exporting ? 'Exporting...' : 'Export to Word Document 📥'}
        </button>
      </div>

      {fiveWhyResults.length === 0 && (
        <p className="export-hint text-center">Generate at least one 5 Why analysis to enable export.</p>
      )}
    </div>
  );
};

export default FiveWhyPage;