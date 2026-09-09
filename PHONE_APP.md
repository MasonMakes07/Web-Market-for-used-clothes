# Triton Thrift phone app foundation

**Current sign-in update:** the requested Google/Apple fallback is implemented in code. Follow [SOCIAL_SIGN_IN.md](SOCIAL_SIGN_IN.md) for provider configuration and current scanner verification status. The campus instructions below describe the original campus mode, which remains the server default until social mode is explicitly enabled.

The default app is now a mobile-first React web app, built to become the home-screen app in the launch plan. This is working base code, not a native iOS binary or a deployed multi-user marketplace.

## Run and try it

```sh
npm install
npm run dev:phone
```

Open the printed **Network** address in Safari on an iPhone connected to the same Wi-Fi as the Mac. Keep the Mac and terminal running. The exact address can change when Wi-Fi changes. Connecting a cable or using phone mirroring is optional.

Local HTTP supports testing the interface and file uploads. Production installation, service workers, and Auth0 require a trusted HTTPS origin (localhost is treated specially on the Mac). Do not configure Auth0 to send an iPhone back to `localhost`: that means the phone itself. Use an HTTPS staging deployment for real phone sign-in and installation checks.

## Implemented now

- Responsive Discover, Saved, Sell, Inbox and Profile screens, campus branding and accessible dialogs.
- Search, category/college/condition/price filters and price sorting.
- Six-photo listing uploads, camera input, JPEG compression and saved drafts.
- Device-local listing publication, free items, saved items, profile editing and active/reserved/sold status.
- Device-local chat, explicit sample acceptance of meetup proposals, cancellations, Google Calendar handoff and Apple Calendar `.ics` exports.
- IndexedDB persistence, visible storage errors, data reset and local report/block controls.
- PWA manifest, PNG icons, installation instructions and a production-only offline fallback page. Private content is not cached by the service worker.
- Optional real Auth0-authenticated scanner API using OpenAI vision and structured outputs. Optional web research supplies linked comparable **asking** prices, only when at least two distinct returned source URLs support the output. Price extraction is AI-assisted, not a verified appraisal.

The sample inventory and conversations are clearly marked. Publishing and messaging save to this device; they do not contact the existing Supabase production database or other students. Calendar exports create separate event copies and do not synchronize later changes.

## Connect the real scanner

Use `phone.env.example` and `backend/scanner.env.example` as references. The pre-existing deletion of `.env.example` was left untouched.

1. Configure an Auth0 SPA and API audience. Add your HTTPS staging origin (or `http://localhost:5173` for Mac testing) to callback URLs, allowed web origins and logout URLs.
2. Put the public Auth0 client configuration, API audience, and scanner server URL in `.env.local` using the names from `phone.env.example`. All four values are required to enable scanner sign-in.
3. Put `OPENAI_API_KEY`, `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, permitted frontend origins, and approved Auth0 subjects in `backend/.env`. These are server settings; never put the API key into a `VITE_` variable.
4. Before adding an Auth0 subject to the pilot allowlist, independently verify its UCSD email and current-student eligibility. The local profile's college selection is not approval.
5. Install and launch the independent scanner service:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r backend/scanner-requirements.txt
.venv/bin/python -m uvicorn backend.scanner:app --host 127.0.0.1 --port 8000
```

6. Restart Vite after changing `.env.local`. In Sell, upload photos, select the explicit OpenAI consent checkbox, optionally enable price research, and sign in to scan. Review the returned draft before using its details or suggested asking price.

The server uses one Responses API call per scan, at most one web-search tool call, and at most 1,800 output tokens. Default limits are **5 attempts per student per UTC day** and **200 attempts total per UTC month**. Failed paid attempts count too. SQLite reservations happen atomically before dispatch. Keep `backend/runtime/` persistent and shared by all workers on the host; multiple independent replicas would need a shared database quota implementation.

Identical successful scans are reused per account for 24 hours; duplicate in-flight requests are rejected before billing. Cache entries store structured results and hashes, not original photos. These are request-count limits, not an exact dollar cap. Model selection, image size and search output affect billing. Measure actual usage before allowing more than the initial pilot. A live smoke test with one public sample hoodie photo passed after configuring the server key. Price research was not requested in that test; end-to-end authenticated phone scanning remains to be tested.

API references: [images and vision](https://developers.openai.com/api/docs/guides/images-vision), [structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [pricing](https://developers.openai.com/api/docs/pricing).

## Build and verify

```sh
npm run build
npm run preview -- --host 0.0.0.0
npm run lint
npm test
npm run test:e2e
npm run test:pwa
.venv/bin/python -m unittest backend.test_scanner
```

Browser tests use locally installed Google Chrome for desktop and iPhone-sized touch emulation. They do not replace Safari testing on a real iPhone. Tests cover durable listing creation, saved filters, deletion confirmation, chat/calendar flows, missing scanner configuration, storage failure and the insecure-origin ID fallback. The server suite uses generated test tokens and mocked OpenAI responses; it does not use real credentials or bill an API account.

The original website remains available by setting `VITE_APP_EXPERIENCE=legacy` and retaining its original Auth0/Supabase configuration. The new default path loads independently and makes no legacy database calls.

## Remaining before a student launch

Connect the new screens to an authenticated shared repository backed by the existing Supabase project. First inspect the actual tables and row-level policies, bridge Auth0 identity properly, and add versioned migrations for saves, multiple photos, meetups and approvals. Local preview storage is intentionally not a security boundary or account system.

Implement real conversation delivery and meetup acceptance with participant-only permissions, server moderation/report handling, shared account deletion, and an enrollment-verification process. Complete real-photo scanner quality/cost tests, review source matches, and deploy a trusted HTTPS staging site before inviting students. App Store/TestFlight distribution and native Expo screens remain the next phase; your friend's individual Apple account will handle signing and publisher ownership.

## UCSD account signup

The Profile page now includes a university signup/sign-in entry point. See [UCSD_SIGN_IN.md](UCSD_SIGN_IN.md) for identity-provider setup and a complete feature status table. `VITE_UCSD_AUTH0_CONNECTION` enables the configured campus enterprise redirect independently of scanner settings. Without it, the app honestly shows signup as unavailable; local preview data remains separate from signed-in accounts.

## Add item photos from your phone

Open Sell and tap **Add photo** to choose from your photo library, or **Take photo** to open the phone camera picker. Desktop users can drag files into the same photo area. Photos appear as thumbnails; remove one with its close button or choose **Make cover**. Up to six photos are saved with the device draft, and the first three are used when you explicitly request an AI scan. File upload does not require campus login, but live AI scanning still does.
