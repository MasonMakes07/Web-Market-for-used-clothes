/**
 * useMessages.js
 * Messaging context provider and hook for the application.
 * Subscribes to Supabase Realtime on the messages table so new
 * messages appear instantly without page refresh.
 * Uses the context provider pattern (per Learning.md Lesson 2)
 * to share messaging state across all consuming components.
 * Exposes an unread count for the NavBar notification badge.
 */

import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from "react";
import { supabase } from "../lib/supabase.js";
import {
  sendMessage as sendMessageService,
  getMessages,
  getConversations,
  markThreadAsRead,
} from "../services/messages.js";
import { useAuth } from "./useAuth.jsx";

const MessagesContext = createContext(null);

// Provides messaging state to the entire app — mount once in main.jsx
export function MessagesProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.sub || null;

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeThread, setActiveThreadState] = useState(null);
  const [isConvLoading, setIsConvLoading] = useState(false);
  const [isMsgLoading, setIsMsgLoading] = useState(false);
  const [error, setError] = useState(null);

  // Derived from conversations state — no separate DB call needed, no race condition
  const unreadCount = useMemo(
    () => conversations.reduce((sum, c) => sum + (c.unread || 0), 0),
    [conversations]
  );

  // Separate fetch ID refs to prevent cross-cancellation (per code review)
  const convFetchId = useRef(0);
  const msgFetchId = useRef(0);

  // Ref for activeThread so Realtime callbacks see current value without re-subscribing
  const activeThreadRef = useRef(null);
  useEffect(() => {
    activeThreadRef.current = activeThread;
  }, [activeThread]);

  // Fetches all conversation threads for the current user (with stale-response protection)
  const fetchConversations = useCallback(async () => {
    if (!userId) return;

    const id = ++convFetchId.current;
    setIsConvLoading(true);
    setError(null);

    try {
      const data = await getConversations(userId);
      if (id === convFetchId.current) setConversations(data);
    } catch (err) {
      if (id === convFetchId.current) setError(err.message);
    } finally {
      if (id === convFetchId.current) setIsConvLoading(false);
    }
  }, [userId]);

  // Fetches messages for the active thread
  const fetchMessages = useCallback(async (listingId, otherUserId) => {
    if (!userId || !listingId || !otherUserId) return;

    const id = ++msgFetchId.current;
    setIsMsgLoading(true);
    setError(null);

    try {
      const data = await getMessages(listingId, userId, otherUserId);
      if (id === msgFetchId.current) setMessages(data);

      // Guard markThreadAsRead — if user switched threads, don't mark the old one
      if (id !== msgFetchId.current) return;
      await markThreadAsRead(userId, listingId, otherUserId);

      // Refresh conversations after marking as read so unreadCount stays accurate
      if (id === msgFetchId.current) fetchConversations();
    } catch (err) {
      if (id === msgFetchId.current) setError(err.message);
    } finally {
      if (id === msgFetchId.current) setIsMsgLoading(false);
    }
  }, [userId, fetchConversations]);

  // Sets the active thread and loads its messages
  const setActiveThread = useCallback((listingId, otherUserId) => {
    setActiveThreadState({ listingId, otherUserId });
    if (listingId && otherUserId) {
      fetchMessages(listingId, otherUserId);
    } else {
      setMessages([]);
    }
  }, [fetchMessages]);

  // Sends a message, appends it optimistically, then lets Realtime de-duplicate
  const sendMessage = useCallback(async (content, receiverId, listingId) => {
    if (!userId) {
      setError("You must be logged in to send messages.");
      return null;
    }

    setError(null);

    try {
      const newMsg = await sendMessageService(userId, content, receiverId, listingId);

      // Optimistically append to local messages if in the active thread
      const current = activeThreadRef.current;
      if (
        current &&
        newMsg.listing_id === current.listingId &&
        newMsg.receiver_id === current.otherUserId
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }

      return newMsg;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [userId]);

  // Load conversations when user logs in
  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchConversations();
    } else {
      setConversations([]);
      setMessages([]);
      setActiveThreadState(null);
    }
  }, [isAuthenticated, userId, fetchConversations]);

  // Subscribe to Supabase Realtime — depends only on userId, not activeThread
  useEffect(() => {
    if (!supabase || !userId) return;

    const channel = supabase
      .channel(`messages:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${userId}`,
        },
        async (payload) => {
          const newMsg = payload.new;
          const current = activeThreadRef.current;

          // If this message belongs to the active thread, fetchMessages handles
          // markThreadAsRead and then calls fetchConversations itself
          if (
            current &&
            newMsg.listing_id === current.listingId &&
            newMsg.sender_id === current.otherUserId
          ) {
            await fetchMessages(current.listingId, current.otherUserId);
          } else {
            // Not in active thread — just refresh conversations
            fetchConversations();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${userId}`,
        },
        async (payload) => {
          const newMsg = payload.new;
          const current = activeThreadRef.current;

          // fetchMessages handles markThreadAsRead and then calls fetchConversations itself
          if (
            current &&
            newMsg.listing_id === current.listingId &&
            newMsg.receiver_id === current.otherUserId
          ) {
            await fetchMessages(current.listingId, current.otherUserId);
          } else {
            // Not in active thread — just refresh conversations
            fetchConversations();
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount or when userId changes
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchConversations, fetchMessages]);

  const value = {
    conversations,
    messages,
    activeThread,
    unreadCount,
    sendMessage,
    setActiveThread,
    fetchConversations,
    isLoading: isConvLoading || isMsgLoading,
    error,
  };

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
}

// Consumes messages context — must be inside <MessagesProvider>
export function useMessages() {
  const ctx = useContext(MessagesContext);
  if (!ctx) {
    throw new Error("useMessages must be used within a <MessagesProvider>");
  }
  return ctx;
}
