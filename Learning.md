# Learning

Within this file you will put all the lessons you learned from mistakes that you have made

## Lesson 1: Never put real credentials in .env.example
`.env.example` gets committed to git. Only use placeholder values like `your_key_here`. Real keys belong in `.env` (which is gitignored). If real keys are accidentally committed, they must be rotated immediately since git history preserves them even after removal. Credentials were rotated on 2026-04-04 after this incident.

## Lesson 2: Hooks with side effects (navigate, API calls) need a single provider
If a custom hook runs side effects (like a profile check + redirect), calling it from multiple components creates duplicate API calls and race conditions. Wrap the logic in a context provider so it runs once, and have the hook only consume the context.

## Lesson 3: Loading state must cover the full async gap
When chaining async steps (Auth0 loads → profile check runs), ensure `isLoading` is `true` during the gap between steps. Otherwise components flash wrong content. Use: `isLoading: auth0Loading || isCheckingProfile || (isAuthenticated && !profileChecked)`.

## Lesson 4: Always protect routes that require authentication
Routes like `/signup` that depend on a logged-in user must have a route guard (`RequireAuth`) that redirects unauthenticated visitors. Otherwise users see broken pages with null user data.

## Lesson 5: Always set seller_id from the auth session, never from user input
Service functions that create records tied to a user must accept `userId` as a separate parameter and set `seller_id` explicitly — never spread user-controlled data that could include a spoofed `seller_id`.

## Lesson 6: Whitelist fields on update operations
When updating database rows, only allow known safe fields through. Spreading the entire `updates` object lets attackers modify `status`, `seller_id`, or `created_at`. Use a whitelist like `UPDATABLE_FIELDS`.

## Lesson 7: All write/delete operations need ownership checks
Every `update` and `delete` query must include `.eq("seller_id", userId)` so users can only modify their own records. This is defense-in-depth alongside Supabase RLS.

## Lesson 8: Stale response protection on async fetches
When multiple fetches can fire (rapid clicks, re-renders), use a `fetchIdRef` counter so only the latest response updates state. Otherwise older responses can overwrite newer data.

## Lesson 9: Validate IDs before interpolating into Supabase .or() filters
Supabase's `.or()` method takes a raw filter string. If user-controlled IDs are interpolated without validation, an attacker can inject filter syntax to alter the query and access unauthorized data. Always validate IDs match a safe pattern (e.g., `/^[\w|:-]+$/`) before interpolation.

## Lesson 10: Use separate fetchIdRefs for independent fetch operations
If two independent async operations (e.g., fetchConversations and fetchMessages) share one fetchIdRef, one operation can cancel the other's response. Each independent fetch needs its own counter ref.
