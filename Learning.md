# Learning

Within this file you will put all the lessons you learned from mistakes that you have made

## Lesson 1: Never put real credentials in .env.example
`.env.example` gets committed to git. Only use placeholder values like `your_key_here`. Real keys belong in `.env` (which is gitignored). If real keys are accidentally committed, they must be rotated immediately since git history preserves them even after removal.

## Lesson 2: Hooks with side effects (navigate, API calls) need a single provider
If a custom hook runs side effects (like a profile check + redirect), calling it from multiple components creates duplicate API calls and race conditions. Wrap the logic in a context provider so it runs once, and have the hook only consume the context.

## Lesson 3: Loading state must cover the full async gap
When chaining async steps (Auth0 loads → profile check runs), ensure `isLoading` is `true` during the gap between steps. Otherwise components flash wrong content. Use: `isLoading: auth0Loading || isCheckingProfile || (isAuthenticated && !profileChecked)`.

## Lesson 4: Always protect routes that require authentication
Routes like `/signup` that depend on a logged-in user must have a route guard (`RequireAuth`) that redirects unauthenticated visitors. Otherwise users see broken pages with null user data.
