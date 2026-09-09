# Google and Apple sign-in setup

The phone app now offers Google sign-in and an Apple option. This fallback authenticates an account; it does not verify UCSD enrollment. Provider configuration and a successful HTTPS phone login still need verification before launch.

1. Enable Auth0's `google-oauth2` connection for this application with production Google credentials. Enable `apple` after configuring Apple's service credentials. Set `VITE_GOOGLE_AUTH0_CONNECTION=google-oauth2`; set `VITE_APPLE_AUTH0_CONNECTION=apple` only when Apple is ready (otherwise its button remains disabled).
2. Configure the public Auth0 domain and client ID from `phone.env.example`. Add the HTTPS app origin to Auth0 callback, logout, and allowed web origins. Phone LAN HTTP does not support this login path.
3. Deploy `auth0/social-login.cjs` as the app's Post Login Action, with the `TRITONS_CLIENT_ID` secret. Replace the campus-only Action for this app so it does not reject social identities. The scanner accepts the exact Google and Apple connection names above.
4. Set the scanner's server-only `SCANNER_AUTH_MODE=social`, Auth0 domain and API audience. Configure the frontend audience and scanner URL too. Restart/redeploy both services. The default server mode remains `campus` until explicitly changed.
5. Test both an accepted verified account and a rejected token missing the signed identity claim. `/account` must return `account_approved: true` and `student_approved: false` in social mode. Never label social login as student verification.

The OpenAI key stays exclusively on the scanner server. Uploading a photo alone does not send it to OpenAI; scanning requires consent and authenticated access. Existing request quotas and duplicate-result caching apply to social accounts.

## Private phone development connection

`backend/owner_preview.py` provides a development-only alternative for the owner's phone through Vite's `/__owner-scanner` proxy. It requires an enabled flag, an expiring private pairing token, and an actual loopback socket connection. The production `backend.scanner:app` entry point has no owner endpoints. Pairing never establishes a student or social account.

The development service must bind to loopback with proxy-header trust disabled. Keep pairing tokens in ignored environment/runtime files; never commit or publish a pairing URL. The phone stores its pairing in session storage and removes the token from the visible URL. Real account testing and public deployment still require HTTPS and the provider setup above.

## Verification status

Local authorization tests cover Google/Apple signed claims and the private connection's token, expiry, and loopback checks. A live iPhone-sized Chrome test on the Wi-Fi address passed photo upload, OpenAI analysis with price research, applying the draft, and pairing persistence after reload. Real iPhone Safari confirmation and production deployment remain outstanding. Invalid comparison prices previously caused HTTP 502; those entries are now discarded without losing the clothing draft.
