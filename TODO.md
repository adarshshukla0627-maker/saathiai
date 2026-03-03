# TODO: Combine Frontend, Backend, and Database into One URL (Netlify Deployment)

## ✅ Project Already Configured for Netlify!

Your project is **already set up** for Netlify deployment with frontend, backend, and database all under one URL.

## How It Works

| Component | Location | How It's Served |
|-----------|----------|----------------|
| **Frontend** | `client/` (React + Vite) | Built to `dist/client`, served via `netlify.toml` publish |
| **Backend** | `netlify/functions/` | API routes via redirects in `netlify.toml` |
| **Database** | Neon PostgreSQL | Connected via `DATABASE_URL` env variable |

## API Routes (Already Configured)

All `/api/*` requests are redirected to Netlify Functions:

```
/api/auth/signup     → /.netlify/functions/auth/signup
/api/auth/login      → /.netlify/functions/auth/login
/api/conversations   → /.netlify/functions/chat/conversations
/api/conversations/* → /.netlify/functions/chat/conversation
```

## Deployment Steps

### 1. Set Environment Variable
In **Netlify Dashboard** → **Site settings** → **Environment variables**:
- Add: `DATABASE_URL` = your Neon PostgreSQL connection string

### 2. Optional: Add OpenAI (for AI responses)
- Add: `AI_INTEGRATIONS_OPENAI_API_KEY` = your OpenAI API key
- Add: `AI_INTEGRATIONS_OPENAI_BASE_URL` = (optional custom endpoint)

### 3. Deploy
```bash
# Option A: Via Netlify CLI
netlify deploy --prod

# Option B: Connect GitHub repository to Netlify
# Just push to GitHub and Netlify auto-deploys
```

## Result
Your app will be live at: `https://your-site-name.netlify.app`
- Frontend: ✅ served from same URL
- Backend API: ✅ handled by Netlify Functions
- Database: ✅ connected to Neon PostgreSQL

