/**
 * auth0.js
 * Auth0 provider configuration for the application.
 * Wraps the app in Auth0Provider so all components can access auth state.
 *
 * NOTE: VITE_AUTH0_CLIENT_ID is intentionally client-side. Auth0 SPA SDK
 * requires the client ID in the browser — it is NOT a secret (unlike client_secret).
 */

import { Auth0Provider } from "@auth0/auth0-react";

const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE;

if (!domain || !clientId) {
  console.error(
    "Missing Auth0 environment variables (VITE_AUTH0_DOMAIN, VITE_AUTH0_CLIENT_ID). " +
      "Copy .env.example to .env and fill in your values."
  );
}

// Wraps children in Auth0Provider with env-based config
export function Auth0ProviderWithConfig({ children }) {
  if (!domain || !clientId) {
    return <p style={{ color: "red", padding: "2rem" }}>Auth0 is not configured. Copy .env.example to .env and add your keys.</p>;
  }

  const redirectUri =
    typeof window !== "undefined" ? window.location.origin : "";

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
        ...(audience ? { audience } : {}),
      }}
    >
      {children}
    </Auth0Provider>
  );
}
