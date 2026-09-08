# UCSD sign-in and requested features

The phone app now has a Profile → Continue with UCSD entry point. It is intentionally unavailable until a real university identity connection is configured. No campus password or Duo code is collected by Tritons Thrifts. This code alone does not register the app with UCSD or create shared marketplace accounts.

## Connection setup

1. Ask UCSD IT whether an independently operated student marketplace can connect to campus SSO, whether a campus sponsor is required, and which protocol and current-student attributes they support. No approval or protocol availability has been confirmed. Contact the [UCSD Service Desk](https://support.ucsd.edu/).
2. If approved, configure the supported enterprise identity connection in the existing Auth0 tenant and enable it for this SPA. For SAML, exchange the actual Auth0 service-provider metadata and the university's issuer, signing certificate, and sign-in configuration with the identity administrator. Do not guess these values. Check the Auth0 account's entitlement/cost before enabling a paid connection.
3. Set `VITE_UCSD_AUTH0_CONNECTION` to that exact connection name in `.env.local`. Keep the public Auth0 domain and client ID. Scanner configuration is independent: campus sign-in can initialize without the AI server URL.
4. Register the HTTPS deployment origin as an Auth0 callback, logout URL, and allowed web origin. Test localhost on the Mac or trusted HTTPS on the phone. The HTTP LAN preview cannot run this login.
5. Require the approved connection and verified current-student eligibility on the server before any shared listing, messaging, or upload operation. Email domain and client-side profile fields are not authorization. Confirm the university's released attributes before implementing their mapping. Until then, the scanner retains its manually verified subject allowlist.
6. Test approved student, staff/alumni, wrong provider, cancelled Duo, expired session, logout, and account switching with the university connection. The current device preview does not merge its records into the signed-in user's account.

UCSD manages when its Duo challenge is required. We cannot guarantee a new Duo prompt for every login. A first successful university login may create an Auth0 identity; the marketplace's shared profile and eligibility approval remain separate work.

## Feature status

| Requested feature | Current implementation | Remaining for public launch |
| --- | --- | --- |
| Phone-first UCSD marketplace | Discover, filters, saved listings, profiles | Shared authenticated database and deployment |
| Selling photos and details | Six photos, camera upload, title, category, condition, brand, size, description, price, editing/deletion | Shared photo storage with ownership rules |
| AI item scanner and price comparison | Photo consent, editable AI draft, optional sourced asking-price comparisons, server quotas | Server key configured; one live photo-to-draft test passed. Authenticated phone flow, price-research quality tests, and deployment remain |
| Messaging and campus meetups | Device-local threads, pickup proposals and demo acceptance | Participant-only real delivery and acceptance |
| Google Calendar | Confirmed meetup link and Apple-compatible calendar export | Exports are event copies, not live two-way synchronization |
| UCSD account with Duo | Auth0 enterprise redirect support and signup entry | University connection setup, real login test, server-side enrollment checks |
| Home-screen app | Manifest, icons, offline fallback | Trusted HTTPS hosting; native App Store release afterward |

## Sources

- [UCSD SSO and Duo](https://blink.ucsd.edu/technology/security/services/two-step-login/sso.html)
- [Auth0 enterprise connections](https://auth0.com/docs/authenticate/enterprise-connections)
- [Auth0 as a SAML service provider](https://developer.auth0.com/resources/labs/authentication/configure-your-application-as-a-saml-service-provider)

## Server enforcement added

Install `auth0/ucsd-campus-login.cjs` as an Auth0 Post Login Action, configure its `TRITONS_CLIENT_ID` and `UCSD_CONNECTION_NAME` secrets, deploy it, and attach it to the login flow. It rejects non-UCSD email, unverified email, and the wrong identity connection for this app. Restrict the application's enabled connections to the approved campus connection too.

The scanner now requires `UCSD_AUTH0_CONNECTION` on the server and validates the namespaced campus claim added by that Action. A subject in `APPROVED_AUTH0_SUBJECTS` alone is no longer enough. `/account` uses the same checks without triggering a scan. Maintain that allowlist only for independently verified current students and remove approvals when eligibility ends. Missing connection configuration fails closed. Synthetic identity tests pass; university sign-in still needs actual configuration and a real end-to-end test.

## What is proven by tests

Every link the app controls is covered, so the only untested step is UCSD's own identity provider.

| Link | Proven by | Command |
| --- | --- | --- |
| App sends Auth0 the approved connection, over PKCE, returning only to its own origin | `tests/campus/campus-signin.spec.js` | `npm run test:campus` |
| Sign-in stays disabled and contacts no provider while unconfigured | `tests/campus/campus-unconfigured.spec.js` | `npm run test:campus` |
| Action denies wrong connection, lookalike domains, unverified email; stamps the campus claim | `tests/campus-login.test.js` | `npm test` |
| Server rejects forged/missing campus claims and fails closed with no connection set | `backend/test_scanner.py` | `python -m unittest backend.test_scanner` |
| No campus password or Duo field exists in this origin | `tests/campus/campus-signin.spec.js` | `npm run test:campus` |

The campus e2e run starts two throwaway dev servers, points the configured one at a reserved `.example` tenant, and aborts every request to it. No real credential or tenant is involved.

## Exactly what remains

Nothing further can be done in this repository without the two external steps first.

1. **Blocked on UCSD IT.** Approval for an independently operated student marketplace to federate with campus SSO, plus the protocol and released attributes. Still unconfirmed — start at the [UCSD Service Desk](https://support.ucsd.edu/).
2. **Blocked on the Auth0 tenant.** Create the SPA application, then the enterprise connection once UCSD supplies metadata. Check entitlement: enterprise connections are typically a paid tier.
3. **Then configuration only**, no code changes:
   - `.env.local` (absent today, so campus sign-in is inert): `VITE_AUTH0_DOMAIN`, `VITE_AUTH0_CLIENT_ID`, `VITE_AUTH0_AUDIENCE`, and `VITE_UCSD_AUTH0_CONNECTION` set to the exact connection name.
   - `backend/.env`: add `UCSD_AUTH0_CONNECTION` with that same name. **It is currently missing**, so `/scan` and `/account` return `503 UCSD account verification is not configured` for every authenticated request. That is the intended fail-closed behaviour, not a bug, but it does mean campus-authenticated scanning cannot work until the value is set.
   - Install `auth0/ucsd-campus-login.cjs` as a Post Login Action with `TRITONS_CLIENT_ID` and `UCSD_CONNECTION_NAME` secrets, attach it to the login flow, and restrict the application's enabled connections to the campus one.
   - Register the HTTPS origin as callback, logout and allowed web origin. The HTTP LAN preview cannot run this login: `Session.jsx` requires a secure context.
4. **Then test for real:** approved student, staff/alumni, wrong provider, cancelled Duo, expired session, logout, account switching.

Identity is still not eligibility. Even after all of the above, shared marketplace access stays gated on the server-side approved-subject list until a real enrollment check exists.
