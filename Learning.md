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

## Lesson 11: Test phone previews on insecure LAN origins
`crypto.randomUUID()` is restricted to secure contexts and may be absent when an iPhone opens the Mac's HTTP LAN address. Use a `crypto.getRandomValues()` fallback for local identifiers, and test that path explicitly. Camera upload may work on HTTP, but production installation, service workers, and OAuth require an HTTPS deployment.

## Lesson 12: Keep local preview persistence ordered and explicit
Serialize IndexedDB writes so rapid edits cannot finish out of order. Display storage failures and never replace existing data when the initial read fails. A local preview must not imply messages, reports, or listings were delivered to other students.

## Lesson 13: Review the phone viewport after visual changes
A layout can pass overflow checks while a tall hero pushes the inventory below the first screen. Keep the mobile introduction compact, inspect screenshots, and search for split or lowercase brand text when renaming an app.

## Lesson 14: Separate university sign-in from student authorization
A named enterprise redirect is only a login integration. Do not infer active enrollment from a UCSD email, a successful Duo flow, or an editable local profile. Keep campus signup visibly unavailable until the identity connection exists, and require server-side student approval for shared data.

## Lesson 15: Enforce requested price research and deduplicate billing
Allowing a web-search tool does not guarantee it runs. Require the tool when the user opts into price research, verify real search-call output, and cache identical per-account scans behind authentication. Never deploy SQLite quotas on an ephemeral filesystem.

## Lesson 16: Distinguish initial null from "no results" null
When a hook starts as null and no-results also sets null, use a separate hasSearched flag so no-results messages do not appear before searching.
