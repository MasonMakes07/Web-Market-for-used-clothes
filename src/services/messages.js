/**
 * messages.js
 * Service layer for messaging operations against Supabase.
 * Handles sending messages, fetching conversation threads, and
 * retrieving messages within a thread. All message content is
 * sanitized before insert (per CLAUDE.md security rules).
 * All write operations require userId from the auth session,
 * never from user input (per Learning.md Lesson 5).
 */

import { supabase } from "../lib/supabase.js";
import { sanitizeText } from "../lib/sanitize.js";

// Validates that an ID is a safe string (alphanumeric, pipes, colons, hyphens)
// Prevents filter injection when IDs are interpolated into Supabase .or() filters
function validateId(id, name) {
  if (typeof id !== "string" || !/^[\w|:-]+$/.test(id)) {
    throw new Error(`Invalid ${name}.`);
  }
}

// Sends a new message — requires authenticated userId as sender_id
export async function sendMessage(userId, content, receiverId, listingId) {
  if (!supabase) throw new Error("Supabase client not initialized.");
  if (!userId) throw new Error("User ID is required to send a message.");
  if (!receiverId) throw new Error("Receiver ID is required.");
  if (!listingId) throw new Error("Listing ID is required.");

  validateId(userId, "user ID");
  validateId(receiverId, "receiver ID");
  validateId(listingId, "listing ID");

  if (typeof content !== "string" || content.trim() === "") {
    throw new Error("Message content cannot be empty.");
  }

  // Sanitize message content — strips HTML, rejects code-like input
  const sanitized = sanitizeText(content.trim());

  if (sanitized.length === 0) {
    throw new Error("Message content cannot be empty after sanitization.");
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      sender_id: userId,
      receiver_id: receiverId,
      listing_id: listingId,
      content: sanitized,
    })
    .select()
    .single();

  if (error) throw new Error("Failed to send message.");
  return data;
}

// Fetches all messages in a thread between two users about a listing, ordered oldest first
export async function getMessages(listingId, userId, otherUserId) {
  if (!supabase) throw new Error("Supabase client not initialized.");
  if (!userId) throw new Error("User ID is required.");

  validateId(userId, "user ID");
  validateId(otherUserId, "other user ID");
  validateId(listingId, "listing ID");

  const { data, error } = await supabase
    .from("messages")
    .select("*, sender:sender_id(name, avatar_url), receiver:receiver_id(name, avatar_url)")
    .eq("listing_id", listingId)
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
    .order("created_at", { ascending: true });

  if (error) throw new Error("Failed to fetch messages.");
  return data || [];
}

// Fetches all conversation threads for a user (latest message per thread)
export async function getConversations(userId) {
  if (!supabase) throw new Error("Supabase client not initialized.");
  if (!userId) throw new Error("User ID is required.");

  validateId(userId, "user ID");

  // Get all messages involving this user, newest first
  const { data, error } = await supabase
    .from("messages")
    .select("*, sender:sender_id(name, avatar_url), receiver:receiver_id(name, avatar_url), listing:listing_id(title, image_url)")
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch conversations: ${error.message} (code: ${error.code})`);
  if (!data || data.length === 0) return [];

  // Group by thread key (listing_id + other_user_id) and keep the latest message
  const threads = new Map();
  for (const msg of data) {
    const otherUserId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
    const threadKey = `${msg.listing_id}:${otherUserId}`;

    if (!threads.has(threadKey)) {
      threads.set(threadKey, {
        threadKey,
        listingId: msg.listing_id,
        otherUserId,
        listing: msg.listing,
        otherUser: msg.sender_id === userId ? msg.receiver : msg.sender,
        lastMessage: msg,
        unread: 0,
      });
    }

    // Count unread messages (received by current user and not yet read)
    if (msg.receiver_id === userId && !msg.read) {
      const thread = threads.get(threadKey);
      thread.unread += 1;
    }
  }

  return Array.from(threads.values());
}

// Marks all messages in a thread as read for the current user
export async function markThreadAsRead(userId, listingId, otherUserId) {
  if (!supabase) throw new Error("Supabase client not initialized.");
  if (!userId) throw new Error("User ID is required.");

  validateId(userId, "user ID");
  validateId(listingId, "listing ID");
  validateId(otherUserId, "other user ID");

  const { error } = await supabase
    .from("messages")
    .update({ read: true })
    .eq("listing_id", listingId)
    .eq("sender_id", otherUserId)
    .eq("receiver_id", userId)
    .eq("read", false);

  if (error) throw new Error("Failed to mark messages as read.");
}

// Returns the total unread message count for a user
export async function getUnreadCount(userId) {
  if (!supabase) throw new Error("Supabase client not initialized.");
  if (!userId) throw new Error("User ID is required.");

  validateId(userId, "user ID");

  const { count, error } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("receiver_id", userId)
    .eq("read", false);

  if (error) throw new Error("Failed to fetch unread count.");
  return count || 0;
}
