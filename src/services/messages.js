/**
 * messages.js
 * Service layer for messaging operations against Supabase.
 * Handles sending messages and fetching conversation history between users.
 */

// TODO: Implement Supabase queries for messages table

// Fetches messages for a conversation (by listing and participants)
export async function getMessages(listingId, userId) {
  return [];
}

// Sends a new message
// TODO: Sanitize message content before inserting — reject code-like input (see CLAUDE.md)
export async function sendMessage(messageData) {
  return null;
}

// Fetches all conversations for a user
export async function getConversations(userId) {
  return [];
}
