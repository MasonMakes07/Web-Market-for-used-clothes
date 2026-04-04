# Project Plan — UCSD Used Clothing Marketplace
**Hackathon · 3 people · 7 hours**

---

## Overview
A Facebook Marketplace-style web app for college students to buy and sell used clothing locally. Built for UCSD students with in-person meetup coordination, AI-assisted pricing, and real-time messaging.

---

## Team & Roles

| GitHub | Role | Owns |
|--------|------|------|
| **MokeyCodes** | Database | Supabase schema, tables, RLS policies, storage buckets |
| **alexgilbreath** | Frontend + UI | React components, pages, all visual layout |
| **masonbrito** | Backend + Integration | Auth0, Supabase JS client, hooks, services, API wiring |

**Key rule:** MokeyCodes owns the Supabase dashboard exclusively. masonbrito writes the JS code that talks to it. They should sync at Hours 1 and 3 to align on table/column names.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vite + React (JavaScript) |
| Auth | Auth0 (OAuth) |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage |
| Real-time | Supabase Realtime (messaging) |
| AI Pricing | Browser Use (Python) — bonus feature |

---

## File Structure
```
src/
  components/     ← alexgilbreath (ListingCard, ListingModal, NavBar, UserBar, etc.)
  pages/          ← alexgilbreath (HomePage, ProfilePage, SignUpPage, MessagesPage)
  services/       ← masonbrito (listings.js, messages.js, storage.js, ratings.js)
  hooks/          ← masonbrito (useListings.js, useAuth.js, useMessages.js, useProfile.js)
  lib/
    supabase.js   ← masonbrito (Supabase client init, committed first at Hour 1)
    auth0.js      ← masonbrito (Auth0 provider config)
.env              ← gitignored (SUPABASE_URL, SUPABASE_ANON_KEY, AUTH0_DOMAIN, AUTH0_CLIENT_ID)
```

**Conflict prevention:**
- `alexgilbreath` never writes `supabase.from(...)` — always imports a hook from `masonbrito`
- `MokeyCodes` never edits React or JS files
- `masonbrito` commits empty service stubs at Hour 1 so `alexgilbreath` can import immediately
- Branches: `feat/frontend`, `feat/database`, `feat/backend` — merge to `main` at Hours 3 and 6

---

## Database Schema (MokeyCodes sets up in Supabase)

### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | references auth.users |
| name | text | |
| avatar_url | text | Supabase storage URL |
| college | text | e.g. "Warren", "Marshall" |
| bio | text | optional |
| meetup_spots | text[] | e.g. ["Geisel", "Price Center"] |
| created_at | timestamptz | |

### `listings`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | |
| seller_id | uuid | references profiles.id |
| title | text | required |
| price | numeric | required |
| category | text | e.g. "Tops", "Shoes" |
| condition | text | e.g. "Like New", "Good" |
| description | text | |
| image_url | text | Supabase storage URL |
| status | text | "active" or "draft" |
| created_at | timestamptz | |

### `messages`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | |
| listing_id | uuid | references listings.id |
| sender_id | uuid | references profiles.id |
| receiver_id | uuid | references profiles.id |
| content | text | sanitized before insert |
| created_at | timestamptz | |

### `ratings`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | |
| rater_id | uuid | references profiles.id |
| rated_id | uuid | references profiles.id |
| score | int | 1–5 |
| comment | text | optional |
| created_at | timestamptz | |

### Storage Buckets
- `avatars` — profile photos (public read, authenticated write)
- `listing-images` — item photos (public read, authenticated write)

---

## 7-Hour Timeline

### Hour 1 — Setup & Contracts (all together)
- **MokeyCodes:** Create Supabase project, run schema SQL, create storage buckets, share `SUPABASE_URL` + `SUPABASE_ANON_KEY` in group chat
- **masonbrito:** Scaffold Vite + React, set up Auth0 app, commit `src/lib/supabase.js` + `src/lib/auth0.js` + empty service/hook stubs, push to GitHub
- **alexgilbreath:** Clone repo, set up React Router routes and layout shell
- **All:** Agree verbally on `<ListingCard>` prop interface: `{ id, title, price, imageUrl, seller: { name, avatarUrl, rating } }`

### Hours 2–3 — Core Features
| | Task |
|-|------|
| **alexgilbreath** | Home page listing grid, NavBar (Sell / Search / Messages), listing modal popup |
| **MokeyCodes** | RLS policies on all tables, storage bucket policies, insert dummy listing data |
| **masonbrito** | `useListings()` hook, `useAuth()` hook (Auth0 login/logout), image upload service |

### Hours 3–5 — Secondary Features
| | Task |
|-|------|
| **alexgilbreath** | Sign-up info page, Profile page UI, Messaging page UI |
| **MokeyCodes** | Enable Supabase Realtime on messages table, rating insert function |
| **masonbrito** | Wire listing creation → Supabase, `useProfile()`, real-time messaging subscription, start Browser Use AI |

### Hours 5–6.5 — Integration & Polish
- **masonbrito** connects `alexgilbreath`'s UI components to all services
- **alexgilbreath** adds loading states, empty states, unauthenticated redirect
- **MokeyCodes** tests RLS with multiple test accounts, fixes permission issues

### Hour 6.5–7 — Demo Prep
- Full run-through: sign up → browse → list item → message seller → view profile
- Cut Browser Use AI if not ready (bonus only)

---

## MVP Priority (cut from bottom if time runs out)
1. Browse listings — home page grid
2. Listing modal + seller profile popup
3. Auth0 sign-up with meetup spots selection
4. Create a listing with photo upload
5. Message a seller (real-time)
6. Rating system
7. **AI price suggestion** ← cut first if needed

---

## Security Checklist (from CLAUDE.md)
- [ ] All API keys in `.env`, never hardcoded
- [ ] `.env` in `.gitignore`
- [ ] Auth0 — no client secrets exposed in UI
- [ ] Sanitize all user inputs before Supabase insert
- [ ] RLS policies so users can only edit their own rows
- [ ] Middleware: authenticated routes redirect unauthenticated users
