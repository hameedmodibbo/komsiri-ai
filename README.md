<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/71ca517a-b003-43a2-a734-aa07aa48c0f0

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` as an environment variable in Vercel for production.
   - Do not hardcode the key in frontend source code.
   - For local testing with the Vercel development server, use `.env.local`:
     `GEMINI_API_KEY=your_key_here`
3. Run the local app frontend with Vite:
   `npm run dev`
4. Use `vercel dev` to run the secure serverless backend locally together with the frontend.
