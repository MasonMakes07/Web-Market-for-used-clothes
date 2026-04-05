/**
 * useListings.js
 * Listings context provider and hook for the application.
 * Runs a single fetch on mount and shares listing state to all
 * components via React context (per Learning.md Lesson 2).
 * Provides CRUD operations that require the authenticated user's ID.
 */

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import {
  getListings,
  createListing as createListingService,
  saveDraft as saveDraftService,
  deleteListing as deleteListingService,
} from "../services/listings.js";

const ListingsContext = createContext(null);

// Provides listings state to the entire app — mount once above consuming components
export function ListingsProvider({ children }) {
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchIdRef = useRef(0);

  // Fetches all active listings from Supabase (with stale-response protection)
  const fetchListings = useCallback(async () => {
    const id = ++fetchIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const data = await getListings();
      if (id === fetchIdRef.current) setListings(data);
    } catch (err) {
      if (id === fetchIdRef.current) setError(err.message);
    } finally {
      if (id === fetchIdRef.current) setIsLoading(false);
    }
  }, []);

  // Fetch listings on mount
  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Creates a new active listing and refreshes the list
  const createListing = useCallback(async (userId, data) => {
    setError(null);
    try {
      const newListing = await createListingService(userId, data);
      await fetchListings();
      return newListing;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchListings]);

  // Deletes a listing by ID and refreshes the list
  const deleteListing = useCallback(async (userId, listingId) => {
    setError(null);
    try {
      await deleteListingService(userId, listingId);
      await fetchListings();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchListings]);

  // Saves a listing as a draft (does not appear in active listings)
  const saveDraft = useCallback(async (userId, data) => {
    setError(null);
    try {
      const draft = await saveDraftService(userId, data);
      return draft;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const value = {
    listings,
    fetchListings,
    createListing,
    deleteListing,
    saveDraft,
    isLoading,
    error,
  };

  return <ListingsContext.Provider value={value}>{children}</ListingsContext.Provider>;
}

// Consumes listings context — must be inside <ListingsProvider>
export function useListings() {
  const ctx = useContext(ListingsContext);
  if (!ctx) {
    throw new Error("useListings must be used within a <ListingsProvider>");
  }
  return ctx;
}
