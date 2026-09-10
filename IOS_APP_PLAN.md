Triton Thrift — one-week phone launch and iOS roadmap

Updated September 7, 2026 with the owner's decisions: verified UCSD students only; campus pickups with payment arranged between students; build Google Calendar support; launch a polished home-screen web app in one week, then a native iOS app. The owner can use a friend's individual developer account; confirm active paid membership before native distribution. The working app foundation is now implemented locally; see the implementation update below and `PHONE_APP.md`. Nothing has been publicly deployed.

Build a UCSD marketplace where someone can photograph an item, review a suggested listing and price, find a buyer, and arrange a campus pickup from their phone.

**Original website audit (before the phone foundation)**

The local project has a React/Vite website, Auth0 login, Supabase services for listings, images, profiles, messages and ratings, campus college identity, and meetup location proposals inside chat. These are implementation findings, not confirmation that every feature works in production. The live website could not be retrieved by the research browser.

| Area | Finding in this checkout | Mobile work |
| --- | --- | --- |
| Marketplace | Searchable listings, listing details and single-photo selling form | Phone layouts, multiple photos, filters, saved items and listing management |
| Campus identity | College and preferred meetup spots | Define membership eligibility and verify it on the server |
| Messaging | Realtime service and location proposals encoded in message text | Mobile chat, push notifications, offers and structured meetup records |
| Calendar | No calendar integration found in `src` or `backend` | Build Google Calendar support as requested |
| Pricing | Frontend sends an image URL, but backend only accepts title/category and searches external listings | Actual photo recognition, editable listing drafts and evidence-backed estimates |
| Accounts | Auth0 and Supabase initialized separately; no token bridge visible in the Supabase client | Verify and complete authenticated access before connecting mobile users |
| Database | No checked-in SQL migrations found; documented UUID profile IDs differ from Auth0 subject IDs used in code | Inspect actual schema and policies, establish identity mapping, then version migrations |

The existing pricing UI describes results as sold listings, but the backend does not require sold results or retain source URLs. Correct that distinction when rebuilding pricing. Actual production schema, permissions and deployment configuration still need verification.

**Agreed launch scope**

Target an invite-only pilot of 20–50 current UCSD students in seven days. Verify control of a UCSD email and have the owner approve known current students for this initial cohort; keep the approval flag under server/admin control. A UCSD email alone does not establish current enrollment. Before opening registration more broadly, settle a scalable enrollment-verification method. Use badges that accurately describe the checks performed.

| Experience | Week-one pilot |
| --- | --- |
| Discover | Photo grid, category chips, search, size/condition/price filters, college or pickup-area filters, saved items |
| Sell | Camera or library upload, multiple photos, AI or manual listing draft, editable price, preview and publish |
| Listing | Photo gallery, item details, seller profile, verification status, save, share and message |
| Inbox | Conversations tied to listings; negotiate price through chat; unread state |
| Meetup | Propose location and time, accept, reschedule or cancel, add to calendar; reminders through the chosen calendar |
| Profile | College, bio, preferred meetup spots, own listings, reserved/sold status, completed-exchange reviews and settings |
| Community tools | Report listings/users, block users, moderation queue, support contact and account deletion |

Support clothing, shoes, accessories and a small set of general campus goods such as dorm items, books and electronics in the marketplace. Make the initial AI scanner strongest for clothing; other categories retain manual listing. Structured offers, advanced reputation, push notifications, automatic calendar synchronization, shipping, integrated payments, promoted listings and cross-posting belong after the pilot. If time is tight, simplify filters and saves before cutting the scan, chat, calendar or access-control essentials.

**UI direction**

Use the project's navy (`#182B49`) and gold (`#C69214`) with warm white backgrounds, restrained ocean-blue accents, large item photography and readable system typography. Gold works as an accent; text and controls need checked contrast. Keep the brand student-led and avoid implying official university sponsorship.

Bottom navigation: Discover · Saved · Sell · Inbox · Profile. Make Sell the clearest action. Put upcoming pickups in Inbox and Profile. Use large touch targets, iPhone safe areas, accessible text scaling, VoiceOver labels, keyboard-aware forms, and loading/empty/error states designed alongside the happy path.

