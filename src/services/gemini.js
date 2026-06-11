/**
 * Service to handle Google Gemini API client-side interactions.
 */

// Retrieve the pre-configured developer Gemini API Key defined at build/compile time.
const DEVELOPER_GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

/**
 * Streams the response from the Gemini API.
 * 
 * @param {Object} params
 * @param {string} params.model - The selected model (e.g., 'Gemini 2.5 Flash' or 'Gemini 2.5 Pro').
 * @param {Array} params.messages - Conversational message history.
 * @param {string} [params.systemInstruction] - Optional system instruction.
 * @param {AbortSignal} [params.signal] - Abort signal to stop generation.
 */
export async function* streamGeminiResponse({ model, messages, systemInstruction, signal }) {
  const apiKey = DEVELOPER_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("AI service temporarily unavailable. Please check pre-configured API key setup.");
  }

  // Map brand/user-friendly names to actual stable Gemini API model IDs to resolve Permission Denied / Resource Exhausted errors
  let modelId = 'gemini-2.5-flash';
  if (model === 'Gemini 2.5 Pro' || (model && model.includes('Pro'))) {
    modelId = 'gemini-2.5-pro';
  } else {
    modelId = 'gemini-2.5-flash';
  }

  // Format messages into Gemini API structure to ensure correct request format:
  // contents: [{ role: 'user' | 'model', parts: [{ text: '...' }] }]
  const contents = messages.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  const makeRequest = async (targetModelId) => {
    // Standard stable v1 endpoint format using streamGenerateContent for live UI chunk updates
    const url = `https://generativelanguage.googleapis.com/v1/models/${targetModelId}:streamGenerateContent?alt=sse&key=${apiKey}`;
    const body = {
      contents,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
      }
    };
    if (systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    // --- DEBUG LOGGING (Requirement 6) ---
    console.log("--- Gemini API Debug Log ---");
    console.log("API URL Appending Key Check:", url.includes("key=") ? "API Key is appended as query parameter" : "NO KEY APPENDED");
    console.log("API Endpoint target model ID:", targetModelId);
    console.log("API Key loaded at runtime length:", apiKey ? apiKey.length : "0 (undefined)");
    console.log("Request Payload JSON Format:", JSON.stringify(body, null, 2));
    console.log("----------------------------");

    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal,
    });
  };

  // OPTIONAL IMPROVEMENT COMMENT:
  // "Use a backend proxy (Vercel/Node server) if browser requests are restricted."
  // Note: Direct browser-to-API calls will expose the key in network tab and could face CORS limits.
  // Implementing a server proxy API endpoint is the recommended security best practice for production apps.

  let response;
  try {
    response = await makeRequest(modelId);
  } catch (err) {
    if (modelId !== 'gemini-2.5-flash') {
      console.warn(`Connection to ${modelId} failed. Falling back to gemini-2.5-flash...`, err);
      modelId = 'gemini-2.5-flash';
      response = await makeRequest(modelId);
    } else {
      throw err;
    }
  }

  if (!response.ok) {
    let errorDetail = "";
    try {
      const errorJson = await response.json();
      console.error("Gemini API raw error response:", errorJson);
      if (errorJson?.error?.message) {
        errorDetail = errorJson.error.message;
      } else {
        errorDetail = JSON.stringify(errorJson);
      }
    } catch (e) {
      errorDetail = response.statusText || String(e);
    }

    // If selected model failed with quota limit or general error, try to fall back to gemini-2.5-flash automatically
    if (modelId !== 'gemini-2.5-flash' && (response.status === 429 || response.status === 404 || response.status === 400)) {
      console.warn(`Model ${modelId} failed with status ${response.status}: ${errorDetail}. Automatically falling back to highly available gemini-2.5-flash...`);
      modelId = 'gemini-2.5-flash';
      response = await makeRequest(modelId);
      
      if (!response.ok) {
        try {
          const errorJson = await response.json();
          errorDetail = errorJson?.error?.message || JSON.stringify(errorJson);
        } catch (e) {
          errorDetail = response.statusText || String(e);
        }
      }
    }
  }

  if (!response.ok) {
    let errorDetail = "";
    try {
      const errorJson = await response.json();
      if (errorJson?.error?.message) {
        errorDetail = errorJson.error.message;
      } else {
        errorDetail = JSON.stringify(errorJson);
      }
    } catch (e) {
      errorDetail = response.statusText || String(e);
    }

    // Detailed debug console logs
    console.error("--- Gemini API Error Details Summary ---");
    console.error("- Response HTTP Status:", response.status);
    console.error("- Raw Gemini Error Message:", errorDetail);
    console.error("----------------------------------------");

    // Clear user friendly error categories:
    const isPermissionError = 
      response.status === 403 || 
      response.status === 401 ||
      errorDetail.toUpperCase().includes("PERMISSION_DENIED") || 
      errorDetail.toLowerCase().includes("permission denied") || 
      errorDetail.toLowerCase().includes("api key not valid") ||
      errorDetail.toLowerCase().includes("invalid api key") ||
      errorDetail.toLowerCase().includes("key not found") ||
      errorDetail.toLowerCase().includes("invalid key");

    if (isPermissionError) {
      throw new Error("AI service access denied. Please check API configuration.");
    }

    const isQuotaError = 
      response.status === 429 || 
      errorDetail.toUpperCase().includes("QUOTA") || 
      errorDetail.toLowerCase().includes("quota exceeded") || 
      errorDetail.toLowerCase().includes("resource exhausted") ||
      errorDetail.toLowerCase().includes("rate limit");

    if (isQuotaError) {
      throw new Error("AI service is currently busy or quota exceeded. Please try again in a moment.");
    }

    // Default friendly fallback error
    throw new Error("AI service temporarily unavailable. Please try again later.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      // Keep the last partial line in the buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        // SSE messages start with "data: "
        if (trimmedLine.startsWith('data: ')) {
          const jsonText = trimmedLine.substring(6).trim();
          if (jsonText === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(jsonText);
            const textChunk = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textChunk) {
              yield textChunk;
            }
          } catch (e) {
            // Ignore formatting errors from intermediate SSE frames
          }
        }
      }
    }
    
    // Process remaining buffer if it starts with data:
    const trimmedBuffer = buffer.trim();
    if (trimmedBuffer && trimmedBuffer.startsWith('data: ')) {
      const jsonText = trimmedBuffer.substring(6).trim();
      try {
        const parsed = JSON.parse(jsonText);
        const textChunk = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textChunk) {
          yield textChunk;
        }
      } catch (e) {}
    }
  } finally {
    reader.releaseLock();
  }
}
