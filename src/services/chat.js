export async function sendChatRequest({ model, messages, signal }) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model, messages }),
    signal
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.message || `Server error: ${response.statusText || response.status}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  if (payload?.error) {
    const error = new Error(payload.message || 'AI request failed.');
    error.status = response.status;
    throw error;
  }

  return payload.aiResponse || '';
}
