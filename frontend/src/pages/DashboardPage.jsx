import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { analyzeData } from '../services/api';
import SummaryCards from '../components/SummaryCards';
import TrendChart from '../components/TrendChart';
import ParetoChart from '../components/ParetoChart';
import './DashboardPage.css';

const DashboardPage = () => {
  const { sessionId, analysisData, setAnalysisData } = useContext(AppContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!sessionId) {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await analyzeData(sessionId);
        setAnalysisData(data);
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Failed to analyze data');
      } finally {
        setLoading(false);
      }
    };

    if (!analysisData) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [sessionId, analysisData, setAnalysisData, navigate]);

  if (loading) {
    return (
      <div className="page-container dashboard-page loading-skeleton">
        <div className="skeleton-header"></div>
        <div className="skeleton-cards">
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
        </div>
        <div className="skeleton-chart large"></div>
        <div className="skeleton-grid">
          <div className="skeleton-chart"></div>
          <div className="skeleton-chart"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container dashboard-page">
        <div className="error-message glass-card">⚠️ {error}</div>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>Return to Upload</button>
      </div>
    );
  }

  if (!analysisData) return null;

  const phaseKeys = [
    { key: 'Coding', color: '#6366f1', label: 'Coding' },
    { key: 'Design', color: '#22d3ee', label: 'Design' },
    { key: 'Requirements', color: '#f59e0b', label: 'Requirements' },
    { key: 'Configuration', color: '#10b981', label: 'Configuration' }
  ];

  const typeKeys = [
    { key: 'Logical', color: '#6366f1' },
    { key: 'Performance', color: '#f59e0b' },
    { key: 'Data', color: '#22d3ee' },
    { key: 'Security', color: '#ef4444' },
    { key: 'UI', color: '#a855f7' },
    { key: 'Configuration change', color: '#10b981' },
    { key: 'Others', color: '#64748b' },
    { key: 'User interface', color: '#ec4899' }
  ];

  // Filter typeKeys to only those present in data
  const availableTypeKeys = [];
  if (analysisData.defectTypeTrend && analysisData.defectTypeTrend.length > 0) {
    const sample = analysisData.defectTypeTrend[0];
    typeKeys.forEach(tk => {
      if (sample.hasOwnProperty(tk.key)) {
        availableTypeKeys.push(tk);
      }
    });
  }

  return (
    <div className="page-container dashboard-page fade-in">
      <div className="dashboard-header">
        <h1 className="gradient-text">Defect Analysis Dashboard</h1>
      </div>

      <SummaryCards summary={analysisData.summary} />

      <TrendChart 
        data={analysisData.phaseInjectionTrend} 
        dataKeys={phaseKeys} 
        title="Phase Injection Trends Over Sprints" 
      />

      <div className="dashboard-grid">
        <TrendChart 
          data={analysisData.defectTypeTrend} 
          dataKeys={availableTypeKeys.length > 0 ? availableTypeKeys : typeKeys} 
          title="Defect Type Distribution" 
        />
        
        <ParetoChart 
          data={analysisData.causeCategoryPareto} 
          title="Cause Category Pareto Analysis"
          vitalFewCount={3} // Default for visualization
        />
      </div>

      <div className="action-row slide-up">
        <button 
          className="btn btn-primary proceed-btn" 
          onClick={() => navigate('/five-why')}
        >
          Proceed to 5 Why Analysis →
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;
