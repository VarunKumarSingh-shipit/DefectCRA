import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import FileUploader from '../components/FileUploader';
import DataTable from '../components/DataTable';
import { uploadFile } from '../services/api';
import './UploadPage.css';

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setSessionId, setDefectData, defectData } = useContext(AppContext);
  const navigate = useNavigate();

  const handleFileSelected = async (selectedFile) => {
    setFile(selectedFile);
    setError('');
    setLoading(true);
    
    try {
      const result = await uploadFile(selectedFile);
      setSessionId(result.sessionId);
      setDefectData(result.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to upload and parse file');
      setDefectData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeClick = () => {
    navigate('/dashboard');
  };

  return (
    <div className="page-container upload-page fade-in">
      <div className="upload-header">
        <h1 className="gradient-text">Upload Defect Data</h1>
        <p>Start your Root Cause Analysis by uploading your defect tracking Excel file.</p>
      </div>

      <FileUploader onFileSelected={handleFileSelected} />

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Parsing Excel data...</p>
        </div>
      )}

      {error && (
        <div className="error-message glass-card">
          ⚠️ {error}
        </div>
      )}

      {defectData && (
        <>
          <DataTable data={defectData} />
          
          <div className="action-row slide-up">
            <button 
              className="btn btn-primary analyze-btn" 
              onClick={handleAnalyzeClick}
            >
              Analyze Data →
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default UploadPage;
