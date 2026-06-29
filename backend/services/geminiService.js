const { GoogleGenerativeAI } = require('@google/generative-ai');

function baseSystemContext({ category, defectCount, percentage, sampleDefects }) {
  return `You are a software quality expert performing Root Cause Analysis (RCA) using the 5 Why technique.

Output format rules (mandatory, project system prompt):
- Keep every response under 50 words.
- Preserve full sense; do not sacrifice meaning for brevity.
- Lead with the key point; cut filler, hedges, and pleasantries.

Context (fixed across all 5 whys):
- Defect Category: ${category}
- This category accounts for ${defectCount} defects (${percentage}% of total)
- Sample defects in this category:
${sampleDefects.map(d => `- [${d.id}] ${d.summary}`).join('\n')}`;
}

function buildWhyPrompt({ level, category, defectCount, percentage, sampleDefects, priorInput, priorWhys }) {
  const system = baseSystemContext({ category, defectCount, percentage, sampleDefects });

  if (level === 1) {
    return `${system}

The team has identified this DIRECT CAUSE for the category "${category}":
"${priorInput}"

Your task: Draft Why 1 by asking a probing question whose answer would uncover what allowed this direct cause to occur, then provide a likely response that advances the chain toward a systemic root cause.

Respond in this exact JSON format only (no markdown, no code fences):
{
  "question": "Why 1: Why is '${priorInput}' happening? (in the context of category ${category})",
  "response": "<detailed response that becomes the input for Why 2>"
}

CRITICAL formatting rule: In the "response" field, return ONLY the Why-1 response text itself. Do NOT prefix it with "Why 1:", "Response 1:", "Answer:", or any other label. The UI already labels each Why.`;
  }

  const history = priorWhys
    .map((w, i) => `Why ${i + 1} (Response): ${w.response}`)
    .join('\n\n');

  return `${system}

Prior chain of reasoning:
${history}

The response to the previous Why was:
"${priorInput}"

Your task: Draft Why ${level} that digs ONE level deeper than the previous answer. The question must be a natural follow-up to "${priorInput}", and the response should expose a more systemic cause (process, governance, skill, tooling, or culture) than what was stated before.

Respond in this exact JSON format only (no markdown, no code fences):
{
  "question": "Why ${level}: <probing follow-up to '${priorInput.slice(0, 200)}...'>",
  "response": "<detailed response that becomes the input for Why ${level + 1}>"
}

CRITICAL formatting rule: In the "response" field, return ONLY the Why-${level} response text itself. Do NOT prefix it with "Why ${level}:", "Response ${level}:", "Answer:", or any other label. The UI already labels each Why.`;
}

function buildSummaryPrompt({ category, priorWhys }) {
  const history = priorWhys
    .map((w, i) => `Why ${i + 1}: ${w.question}\nResponse ${i + 1}: ${w.response}`)
    .join('\n\n');

  return `You are a software quality expert. Below is a completed 5-Why chain for defect category "${category}":

${history}

Based on this chain, provide:
1. A concise "Root Cause" statement that captures the deepest systemic cause (1-2 sentences).
2. 3-5 concrete recommended actions to address the root cause.

Respond in this exact JSON format only (no markdown, no code fences):
{
  "rootCause": "<concise root cause>",
  "actions": ["Action 1", "Action 2", "Action 3", "Action 4"]
}`;
}

function cleanJsonText(text) {
  if (!text) return text;
  return text.replace(/```json\n/g, '').replace(/```\n?/g, '').trim();
}

function emptyFailure(message) {
  return {
    question: '',
    response: '',
    error: message
  };
}

function stripLabelPrefix(text, level) {
  if (!text) return text;
  return text
    .replace(/^\s*(Why\s*\d+\s*[:.\-]\s*|Question\s*\d*\s*[:.\-]\s*|Answer\s*[:.\-]\s*)/i, '')
    .trim();
}

async function generateWhyStep({ apiKey, level, category, directCause, defectCount, percentage, sampleDefects, priorWhys }) {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const priorInput = level === 1 ? directCause : (priorWhys[priorWhys.length - 1]?.response || '');
    const prompt = buildWhyPrompt({ level, category, defectCount, percentage, sampleDefects, priorInput, priorWhys });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
    });

    const text = cleanJsonText(result.response.text());
    const parsed = JSON.parse(text);
    return {
      question: stripLabelPrefix(parsed.question || '', level),
      response: stripLabelPrefix(parsed.response || '', level),
      error: null
    };
  } catch (error) {
    console.error(`Gemini Why-${level} Error:`, error);
    return emptyFailure(error.message);
  }
}

async function generateRootCause({ apiKey, category, priorWhys }) {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = buildSummaryPrompt({ category, priorWhys });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.5, maxOutputTokens: 1024 }
    });

    const text = cleanJsonText(result.response.text());
    const parsed = JSON.parse(text);
    return {
      rootCause: parsed.rootCause || '',
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      error: null
    };
  } catch (error) {
    console.error('Gemini RootCause Error:', error);
    return { rootCause: '', actions: [], error: error.message };
  }
}

async function generateFiveWhy(params) {
  return await generateWhyStep({ ...params, level: 1 });
}

module.exports = { generateFiveWhy, generateWhyStep, generateRootCause };