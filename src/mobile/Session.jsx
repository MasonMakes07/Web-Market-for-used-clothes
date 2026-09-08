import { createContext, useContext } from "react";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";

const SessionContext = createContext(null);
const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE;
const campusConnection = import.meta.env.VITE_UCSD_AUTH0_CONNECTION;
const scannerConfigured = Boolean(import.meta.env.VITE_SCANNER_API && audience);
const enabled = Boolean(
  domain && clientId && (scannerConfigured || campusConnection),
);

// Auth is optional for the local preview and required for every real scanner request.
function AuthSession({ children }) {
  const auth = useAuth0();
  return (
    <SessionContext.Provider
      value={{
        configured: scannerConfigured,
        campusConfigured: Boolean(campusConnection),
        user: auth.user,
        loading: auth.isLoading,
        error: auth.error,
        login: () =>
          auth.loginWithRedirect({
            appState: { returnTo: "/sell" },
            authorizationParams: campusConnection
              ? { connection: campusConnection }
              : {},
          }),
        campusLogin: () => {
          if (!campusConnection)
            return Promise.reject(
              new Error("UCSD sign-in is not connected yet."),
            );
          return auth.loginWithRedirect({
            appState: { returnTo: "/profile" },
            authorizationParams: { connection: campusConnection },
          });
        },
        token: () => auth.getAccessTokenSilently(),
        logout: () =>
          auth.logout({ logoutParams: { returnTo: window.location.origin } }),
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

// Keeps unfinished service configuration from blocking the usable device preview.
export default function SessionProvider({ children }) {
  if (!enabled || !window.isSecureContext)
    return (
      <SessionContext.Provider
        value={{
          configured: false,
          campusConfigured: false,
          user: null,
          loading: false,
        }}
      >
        {children}
      </SessionContext.Provider>
    );
  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{ redirect_uri: window.location.origin, audience }}
      onRedirectCallback={(appState) => {
        // Accept only known internal tabs; never navigate to caller-supplied URLs.
        const returnTo = appState?.returnTo === "/sell" ? "/sell" : "/profile";
        window.location.hash = returnTo;
        window.history.replaceState({}, "", `/#${returnTo}`);
      }}
    >
      <AuthSession>{children}</AuthSession>
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
) {
  const endpoint = import.meta.env.VITE_SCANNER_API;
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
