import { isAuthCallback } from "./nativeCallback.js";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { isNative, authReturnUrl, openAuthUrl } from "./native.js";
import { createContext, useContext, useState, useEffect } from "react";
import { readOwnerPairing, checkOwnerPairing } from "./ownerScanner.js";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";

const SessionContext = createContext(null);
const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = isNative
  ? import.meta.env.VITE_AUTH0_NATIVE_CLIENT_ID
  : import.meta.env.VITE_AUTH0_CLIENT_ID;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE;
const campusConnection = import.meta.env.VITE_UCSD_AUTH0_CONNECTION;
const googleConnection =
  import.meta.env.VITE_GOOGLE_AUTH0_CONNECTION || "google-oauth2";
const appleConnection = import.meta.env.VITE_APPLE_AUTH0_CONNECTION || "";
const scannerConfigured = Boolean(import.meta.env.VITE_SCANNER_API && audience);
const enabled = Boolean(domain && clientId);

// Auth is optional for the local preview and required for every real scanner request.
function AuthSession({ children }) {
  const auth = useAuth0();
  const [nativeError, setNativeError] = useState(null);
  const { handleRedirectCallback } = auth;
  useEffect(() => {
    if (!isNative) return;
    let active = true;
    let lastUrl = "";
    async function handleUrl({ url }) {
      if (!active || !url || url === lastUrl) return;
      if (!isAuthCallback(url)) return;
      const parsed = new URL(url);
      lastUrl = url;
      try {
        if (
          parsed.searchParams.has("state") &&
          (parsed.searchParams.has("code") || parsed.searchParams.has("error"))
        ) {
          await handleRedirectCallback(url);
        }
      } catch {
        if (active)
          setNativeError(
            new Error("Sign-in could not complete. Please try again."),
          );
      } finally {
        await Browser.close().catch(() => {});
      }
    }
    const listener = App.addListener("appUrlOpen", handleUrl);
    App.getLaunchUrl()
      .then((result) => result && handleUrl(result))
      .catch(() => {});
    return () => {
      active = false;
      listener.then((value) => value.remove());
    };
  }, [handleRedirectCallback]);
  return (
    <SessionContext.Provider
      value={{
        configured: scannerConfigured,
        socialConfigured: true,
        appleConfigured: Boolean(appleConnection),
        socialLogin: (provider) => {
          const connection =
            provider === "apple" ? appleConnection : googleConnection;
          if (!connection)
            return Promise.reject(
              new Error("This sign-in provider is not configured."),
            );
          return auth.loginWithRedirect({
            openUrl: openAuthUrl,
            appState: { returnTo: "/profile" },
            authorizationParams: { connection },
          });
        },
        campusConfigured: Boolean(campusConnection),
        user: auth.user,
        loading: auth.isLoading,
        error: nativeError || auth.error,
        login: () =>
          auth.loginWithRedirect({
            openUrl: openAuthUrl,
            appState: { returnTo: "/sell" },
            authorizationParams: { connection: googleConnection },
          }),
        campusLogin: () => {
          if (!campusConnection)
            return Promise.reject(
              new Error("UCSD sign-in is not connected yet."),
            );
          return auth.loginWithRedirect({
            openUrl: openAuthUrl,
            appState: { returnTo: "/profile" },
            authorizationParams: { connection: campusConnection },
          });
        },
        token: () =>
          auth.getAccessTokenSilently({ authorizationParams: { audience } }),
        logout: () =>
          auth.logout({
            openUrl: openAuthUrl,
            logoutParams: { returnTo: authReturnUrl },
          }),
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

// Owner pairing is a development-only connection, never a UCSD identity.
function OwnerSession({ children, pairing }) {
  const account = useContext(SessionContext);
  const [status, setStatus] = useState({ ready: false, error: "" });
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timer = setTimeout(() => controller.abort(), 10000);
    checkOwnerPairing(pairing, controller.signal)
      .then(() => {
        if (active) setStatus({ ready: true, error: "" });
      })
      .catch((error) => {
        if (active)
          setStatus({
            ready: false,
            error:
              error.name === "AbortError"
                ? "The scanner is not responding. Keep your Mac's scanner running."
                : error.message,
          });
      })
      .finally(() => clearTimeout(timer));
    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [pairing]);
  return (
    <SessionContext.Provider
      value={{
        ...account,
        configured: status.ready,
        ownerPreview: true,
        loading: !status.ready && !status.error,
        ownerError: status.error,
        token: async () => pairing,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

// Keeps unfinished service configuration from blocking the usable device preview.
export default function SessionProvider({ children }) {
  const [pairing] = useState(readOwnerPairing);
  const content =
    import.meta.env.DEV && pairing ? (
      <OwnerSession pairing={pairing}>{children}</OwnerSession>
    ) : (
      children
    );
  if (!enabled || (!isNative && !window.isSecureContext))
    return (
      <SessionContext.Provider
        value={{
          configured: false,
          campusConfigured: false,
          user: null,
          loading: false,
        }}
      >
        {content}
      </SessionContext.Provider>
    );
  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: authReturnUrl,
        scope: "openid profile email",
        ...(isNative && audience ? { audience } : {}),
      }}
      onRedirectCallback={(appState) => {
        // Accept only known internal tabs; never navigate to caller-supplied URLs.
        const returnTo = appState?.returnTo === "/sell" ? "/sell" : "/profile";
        window.location.hash = returnTo;
        window.history.replaceState({}, "", `/#${returnTo}`);
      }}
    >
      <AuthSession>{content}</AuthSession>
    </Auth0Provider>
  );
}

// Shares the optional scanner identity without treating a login as student approval.
// eslint-disable-next-line react-refresh/only-export-components
export function useSession() {
  return useContext(SessionContext);
}

// Sends at most three compressed photos; provider credentials never reach this client.
// eslint-disable-next-line react-refresh/only-export-components
export async function scanPhotos(
  photos,
  token,
  signal,
  researchPrices = false,
  ownerPreview = false,
  sellerNotes = "",
) {
  const endpoint =
    import.meta.env.DEV && ownerPreview
      ? "/__owner-scanner"
      : import.meta.env.VITE_SCANNER_API;
  if (!endpoint)
    throw new Error(
      "AI scanning is not connected yet. You can still create your listing manually.",
    );
  const response = await fetch(`${endpoint.replace(/\/$/, "")}/scan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      images: photos.slice(0, 3),
      research_prices: researchPrices,
      seller_notes: sellerNotes.slice(0, 1000),
    }),
    signal,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      typeof body.detail === "string"
        ? body.detail
        : "The scanner could not complete this request. Please try again.",
    );
  if (!body.draft || typeof body.draft.title !== "string")
    throw new Error(
      "The scanner returned an incomplete draft. Please enter your details manually.",
    );
  return body;
}
