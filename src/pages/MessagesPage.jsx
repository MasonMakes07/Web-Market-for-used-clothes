/**
 * MessagesPage.jsx
 * Messaging page — left sidebar of conversations, right panel for active chat thread.
 * Messages update in real-time via Supabase Realtime (wired through useMessages hook).
 */

import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { useMessages } from "../hooks/useMessages.jsx";
import "./MessagesPage.css";

// Formats a timestamp as a short relative time (e.g. "10m ago", "2h ago")
function formatTime(dateStr) {
  if (!dateStr) return "";
  const diff = Math.max(0, Date.now() - new Date(dateStr).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const userId = user?.sub || null;
  const {
    conversations,
    messages,
    activeThread,
    sendMessage,
    setActiveThread,
    isLoading,
    error,
  } = useMessages();

  const location = useLocation();
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  // Open thread from ListingModal's "Message Seller" navigation state
  useEffect(() => {
    if (location.state?.listingId && location.state?.sellerId) {
      setActiveThread(location.state.listingId, location.state.sellerId);
    }
  }, [location.state, setActiveThread]);

  // Select the first conversation by default if none is active
  useEffect(() => {
    if (!activeThread && conversations.length > 0) {
      const first = conversations[0];
      setActiveThread(first.listingId, first.otherUserId);
    }
  }, [activeThread, conversations, setActiveThread]);

  // Scroll to the latest message whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Find the active conversation object for the header
  const activeConv = conversations.find(
    (c) =>
      activeThread &&
      c.listingId === activeThread.listingId &&
      c.otherUserId === activeThread.otherUserId
  );

  // Send a message through the real service (sanitized server-side)
  async function handleSend() {
    const content = input.trim();
    if (!content || !activeThread) return;

    setInput("");
    try {
      await sendMessage(content, activeThread.otherUserId, activeThread.listingId);
    } catch {
      // Error is set in useMessages context
    }
  }

  // Allow sending with Enter (Shift+Enter for newline)
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (isLoading && conversations.length === 0) {
    return (
      <div className="messages">
        <p className="messages-loading">Loading messages...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="messages">
        <p className="messages-error">Failed to load messages. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="messages">
      {/* Left sidebar — conversation list */}
      <aside className="messages-sidebar">
        <h2 className="messages-sidebar-title">Messages</h2>
        {conversations.length === 0 ? (
          <p className="messages-empty">No conversations yet.</p>
        ) : (
          <ul className="messages-conv-list">
            {conversations.map((conv) => {
              const isActive =
                activeThread &&
                conv.listingId === activeThread.listingId &&
                conv.otherUserId === activeThread.otherUserId;

              return (
                <li key={`${conv.listingId}-${conv.otherUserId}`}>
                  <button
                    className={`messages-conv-item ${isActive ? "messages-conv-item--active" : ""}`}
                    onClick={() => setActiveThread(conv.listingId, conv.otherUserId)}
                  >
                    <div className="messages-conv-avatar-wrap">
                      <img
                        src={conv.otherUser?.avatar_url || "/default-avatar.png"}
                        alt={conv.otherUser?.name || "User"}
                        className="messages-conv-avatar"
                      />
                      {conv.unread > 0 && <span className="messages-conv-unread-dot" />}
                    </div>

                    <div className="messages-conv-info">
                      <div className="messages-conv-header">
                        <span className="messages-conv-name">{conv.otherUser?.name || "Unknown"}</span>
                        <span className="messages-conv-time">{formatTime(conv.lastMessage?.created_at)}</span>
                      </div>
                      <span className="messages-conv-listing">{conv.listing?.title || ""}</span>
                      <span className="messages-conv-preview">{conv.lastMessage?.content}</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      {/* Right panel — active chat thread */}
      <div className="messages-thread">
        {activeConv ? (
          <>
            {/* Thread header */}
            <div className="messages-thread-header">
              <img
                src={activeConv.otherUser?.avatar_url || "/default-avatar.png"}
                alt={activeConv.otherUser?.name || "User"}
                className="messages-thread-avatar"
              />
              <div className="messages-thread-header-info">
                <span className="messages-thread-name">{activeConv.otherUser?.name || "Unknown"}</span>
                <span className="messages-thread-listing">{activeConv.listing?.title || ""}</span>
              </div>
            </div>

            {/* Message bubbles */}
            <div className="messages-bubble-list">
              {messages.map((msg) => {
                const isMine = msg.sender_id === userId;
                return (
                  <div
                    key={msg.id}
                    className={`messages-bubble-wrap ${isMine ? "messages-bubble-wrap--mine" : ""}`}
                  >
                    <div className={`messages-bubble ${isMine ? "messages-bubble--mine" : "messages-bubble--theirs"}`}>
                      {msg.content}
                    </div>
                    <span className="messages-bubble-time">{formatTime(msg.created_at)}</span>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="messages-input-row">
              <textarea
                className="messages-input"
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                aria-label="Message input"
              />
              <button
                className="messages-send-btn"
                onClick={handleSend}
                disabled={!input.trim()}
                aria-label="Send message"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="messages-thread-empty">
            <p>Select a conversation to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
}
