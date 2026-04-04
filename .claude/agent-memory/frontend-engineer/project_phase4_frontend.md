---
name: Phase 4 frontend — file locations and API shapes
description: What files exist in the frontend after Phase 4, which endpoints each file calls, and key implementation decisions
type: project
---

All frontend source code lives in `frontend/src/`. The scaffold (index.html, vite.config.js, package.json) lives in `frontend/`.

## File map

| File | Purpose |
|---|---|
| `src/main.jsx` | React entry point — mounts App to #root |
| `src/App.jsx` | Auth0Provider + BrowserRouter + all routes |
| `src/styles/index.css` | Global styles using CSS custom properties |
| `src/api/client.js` | `createApiClient(getAccessTokenSilently)` — returns `{ get, post, put, del }` |
| `src/components/ProtectedRoute.jsx` | Redirects unauthenticated users to `/` |
| `src/components/Navbar.jsx` | Sticky top bar with avatar, name, logout |
| `src/components/CategoryManager.jsx` | Category CRUD with reorder and delete |
| `src/pages/LoginPage.jsx` | Public landing page — redirects if already authed |
| `src/pages/CallbackPage.jsx` | Auth0 redirect target — routes to /onboarding or /dashboard |
| `src/pages/OnboardingPage.jsx` | New-user setup: time prefs + CategoryManager |
| `src/pages/DashboardPage.jsx` | Placeholder dashboard |

## API calls by component

- **CallbackPage**: `GET /users/me` → checks `onboarding_complete`
- **OnboardingPage**: `PUT /users/me/preferences` with `{ productive_start, productive_end, wake_time, sleep_time }` all in `HH:MM:SS` format
- **CategoryManager**: `GET /categories`, `POST /categories`, `PUT /categories/reorder` with `{ category_ids: [...] }`, `DELETE /categories/{id}`

## Key decisions

- `apiClient` is created with `useMemo` in OnboardingPage to avoid re-triggering CategoryManager's `useEffect([apiClient])` on every render.
- Time inputs give `HH:MM`; backend expects `HH:MM:SS` — OnboardingPage appends `:00` before sending.
- CategoryManager uses optimistic updates with rollback on reorder.
- `frontend/.env.example` shows required vars: `VITE_AUTH0_DOMAIN`, `VITE_AUTH0_CLIENT_ID`, `VITE_AUTH0_AUDIENCE`, `VITE_API_BASE_URL`.

**Why:** Phase 4 was the onboarding and category management build-out.
**How to apply:** When adding new pages or API calls, follow these existing patterns for auth, error handling, and CSS class naming.
