import { BrowserRouter } from "react-router-dom";
import { Auth0ProviderWithConfig } from "./lib/auth0.jsx";
import { AuthProvider } from "./hooks/useAuth.jsx";
import { ProfileProvider } from "./hooks/useProfile.jsx";
import { ListingsProvider } from "./hooks/useListings.jsx";
import { MessagesProvider } from "./hooks/useMessages.jsx";
import App from "./App.jsx";
import "./index.css";

// Loads original Auth0/Supabase providers only when the original site is selected.
export default function LegacyRoot() {
  return (
    <BrowserRouter>
      <Auth0ProviderWithConfig>
        <AuthProvider>
          <ProfileProvider>
            <ListingsProvider>
              <MessagesProvider>
                <App />
              </MessagesProvider>
            </ListingsProvider>
          </ProfileProvider>
        </AuthProvider>
      </Auth0ProviderWithConfig>
    </BrowserRouter>
  );
}
