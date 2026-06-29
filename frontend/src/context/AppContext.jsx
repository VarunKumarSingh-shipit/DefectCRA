import React, { createContext, useState, useEffect } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [sessionId, setSessionId] = useState(null);
  const [defectData, setDefectData] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [fiveWhyResults, setFiveWhyResults] = useState([]);

  const [provider, setProvider] = useState('gemini'); // 'gemini' or 'ollama'
  const [apiKey, setApiKey] = useState('');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState('llama3');
  const [ollamaMode, setOllamaMode] = useState('local'); // 'local' or 'cloud'

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setApiKey(savedKey);

    const savedProvider = localStorage.getItem('ai_provider');
    if (savedProvider) setProvider(savedProvider);

    const savedOllamaUrl = localStorage.getItem('ollama_url');
    if (savedOllamaUrl) setOllamaUrl(savedOllamaUrl);

    const savedOllamaModel = localStorage.getItem('ollama_model');
    if (savedOllamaModel) setOllamaModel(savedOllamaModel);

    const savedOllamaMode = localStorage.getItem('ollama_mode');
    if (savedOllamaMode) setOllamaMode(savedOllamaMode);
  }, []);

  const saveConfig = (newProvider, newKey, newUrl, newModel, newOllamaMode) => {
    setProvider(newProvider);
    setApiKey(newKey);
    setOllamaUrl(newUrl);
    setOllamaModel(newModel);
    setOllamaMode(newOllamaMode || 'local');

    localStorage.setItem('ai_provider', newProvider);
    localStorage.setItem('gemini_api_key', newKey);
    localStorage.setItem('ollama_url', newUrl);
    localStorage.setItem('ollama_model', newModel);
    localStorage.setItem('ollama_mode', newOllamaMode || 'local');
  };

  return (
    <AppContext.Provider value={{
      sessionId, setSessionId,
      defectData, setDefectData,
      analysisData, setAnalysisData,
      fiveWhyResults, setFiveWhyResults,
      provider, apiKey, ollamaUrl, ollamaModel, ollamaMode,
      saveConfig
    }}>
      {children}
    </AppContext.Provider>
  );
};