import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import './ApiKeyModal.css';

const OLLAMA_CLOUD_MODELS = [
  'gpt-oss:120b-cloud',
  'gpt-oss:20b-cloud',
  'deepseek-v3.1:671b-cloud',
  'qwen3-coder:480b-cloud',
  'llama3.1:70b-cloud'
];

const ApiKeyModal = ({ isOpen, onClose }) => {
  const { provider, apiKey, ollamaUrl, ollamaModel, ollamaMode, saveConfig } = useContext(AppContext);

  const [localProvider, setLocalProvider] = useState('gemini');
  const [localOllamaMode, setLocalOllamaMode] = useState('local');
  const [inputKey, setInputKey] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [inputModel, setInputModel] = useState('');
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalProvider(provider || 'gemini');
      setLocalOllamaMode(ollamaMode || 'local');
      setInputKey(apiKey || '');
      setInputUrl(ollamaUrl || 'http://localhost:11434');
      setInputModel(ollamaModel || 'llama3');
    }
  }, [isOpen, provider, apiKey, ollamaUrl, ollamaModel, ollamaMode]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveConfig(localProvider, inputKey, inputUrl, inputModel, localOllamaMode);
    onClose();
  };

  const getMaskedKey = (key) => {
    if (!key || key.length < 10) return key;
    return `${key.slice(0, 6)}...${key.slice(-4)}`;
  };

  return (
    <div className="modal-overlay fade-in">
      <div className="modal-card glass-card slide-up">
        <h2>Configure AI Provider</h2>
        <p className="modal-subtitle">
          Select and configure the AI model used for the 5 Why Analysis.
        </p>

        <div className="input-group">
          <label>Provider</label>
          <select
            className="provider-select"
            value={localProvider}
            onChange={(e) => setLocalProvider(e.target.value)}
          >
            <option value="gemini">Google Gemini</option>
            <option value="ollama">Ollama (Local / Cloud)</option>
          </select>
        </div>

        {localProvider === 'gemini' && (
          <div className="input-group slide-up">
            <label>Gemini API Key</label>
            <div className="input-with-toggle">
              <input
                type={showKey ? "text" : "password"}
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="Enter your Gemini API key"
              />
              <button className="btn btn-ghost toggle-btn" onClick={() => setShowKey(!showKey)}>
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
            {apiKey && inputKey === apiKey && (
              <div className="key-status success">
                Current key: {getMaskedKey(apiKey)}
              </div>
            )}
          </div>
        )}

        {localProvider === 'ollama' && (
          <div className="ollama-settings slide-up">
            <div className="input-group">
              <label>Deployment</label>
              <div className="radio-group">
                <label className={`radio-pill ${localOllamaMode === 'local' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="ollama-mode"
                    value="local"
                    checked={localOllamaMode === 'local'}
                    onChange={() => setLocalOllamaMode('local')}
                  />
                  Local / Self-hosted
                </label>
                <label className={`radio-pill ${localOllamaMode === 'cloud' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="ollama-mode"
                    value="cloud"
                    checked={localOllamaMode === 'cloud'}
                    onChange={() => setLocalOllamaMode('cloud')}
                  />
                  Ollama Cloud
                </label>
              </div>
            </div>

            {localOllamaMode === 'local' && (
              <>
                <div className="input-group">
                  <label>Base URL</label>
                  <input
                    type="text"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="e.g., http://localhost:11434"
                  />
                </div>

                <div className="input-group">
                  <label>Model Name</label>
                  <input
                    type="text"
                    value={inputModel}
                    onChange={(e) => setInputModel(e.target.value)}
                    placeholder="e.g., llama3, mistral"
                  />
                </div>

                <div className="input-group">
                  <label>API Key (Optional)</label>
                  <div className="input-with-toggle">
                    <input
                      type={showKey ? "text" : "password"}
                      value={inputKey}
                      onChange={(e) => setInputKey(e.target.value)}
                      placeholder="Only if your endpoint requires auth"
                    />
                    <button className="btn btn-ghost toggle-btn" onClick={() => setShowKey(!showKey)}>
                      {showKey ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {localOllamaMode === 'cloud' && (
              <>
                <div className="input-group">
                  <label>Cloud Model</label>
                  <select
                    value={OLLAMA_CLOUD_MODELS.includes(inputModel) ? inputModel : '__custom'}
                    onChange={(e) => {
                      if (e.target.value !== '__custom') setInputModel(e.target.value);
                    }}
                  >
                    {OLLAMA_CLOUD_MODELS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                    <option value="__custom">Custom…</option>
                  </select>
                  {!OLLAMA_CLOUD_MODELS.includes(inputModel) && (
                    <input
                      type="text"
                      value={inputModel}
                      onChange={(e) => setInputModel(e.target.value)}
                      placeholder="e.g., llama3.1:8b-cloud"
                      style={{ marginTop: '0.5rem' }}
                    />
                  )}
                </div>

                <div className="input-group">
                  <label>Ollama Cloud API Key <span className="required-mark">*</span></label>
                  <div className="input-with-toggle">
                    <input
                      type={showKey ? "text" : "password"}
                      value={inputKey}
                      onChange={(e) => setInputKey(e.target.value)}
                      placeholder="Get one at ollama.com/settings/keys"
                    />
                    <button className="btn btn-ghost toggle-btn" onClick={() => setShowKey(!showKey)}>
                      {showKey ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {apiKey && inputKey === apiKey && (
                    <div className="key-status success">
                      Current key: {getMaskedKey(apiKey)}
                    </div>
                  )}
                  <div className="key-hint">
                    Endpoint: <code>https://ollama.com/api/chat</code>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save Settings</button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;