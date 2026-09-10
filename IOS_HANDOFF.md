# Tritons Thrifts — iOS developer handoff

## Current status

The repository includes a Capacitor 8 iOS/Xcode project, the complete React app, and the separate OpenAI scanner backend. It bundles the web app locally rather than relying on a running Mac. Native login opens the system browser and returns through a registered app URL scheme. Camera/photo-library purpose strings are included. Three daily scanner attempts and low-cost pricing strategies remain in the server.

This is an unsigned developer build foundation, not an App Store-ready production marketplace. This Mac has only Command Line Tools, so native compilation, simulator testing, signing and archive validation have not been run. The blockers below must be resolved before public release.

## Get the code and run

On your friend's Mac, install full Xcode compatible with Capacitor 8, open it once to install components, and install Node 22 or newer. Select the full Xcode toolchain if needed.

```sh
git clone --branch feat/tritons-thrifts-phone-app https://github.com/MasonMakes07/Web-Market-for-used-clothes.git
cd Web-Market-for-used-clothes
npm ci
cp phone.env.example .env.local
# Edit .env.local with real PUBLIC application settings.
npm run ios:sync
npm run ios:open
```

In Xcode select the App target → Signing & Capabilities → Automatically manage signing → your Apple Developer team. The proposed bundle ID is `tech.tritonsthrift.app`. Register it with that team; if unavailable, change it consistently in capacitor.config.json, the Xcode target, Info.plist URL scheme, src/mobile/native.js, and Auth0 callback/logout settings. Never commit certificates, provisioning profiles, signing keys, or Apple account credentials.

Select an iPhone simulator first, then a connected iPhone with Developer Mode enabled. Build and run. After every frontend change, run `npm run ios:sync` before rebuilding in Xcode. Generated web assets and personal signing state are intentionally excluded from Git.

## Google and Apple account setup

Create a separate **Native** application in the existing Auth0 tenant. Set its public ID as `VITE_AUTH0_NATIVE_CLIENT_ID`; keep the web SPA's ID in `VITE_AUTH0_CLIENT_ID`.

Allow `tech.tritonsthrift.app://auth/callback` as both callback and logout URL for the Native app. Add `capacitor://localhost` to Allowed Origins (CORS) and applicable web origins. Enable Google and Apple connections for the Native app. Complete Apple's Services ID, Team ID, Key ID and signing-key configuration in Auth0; see SOCIAL_SIGN_IN.md. Set `VITE_APPLE_AUTH0_CONNECTION=apple` only once enabled.

Deploy the social-login Auth0 Action for this Native client's ID as well as the web client's ID (use separate scoped Actions/configuration). The current Action's single TRITONS_CLIENT_ID is intentional: an Action configured only for the web app does not issue scanner claims to the native app. Verify successful login, cancellation, failed login, logout and reopening after app termination on an actual iPhone. Tokens stay in memory; reopening may require login again.

## Production scanner

Deploy `backend.scanner:app` to a persistent HTTPS server. Follow backend/scanner.env.example; use SCANNER_AUTH_MODE=social, SCAN_DAILY_LIMIT=3 and persistent SQLite storage. Permit `capacitor://localhost` in ALLOWED_ORIGINS alongside the web origin. Set VITE_SCANNER_API to its HTTPS URL and VITE_AUTH0_AUDIENCE to the registered API audience before syncing.

Keep OPENAI_API_KEY on the server only. The private Wi-Fi pairing launcher is development-only and is absent from the iOS production bundle. `localhost:8000` inside an iPhone is not your Mac. Verify a real scan with native login before inviting testers.

Run `npm run ios:check` to validate build configuration without producing an archive. `npm run ios:release` checks configuration and then builds/syncs. These checks do not replace physical-device testing or App Store review.

## Release blockers and TestFlight

- Finish Google/Apple provider setup and signed scanner claim configuration. Existing localhost web login previously failed because Auth0's callback list was incomplete.
- Connect listings, profiles, chat, moderation/reporting, blocking and account deletion to authenticated shared storage. Current marketplace records are device-local previews; this is not multi-user delivery.
- Supply the final 1024×1024 app icon artwork. The attached circular badge is not yet a repository file; the generated Xcode icon is a placeholder. Replace Assets.xcassets/AppIcon before shipping.
- Add hosted privacy policy/support URLs and accurately complete App Store privacy disclosures, including account data, uploaded images, and OpenAI processing. Review privacy manifests for app and plugins against actual features.
- Test camera/library access, photo rotation/compression, all pricing buttons, scan quota, offline/error behavior, native OAuth return, calendar export/Google Calendar links, keyboard and safe-area layouts on physical iPhones. No full native run has yet been verified.
- Register the app in App Store Connect under the same bundle ID. Select a real-device archive destination in Xcode, Product → Archive, then Validate App and Distribute App → App Store Connect. Increment build number for each upload. Start with internal TestFlight testers; external testing and public release require Apple's applicable review.

Your friend's individual membership controls signing and publisher identity. He should sign in locally; no password sharing is needed. This repository contains source and setup instructions, not his Apple credentials or your OpenAI key.

References: https://capacitorjs.com/docs/ios and https://capacitorjs.com/docs/ios/deploying-to-app-store
