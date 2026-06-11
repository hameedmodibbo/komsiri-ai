export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: true, message: 'Method not allowed. Use POST.' });
  }

  if (!req.headers['content-type']?.includes('application/json')) {
    return res.status(400).json({ error: true, message: 'Request body must be JSON.' });
  }

  const { messages, model } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: true, message: 'Please send a non-empty chat history.' });
  }

  if (!messages.every((msg) => msg && typeof msg.role === 'string' && typeof msg.content === 'string')) {
    return res.status(400).json({ error: true, message: 'Each message must include a role and text content.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: true, message: 'AI service configuration is missing.' });
  }

  const getModelId = (selectedModel) => {
    if (typeof selectedModel !== 'string') return 'gemini-2.0-flash';
    const normalized = selectedModel.toLowerCase();
    if (normalized.includes('2.0 pro') || normalized.includes('pro')) return 'gemini-2.0-pro';
    if (normalized.includes('2.0 flash') || normalized.includes('flash')) return 'gemini-2.0-flash';
    return 'gemini-2.0-flash';
  };

  const modelId = getModelId(model);

  const promptText = messages
    .map((msg) => {
      if (msg.role === 'user') return `User: ${msg.content}`;
      if (msg.role === 'system') return `System: ${msg.content}`;
      return `Assistant: ${msg.content}`;
    })
    .join('\n') + '\nAssistant:';

  const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${modelId}:generateContent`;
  const payload = {
    prompt: {
      text: promptText
    },
    temperature: 0.7,
    topP: 0.95,
    maxOutputTokens: 640,
    candidateCount: 1
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => null);
      const detail = errorPayload?.error?.message || errorPayload?.message || response.statusText;
      const status = response.status === 401 || response.status === 403 ? 403 : response.status;
      const userMessage =
        status === 403
          ? 'AI access denied. Please verify your API key and permissions.'
          : response.status === 429
          ? 'AI service is busy. Please wait a moment and try again.'
          : `AI service returned an error: ${detail}`;
      return res.status(status).json({ error: true, message: userMessage });
    }

    const data = await response.json();
    const aiResponse =
      data?.candidates?.[0]?.content?.[0]?.text ||
      data?.candidates?.[0]?.content?.[0]?.text ||
      data?.output?.[0]?.content?.[0]?.text ||
      data?.output?.text ||
      '';

    if (!aiResponse) {
      return res.status(502).json({ error: true, message: 'AI service returned an empty response.' });
    }

    return res.status(200).json({ error: false, aiResponse });
  } catch (error) {
    console.error('chat.js error:', error);
    return res.status(502).json({
      error: true,
      message: 'Unable to reach AI service right now. Please try again later.'
    });
  }
}
