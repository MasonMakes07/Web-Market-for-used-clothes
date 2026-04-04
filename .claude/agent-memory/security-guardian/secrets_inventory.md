---
name: Secrets Inventory
description: Tracks all secret/credential locations, leak history, and current handling status
type: project
---

## Known credential leak (2026-04-04)
Commit `20ae780` wrote real Supabase URL, anon key, Auth0 domain, client ID, and audience into `.env.example`. Removed in `eccb40b`, placeholders restored in `84fc1b4`. Per Learning.md Lesson 1, credentials were reportedly rotated same day. Git history still contains the real values.

**Why:** Tracking leak history ensures rotation is verified and pattern is not repeated.

**How to apply:** On any PR touching .env.example or config, verify only placeholders are present. Recommend pre-commit secret scanner.

## Current secrets by location

| Secret | Location | Status |
|---|---|---|
| VITE_SUPABASE_URL | Frontend .env (VITE_ prefix, public) | OK -- public by design |
| VITE_SUPABASE_ANON_KEY | Frontend .env (VITE_ prefix, public) | OK -- limited by RLS |
| VITE_AUTH0_DOMAIN | Frontend .env (VITE_ prefix, public) | OK -- public by design |
| VITE_AUTH0_CLIENT_ID | Frontend .env (VITE_ prefix, public) | OK -- public by design |
| VITE_AUTH0_AUDIENCE | Frontend .env (VITE_ prefix, public) | OK -- public by design |
| VITE_PRICE_HINT_API | Frontend .env (VITE_ prefix, public) | OK -- just a URL |
| BROWSER_USE_API_KEY | backend/.env (server-side only) | OK -- never sent to frontend |
| ALLOWED_ORIGINS | backend/.env (server-side only) | OK |
| auth0_client_secret | NOT YET ADDED | Must be server-side only when added |
| FERNET_KEY | NOT YET ADDED | Must be added for Phase 2 refresh token encryption |

## Open security debt
- No rate limiting on /price-hint endpoint (H2)
- No pre-commit secret scanner installed (L1)
- backend/.env not explicitly listed in .gitignore (H1, currently covered by recursive pattern)
- No security headers middleware on FastAPI backend (M2)
