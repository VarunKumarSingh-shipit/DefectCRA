import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE
});

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const analyzeData = async (sessionId) => {
  const response = await api.post('/api/analyze', { sessionId });
  return response.data;
};

export const generateFiveWhy = async (params) => {
  const response = await api.post('/api/five-why', params);
  return response.data;
};

export const exportWord = async (params) => {
  const response = await api.post('/api/export-word', params, {
    responseType: 'blob'
  });
  return response.data;
};

// Streams the 5-Why chain via SSE.
// onEvent receives { type, payload } where type in: 'why' | 'summary' | 'error' | 'done'
export const generateFiveWhyChain = async (params, onEvent, signal) => {
  const response = await fetch(`${API_BASE}/api/five-why-chain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    signal
  });

  if (!response.ok || !response.body) {
    throw new Error(`Chain request failed: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by blank lines
    let sepIndex;
    while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
      const rawEvent = buffer.slice(0, sepIndex);
      buffer = buffer.slice(sepIndex + 2);

      let event = 'message';
      const dataLines = [];
      for (const line of rawEvent.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
      }
      if (dataLines.length === 0) continue;
      let payload;
      try { payload = JSON.parse(dataLines.join('\n')); } catch { payload = dataLines.join('\n'); }
      onEvent({ type: event, payload });

      if (event === 'done' || event === 'error') return;
    }
  }
};