// Deprecated browser-side Gemini service.
// All Gemini API requests now go through the secure backend at /api/chat.

export function unsupportedClientCall() {
  throw new Error('Direct Gemini calls are disabled in the frontend. Use /api/chat instead.');
}
