# Triton Thrift

A campus marketplace web app for UCSD students to buy and sell used clothing locally. Features in-person meetup coordination, AI-assisted pricing, real-time messaging, and a seller rating system.

## Features

- **Browse & Search** -- Searchable grid of active listings with category and condition filters
- **Listing Details** -- Modal popup with full item info, seller profile, and message button
- **User Profiles** -- Avatar, bio, college affiliation, meetup spots, ratings, and listings
- **Real-Time Messaging** -- Supabase Realtime-powered chat between buyers and sellers
- **Seller Ratings** -- 1-5 star rating system with written reviews
- **AI Price Suggestions** -- Browser Use-powered price hints from Depop and eBay (bonus feature)
- **Auth0 Login** -- Google OAuth authentication
- **College Identity** -- UCSD college selector (Revelle, Muir, Marshall, Warren, Roosevelt, Sixth, Seventh, Eighth)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, React Router 7 |
| Auth | Auth0 (OAuth / Google) |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage (avatars, listing images) |
| Real-Time | Supabase Realtime (messaging) |
| Backend | Python FastAPI + Browser Use SDK |

## Project Structure

```
src/
  components/    -- Reusable UI (ListingCard, ListingModal, NavBar, UserBar, etc.)
  pages/         -- Page components (Home, Profile, SignUp, Messages, Sell)
  hooks/         -- React context hooks (useAuth, useProfile, useListings, useMessages)
  services/      -- Supabase service layer (listings, messages, profiles, ratings, storage)
  lib/           -- Config (supabase.js, auth0.jsx, colleges.js, sanitize.js)
backend/
  main.py        -- FastAPI server with /price-hint endpoint
```

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- Auth0 account (Single Page Application)
- Supabase project

### Setup

1. **Clone and install**
   ```bash
   git clone https://github.com/MasonMakes07/Video-game-for-hackathon.git
   cd "Video game for hackathon"
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Fill in your values:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_AUTH0_DOMAIN=your_auth0_domain
   VITE_AUTH0_CLIENT_ID=your_auth0_client_id
   VITE_AUTH0_AUDIENCE=your_auth0_api_audience
   VITE_PRICE_HINT_API=http://localhost:8000
   ```

3. **Run the frontend**
   ```bash
   npm run dev
   ```

4. **Run the backend** (optional, for AI price hints)
   ```bash
   cd backend
   pip install -r requirements.txt
   cp .env.example .env   # Add BROWSER_USE_API_KEY
   uvicorn main:app --reload
   ```

### Supabase Setup

Create the following tables in your Supabase project:

- **profiles** -- id, name, avatar_url, college, bio, meetup_spots, created_at
- **listings** -- id, seller_id, title, price, category, condition, description, image_url, status, created_at
- **messages** -- id, listing_id, sender_id, receiver_id, content, created_at
- **ratings** -- id, rater_id, rated_id, score, comment, created_at

Create storage buckets: `avatars` (public read) and `listing-images` (public read).

## Team

| Member | Role |
|--------|------|
| **MokeyCodes** | Database -- Supabase schema, tables, RLS policies, storage |
| **alexgilbreath** | Frontend + UI -- React components, pages, visual layout |
| **masonbrito** | Backend + Integration -- Auth0, hooks, services, API wiring |

## License

This project was built for a hackathon.
