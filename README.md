# Tritons Thrifts

A phone-first UCSD marketplace for secondhand clothing, campus finds, and meetup planning.

**Current release is a working device preview.** Listings, saved items, messages, and profile edits stay in this browser. UCSD sign-in and public multi-user trading are not live yet. The scanner uses only OpenAI and requires a verified campus identity and a separately approved student account.

## Try it locally

```sh
git clone https://github.com/MasonMakes07/Web-Market-for-used-clothes.git
cd Web-Market-for-used-clothes
npm ci
npm run dev:phone
```

Open the printed Network address on the same Wi-Fi, or use `http://localhost:5173` on the Mac. The app's preview needs no secrets. Production phone installation and sign-in need HTTPS.

## Included

- Discover, saved items, search and campus/category/price filters.
- Six-photo uploads, camera input, editable listings, and reserved/sold status.
- Local conversations and campus pickup planning, Google Calendar links and `.ics` exports.
- OpenAI photo-to-listing drafts and optional source-linked asking-price research.
- Per-account scan caching, persistent daily/monthly quotas, and signed campus identity checks.
- Home-screen installation assets and a private-data-free offline fallback.

## Setup and launch

- [Phone app instructions](PHONE_APP.md)
- [UCSD sign-in setup and feature status](UCSD_SIGN_IN.md)
- [Hosting and OpenAI budget](LAUNCH.md)
- [Initial iOS plan](IOS_APP_PLAN.md)

Real keys belong only in ignored `.env` files or server-side hosting settings. Never prefix an OpenAI key with `VITE_`. Reference templates: `phone.env.example` and `backend/scanner.env.example`.

## Checks

```sh
npm run lint
npm test
npm run build
npm run test:e2e
npm run test:pwa
.venv/bin/python -m unittest backend.test_scanner
```

The original hackathon website is retained under `src/pages`, `src/hooks`, and `src/services`; select it with `VITE_APP_EXPERIENCE=legacy`. Its Browser Use backend is not part of the phone app's OpenAI scanner.

Original hackathon contributors: MokeyCodes (database), alexgilbreath (frontend), masonbrito (backend/integration), and Claude (AI assistance).
