/**
 * useAuth.js
 * Custom hook wrapping Auth0 authentication state and actions.
 * Provides login, logout, and current user info to components.
 */

// TODO: Import { useAuth0 } from '@auth0/auth0-react' and sync with Supabase profile
export function useAuth() {
  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: async () => {},
    logout: async () => {},
  };
}
