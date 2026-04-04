/**
 * useMessages.js
 * Custom hook for real-time messaging between buyers and sellers.
 * Subscribes to Supabase Realtime for live message updates.
 */

// TODO: Implement Supabase Realtime message subscription
export function useMessages() {
  return {
    messages: [],
    loading: false,
    error: null,
    sendMessage: async () => {},
  };
}
