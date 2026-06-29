const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const { parseExcel } = require('../services/excelParser');
const { analyzeData } = require('../services/dataAnalyzer');
const { generateFiveWhy, generateWhyStep, generateRootCause } = require('../services/geminiService');
const { generateFiveWhyOllama, generateWhyStep: generateWhyStepOllama, generateRootCause: generateRootCauseOllama } = require('../services/ollamaService');
const { generateWordDoc } = require('../services/wordExporter');

const upload = multer({ dest: path.join(__dirname, '../uploads/') });

router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const filePath = req.file.path;
    const { data, columns, totalRows } = parseExcel(filePath);
    
    // Clean up uploaded file
    fs.unlinkSync(filePath);
    
    const sessionId = uuidv4();
    global.sessions.set(sessionId, data);
    
    res.json({ sessionId, data, columns, totalRows });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/analyze', (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId || !global.sessions.has(sessionId)) {
      return res.status(404).json({ error: 'Session not found or expired' });
    }
    
    const data = global.sessions.get(sessionId);
    const analysis = analyzeData(data);
    
    res.json(analysis);
  } catch (error) {
    console.error('Analyze Error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/five-why', async (req, res) => {
  try {
    const { provider = 'gemini', apiKey, ollamaUrl, ollamaModel, ollamaMode = 'local', category, directCause, defectCount, percentage, sampleDefects } = req.body;

    let result;
    if (provider === 'gemini') {
      if (!apiKey) return res.status(400).json({ error: 'Gemini API Key is required' });
      result = await generateFiveWhy({ apiKey, category, directCause, defectCount, percentage, sampleDefects });
    } else if (provider === 'ollama') {
      if (ollamaMode === 'cloud') {
        result = await generateFiveWhyOllama({ ollamaMode, ollamaModel, apiKey, category, directCause, defectCount, percentage, sampleDefects });
      } else {
        if (!ollamaUrl || !ollamaModel) return res.status(400).json({ error: 'Ollama URL and Model are required' });
        result = await generateFiveWhyOllama({ ollamaMode, ollamaUrl, ollamaModel, apiKey, category, directCause, defectCount, percentage, sampleDefects });
      }
    } else {
      return res.status(400).json({ error: 'Invalid provider specified' });
    }

    res.json(result);
  } catch (error) {
    console.error('Five-Why Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Sequential chain endpoint: Why N is built from Why N-1's response.
// Streams each step as SSE (event: 'why' / 'summary' / 'error' / 'done').
router.post('/five-why-chain', async (req, res) => {
  const { provider = 'gemini', apiKey, ollamaUrl, ollamaModel, ollamaMode = 'local', category, directCause, defectCount, percentage, sampleDefects } = req.body;

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const send = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    if (provider === 'gemini' && !apiKey) {
      send('error', { message: 'Gemini API Key is required' });
      return res.end();
    }
    if (provider === 'ollama' && ollamaMode === 'local' && (!ollamaUrl || !ollamaModel)) {
      send('error', { message: 'Ollama URL and Model are required' });
      return res.end();
    }
    if (provider === 'ollama' && ollamaMode === 'cloud' && !apiKey) {
      send('error', { message: 'Ollama Cloud API key is required' });
      return res.end();
    }

    const stepFn = provider === 'gemini' ? generateWhyStep : generateWhyStepOllama;
    const summaryFn = provider === 'gemini' ? generateRootCause : generateRootCauseOllama;
    const baseParams = provider === 'gemini'
      ? { apiKey, category, directCause, defectCount, percentage, sampleDefects }
      : { ollamaMode, ollamaUrl, ollamaModel, apiKey, category, directCause, defectCount, percentage, sampleDefects };

    const priorWhys = [];

    for (let level = 1; level <= 5; level++) {
      const step = await stepFn({ ...baseParams, level, priorWhys });
      if (step.error) {
        send('error', { level, message: step.error });
        return res.end();
      }
      priorWhys.push({ question: step.question, response: step.response });
      send('why', { level, question: step.question, response: step.response });
    }

    const summary = await summaryFn({
      ...(provider === 'gemini' ? { apiKey } : { ollamaMode, ollamaUrl, ollamaModel, apiKey }),
      category,
      priorWhys
    });
    if (summary.error) {
      send('error', { message: summary.error });
      return res.end();
    }
    send('summary', { rootCause: summary.rootCause, actions: summary.actions });
    send('done', {});
    res.end();
  } catch (error) {
    console.error('Five-Why Chain Error:', error);
    send('error', { message: error.message });
    res.end();
  }
});

router.post('/export-word', async (req, res) => {
  try {
    const { analysisData, fiveWhyResults } = req.body;
    const docBuffer = await generateWordDoc({ analysisData, fiveWhyResults });
    
    res.setHeader('Content-Disposition', 'attachment; filename=Defect-RCA-Report.docx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(docBuffer);
  } catch (error) {
    console.error('Export Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
