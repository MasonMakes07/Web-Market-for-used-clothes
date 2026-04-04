/**
 * usePriceHint.js
 * React hook for fetching AI-powered price suggestions.
 * Debounces the request so it only fires after the user stops
 * typing for 800ms. Uses stale-response protection (fetchIdRef)
 * per Learning.md Lesson 8.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { getPriceHint } from "../services/priceHint.js";

// Fetches a price hint with debounce and stale-response protection
export function usePriceHint() {
  const [priceHint, setPriceHint] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fetchIdRef = useRef(0);
  const debounceRef = useRef(null);

  // Fetches price hint for the given title and category (debounced)
  const fetchPriceHint = useCallback((title, category) => {
    // Clear any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Reset if title is empty
    if (!title || title.trim().length < 3) {
      setPriceHint(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setError(null);

    // Debounce: wait 800ms after the user stops typing
    debounceRef.current = setTimeout(async () => {
      const id = ++fetchIdRef.current;
      setIsLoading(true);

      try {
        const data = await getPriceHint(title, category);
        if (id === fetchIdRef.current) {
          setPriceHint(data);
        }
      } catch (err) {
        if (id === fetchIdRef.current) {
          setError(err.message);
          setPriceHint(null);
        }
      } finally {
        if (id === fetchIdRef.current) {
          setIsLoading(false);
        }
      }
    }, 800);
  }, []);

  // Clears the price hint state
  const clearPriceHint = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    fetchIdRef.current++;
    setPriceHint(null);
    setError(null);
    setIsLoading(false);
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return { priceHint, isLoading, error, fetchPriceHint, clearPriceHint };
}
