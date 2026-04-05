/**
 * usePriceHint.js
 * React hook for fetching AI-powered price suggestions.
 * Fires immediately on call (button-triggered, no debounce).
 * Uses stale-response protection (fetchIdRef) per Learning.md Lesson 8.
 */

import { useState, useCallback, useRef } from "react";
import { getPriceHint } from "../services/priceHint.js";

// Fetches a price hint with stale-response protection
export function usePriceHint() {
  const [priceHint, setPriceHint] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fetchIdRef = useRef(0);

  // Fetches price hint for the given title and category — fires immediately
  const fetchPriceHint = useCallback((title, category) => {
    // Reset if title is too short
    if (!title || title.trim().length < 3) {
      setPriceHint(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setError(null);

    const id = ++fetchIdRef.current;
    setIsLoading(true);

    getPriceHint(title, category)
      .then((data) => {
        if (id === fetchIdRef.current) setPriceHint(data);
      })
      .catch((err) => {
        if (id === fetchIdRef.current) {
          setError(err.message);
          setPriceHint(null);
        }
      })
      .finally(() => {
        if (id === fetchIdRef.current) setIsLoading(false);
      });
  }, []);

  // Clears the price hint state
  const clearPriceHint = useCallback(() => {
    fetchIdRef.current++;
    setPriceHint(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { priceHint, isLoading, error, fetchPriceHint, clearPriceHint };
}