The first visual prototype should cover Discover, listing detail, camera capture, AI draft review, chat, and meetup scheduling. Populate it with clearly identified sample listings and review it at actual phone size. Prototype targets: a new user can find an item, understand the seller, start a chat, and create a draft without guidance. Aim for an ordinary clothing listing in about a minute; measure this before making it a product promise.

**AI scanner and pricing**

1. Photograph the item and, when available, its brand/size tag and any defects. Explain when photos are sent for AI processing.
2. Analyze photos on the backend. Suggest category, visible color, brand when supported, readable tag size, title and description. Leave uncertain fields blank or ask a focused follow-up. The seller confirms condition and details that photos cannot establish.
3. Retrieve comparable items from a permitted data source. Store source link, retrieval date, currency, condition and whether each price is asking or sold. Compare similar items and normalize shipping before suggesting a local pickup price.
4. Present a suggested range and the evidence behind it. Seller selects or edits a price. Do not claim authenticity, guaranteed value or a guaranteed sale time from a photo.
5. Save an editable draft. Publishing always requires the seller's action. Failed scans and missing comparable prices must leave manual listing available.

Photo identification and price research are separate parts of the system. A vision model can identify likely attributes; a credible market estimate needs actual comparable data. SellRaze describes a similar photo-to-listing workflow on its [product page](https://www.sellraze.com/inventory).

External sold-price access is a dependency to validate before promising it. eBay identifies Marketplace Insights as a sales-history API and describes production access checks for restricted APIs in its [developer guide](https://developer.ebay.com/develop/get-started/get-started-on-a-buying-application). Do not assume access will be granted. Launch fallback: clearly labeled asking-price comparisons from an available permitted source, or no estimate when evidence is insufficient. Over time, consented completed-sale records from Triton Thrift can support campus-specific estimates.

Evaluate the scanner on a varied, consented clothing sample: readable and unreadable tags, different lighting, unbranded pieces, defects and ambiguous items. Track field correction rates, unsupported claims, comparable quality, latency and cost per completed draft. Set per-user scan limits, image-size limits and a monthly spending cap. Keep provider keys on the server and use authenticated, rate-limited scan requests.

**Calendar behavior**

A meetup belongs to a listing, buyer and seller, with a location, start/end time, timezone and status. Both participants see the same confirmed details. Store structured records so accepting an old chat proposal cannot overwrite a newer agreement.

Week one: offer an explicit Add to Google Calendar action with the agreed title, time and campus location prefilled for confirmation, plus an .ics download for Apple Calendar. Test both on the owner's phone. One-time calendar additions do not automatically stay synchronized: display that limitation and notify both participants of changes in the app. This avoids requiring a connected Google Calendar account for the pilot.

If automatic calendar updates are required, add a connected Google Calendar integration with consent, stored event IDs, duplicate prevention, token refresh/revocation and update/cancellation handling. Google documents event creation through its [Calendar API](https://developers.google.com/workspace/calendar/api/guides/create-events). Do not read or share classmates' full schedules as part of the basic pickup feature.

**Implementation approach**

Week one: improve the existing React/Vite site into a mobile-first progressive web app (PWA). Add the app icon, manifest, standalone layout, installation instructions and an offline fallback. Keep listings and private chat fetched fresh; do not indiscriminately cache authenticated API responses. Test login redirects both in Safari and when launched from the home screen. This route reuses the existing screens and services.

After the pilot: build the native iPhone client with React Native, Expo and TypeScript, sharing backend contracts and reusable service logic. Web JSX/CSS screens need native implementations. Expo supports iOS, Android and web, preserving an Android path later; see the [Expo introduction](https://docs.expo.dev/tutorial/introduction/).

Keep Supabase for listings, storage and realtime, and Auth0 for identity. The project already has a hosted database; OpenAI supplies photo analysis and drafting, while the database stores accounts, items, messages and meetups. Self-hosting a new database adds operations work without improving this week's launch budget.

For the pilot, place the small OpenAI scanner endpoint in a Supabase Edge Function so it can use the existing free allowance. Verify Auth0 tokens explicitly and enforce campus access and scan quotas there. The existing Python browser-search prototype can remain as a reference; it is not a production dependency for the inexpensive pilot. Keep provider secrets on the server. Confirm function runtime limits against measured scan latency; fall back to an asynchronous job if needed.

Before live-data integration, inspect the Auth0/Supabase configuration and database policies. Supabase documents [third-party Auth0 integration](https://supabase.com/docs/guides/auth/third-party/auth0). Enforce ownership and conversation membership on the server/database, and test them with two accounts plus an unauthenticated client. Client-provided IDs and browser route guards are insufficient authorization.

Plan an Expo development build for real-device authentication testing: the native Auth0 SDK is not supported by Expo Go, as noted in [Auth0's Expo guide](https://auth0.com/docs/quickstart/native/react-native-expo). Screen mirroring is optional for reviewing interactions; it does not install or distribute the app.

Likely data additions: listing photos/attributes, saved listings, offers, structured meetups, notifications/device tokens, blocks/reports, scan jobs and price-comparison records. Derive exact migrations from the actual database, preserve existing users and listings, and verify backups before migration. Use staging data for development and prepare a rollback for deployment.

**Seven-day implementation target**

| Day | Deliverable | Ready when |
| --- | --- | --- |
| 1 | Phone design and backend audit | Discover/Sell/Inbox direction is reviewable; existing login, schema, hosting and permissions are understood |
| 2 | Campus access and marketplace UI | Approved test accounts can browse and create listings; unapproved users cannot trade |
| 3 | AI photo-to-draft workflow | Real photos produce editable drafts; uncertain fields and scan failures are handled |
| 4 | Price evidence and listing management | Price comparisons show links and asking/sold status, or honestly show insufficient evidence; edit/reserve/sold flows work |
| 5 | Chat and Google/Apple calendar handoff | Two accounts can agree on a place/time and add it to their calendars |
| 6 | Installation, community tools and device testing | Home-screen login, camera, poor-network behavior, reporting/blocking, account deletion and privacy flows work |
| 7 | Staging acceptance, deployment and pilot onboarding | Access tests and core journeys pass; rollback is prepared; invite link and installation guide work for initial students |

These are work targets, not a guarantee. They assume the owner can access existing hosting, Auth0 and Supabase, configure API billing, and help with daily phone checks. Reassess at the end of day 1 if the live backend requires extensive repair. Do not open the pilot with broken authorization or invented price evidence. Full marketplace parity and native App Store release extend beyond this week.

**Very low-cost operating plan**

Start with a US$10 monthly AI allowance for about 20–50 pilot students and roughly 200 scans per month. Actual usage can be lower. This is an operating estimate, excluding development labor, existing domain renewal, taxes and any already-paid services. API use needs separate billing funding; the allowance is not a flat-price subscription or a spending approval.

| Component | Pilot monthly target | Basis |
| --- | --- | --- |
| Static web hosting | $0 | Keep the existing host if its plan permits this; otherwise Cloudflare Pages has free static requests: [pricing](https://developers.cloudflare.com/pages/functions/pricing/) |
| Database, photos, realtime and scan function | $0 within quotas | Supabase Free includes 500 MB database, 1 GB files and 500,000 function invocations; watch image bandwidth: [pricing](https://supabase.com/pricing) |
| Login | $0 within plan features | Auth0 Free supports up to 25,000 external active users; confirm current tenant configuration: [pricing](https://auth0.com/pricing) |
| AI photo analysis and optional price search | $5–$10 allowance | Usage-based model calls, limited search calls, cached repeated results |
| Calendar handoff | $0 incremental server API usage | Prefilled Google Calendar link and .ics export; no paid calendar synchronization service |
| Apple membership during web pilot | $0 | Not required for home-screen web distribution |

Illustrative AI calculation, using GPT-5.4 Mini as a benchmark candidate rather than a final quality-tested selection: 4,000 billable input tokens including processed images and 800 output tokens cost $0.0066 at $0.75/M input and $4.50/M output. Two hundred such scans cost $1.32 for analysis. Image token counts vary by size/detail; reasoning, retries and extra calls can raise totals. See the [model rates and capabilities](https://developers.openai.com/api/docs/models/gpt-5.4-mini) and [vision guide](https://developers.openai.com/api/docs/guides/images-vision).

One web-search call for each of 200 scans adds $2 in tool fees at $10/1,000 calls, plus retrieved-content tokens and any additional model output. A hypothetical extra 4,000 input tokens per scan adds $0.60 at the benchmark rate. Together those assumptions are about $3.92 before retries or additional output, so reserve $5–$10 and measure actual costs. Search may return insufficient evidence; a tool call does not guarantee useful price matches. At 1,000 similar scans, these same assumptions reach about $19.60 before reserve. Source: [OpenAI API pricing](https://developers.openai.com/api/docs/pricing).

Enforce one bounded scan job at a time per user, a per-user daily quota and a global monthly quota. Reserve a conservative maximum cost before dispatching each job, then reconcile recorded usage, so simultaneous requests cannot overspend the app's allowance. Cap images, output and tool calls; stop new AI jobs near the allowance and keep manual listing usable. Provider dashboard alerts alone are not the app's enforcement mechanism. Compress listing photos and generate small feed thumbnails to conserve storage and bandwidth.

Supabase Free can pause after a week of inactivity and does not include automatic backups. Export backups for the pilot and monitor quotas. When reliable public operation or usage requires it, Supabase Pro starts at $25/month: a base budget then becomes roughly $30–$35/month including the initial AI allowance, before overages or other upgrades. [Supabase pricing](https://supabase.com/pricing).

**Getting it onto phones**

Week one: students open the website in Safari, choose Add to Home Screen, enable Open as Web App where available, and tap Add. The app launches from its own home-screen icon. Publish a short installation guide and QR code to the website. Apple documents this [home-screen installation flow](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios). It remains a web app and is not an App Store listing. Phone mirroring is optional for feedback; actual Safari and home-screen testing is more useful.

Next stage: native Expo development build, Apple enrollment, TestFlight beta, then App Store submission. TestFlight testers use an invitation and Apple's TestFlight app; see [Apple's tester instructions](https://testflight.apple.com/). After approval, put the direct App Store download link on the website. Native conversion and Apple review have their own timeline.

Apple Developer Program membership is currently US$99 per year, with [membership and distribution details](https://developer.apple.com/programs/). An active paid membership on the friend's confirmed individual account could avoid a separate membership purchase for this release. Have the friend invite the owner's Apple Account through App Store Connect Users and Access, using an App Manager role scoped to Triton Thrift once its app record exists. Individual-account invitations grant App Store Connect access but do not grant Developer Program team access, so the friend must handle the signing resources that cannot be delegated. Use separate logins. See [Apple's account roles](https://developer.apple.com/help/app-store-connect/manage-your-team/overview-of-accounts-and-roles/).

Distribution under the friend's account places the app under that account's control and lists the friend as the individual seller. The app title can still be Triton Thrift. See [Apple's enrollment details](https://developer.apple.com/programs/enroll/). Confirm this publishing arrangement before submission. The friend handles required agreements and membership renewal. Hosting, storage, AI, pricing data and any build-service charges remain separate. The agreed week-one web pilot proceeds independently of this setup.

Include reporting, blocking, content moderation, support, privacy disclosures and in-app account deletion in release work. Choose login options consistent with the final eligibility model and Apple's login-services requirements, including Sign in with Apple where applicable. Prepare reviewer access for a restricted campus app. These tasks follow [Apple's App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/).

**Implementation inputs still needed**

- Access to the existing deployment, Supabase project and Auth0 tenant, using approved local configuration rather than posting secrets in chat.
- An OpenAI API project with billing configured when real scanner testing begins. Confirm the proposed $10 allowance before incurring spend.
- Initial current-student pilot roster and an owner for student approval, reports and support.

Implementation update: the mobile-first React foundation is now implemented with local persistent marketplace flows, photos, drafts, chat/pickup previews, calendar exports, PWA installation assets, and a separate authenticated FastAPI/OpenAI scanner. See `PHONE_APP.md` for setup and current limits. This first scanner implementation uses the existing Python ecosystem; moving it to an Edge Function remains an optional hosting step. Shared Supabase persistence, real multi-user permissions, deployment, actual AI quality/cost validation and native iOS distribution remain outstanding.
