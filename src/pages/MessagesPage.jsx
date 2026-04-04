/**
 * MessagesPage.jsx
 * Messaging page — left sidebar of conversations, right panel for active chat thread.
 * Messages update in real-time via Supabase Realtime (wired by Mason, Issue #14).
 *
 * TODO: Replace MOCK_CONVERSATIONS and MOCK_MESSAGES with useMessages() hook (Issue #14).
 */

import { useState, useRef, useEffect } from "react";
import { useAuth } from "../hooks/useAuth.jsx";
import "./MessagesPage.css";

// ---------------------------------------------------------------------------
// Mock data — matches the real DB shape (messages table joined with profiles)
// Replace with: const { conversations, messages, sendMessage } = useMessages();
// ---------------------------------------------------------------------------
const CURRENT_USER_ID = "me";

const MOCK_CONVERSATIONS = [
  {
    id: "conv-1",
    otherUser: { id: "user-2", name: "Alex Johnson", avatar_url: "https://i.pravatar.cc/150?img=5" },
    listing: { id: "1", title: "Vintage Levi Denim Jacket", image_url: "https://picsum.photos/seed/jacket1/60/60" },
    lastMessage: "Is this still available?",
    lastMessageAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    unread: true,
  },
  {
    id: "conv-2",
    otherUser: { id: "user-3", name: "Maria Garcia", avatar_url: "https://i.pravatar.cc/150?img=9" },
    listing: { id: "2", title: "Nike Air Force 1 Size 10", image_url: "https://picsum.photos/seed/shoes1/60/60" },
    lastMessage: "Can we meet at Geisel at 3pm?",
    lastMessageAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    unread: false,
  },
  {
    id: "conv-3",
    otherUser: { id: "user-4", name: "Jake Kim", avatar_url: "https://i.pravatar.cc/150?img=12" },
    listing: { id: "3", title: "Floral Summer Dress", image_url: "https://picsum.photos/seed/dress1/60/60" },
    lastMessage: "Sounds good, see you then!",
    lastMessageAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    unread: false,
  },
];

const MOCK_MESSAGES = {
  "conv-1": [
    { id: "m1", sender_id: "user-2", content: "Hey! Is this jacket still available?", created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
    { id: "m2", sender_id: CURRENT_USER_ID, content: "Yes it is! Are you interested?", created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
    { id: "m3", sender_id: "user-2", content: "Is this still available?", created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
  ],
  "conv-2": [
    { id: "m4", sender_id: CURRENT_USER_ID, content: "Hi! I'm interested in the Air Force 1s.", created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
    { id: "m5", sender_id: "user-3", content: "Great! They're still available. Size 10 fits true to size.", created_at: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString() },
    { id: "m6", sender_id: CURRENT_USER_ID, content: "Perfect, can we meet somewhere on campus?", created_at: new Date(Date.now() - 2.2 * 60 * 60 * 1000).toISOString() },
    { id: "m7", sender_id: "user-3", content: "Can we meet at Geisel at 3pm?", created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  ],
  "conv-3": [
    { id: "m8", sender_id: "user-4", content: "Hi, is the dress still for sale?", created_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString() },
    { id: "m9", sender_id: CURRENT_USER_ID, content: "Yes! $18, meet at Price Center?", created_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString() },
    { id: "m10", sender_id: "user-4", content: "Sounds good, see you then!", created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
  ],
};

// Formats a timestamp as a short relative time (e.g. "10m ago", "2h ago")
function formatTime(dateStr) {
  const diff = Math.max(0, Date.now() - new Date(dateStr).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function MessagesPage() {
  const { user } = useAuth();
  // TODO: replace CURRENT_USER_ID with user?.sub after Issue #14 is wired up
  const [activeConvId, setActiveConvId] = useState(MOCK_CONVERSATIONS[0].id);
  const [input, setInput] = useState("");
  const [messagesByConv, setMessagesByConv] = useState(MOCK_MESSAGES);
  const bottomRef = useRef(null);

  const activeConv = MOCK_CONVERSATIONS.find((c) => c.id === activeConvId);
  const messages = messagesByConv[activeConvId] ?? [];

  // Scroll to the latest message whenever the active conversation or messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConvId, messages.length]);

  // Send a new message — optimistically adds to local state
  // TODO: Replace with sendMessage() from useMessages hook
  function handleSend() {
    const content = input.trim();
    if (!content) return;

    const newMessage = {
      id: crypto.randomUUID(),
      sender_id: CURRENT_USER_ID,
      content,
      created_at: new Date().toISOString(),
    };

    setMessagesByConv((prev) => ({
      ...prev,
      [activeConvId]: [...(prev[activeConvId] ?? []), newMessage],
    }));
    setInput("");
  }

  // Allow sending with Enter (Shift+Enter for newline)
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="messages">
      {/* Left sidebar — conversation list */}
      <aside className="messages-sidebar">
        <h2 className="messages-sidebar-title">Messages</h2>
        <ul className="messages-conv-list">
          {MOCK_CONVERSATIONS.map((conv) => (
            <li key={conv.id}>
              <button
                className={`messages-conv-item ${activeConvId === conv.id ? "messages-conv-item--active" : ""}`}
                onClick={() => setActiveConvId(conv.id)}
              >
                <div className="messages-conv-avatar-wrap">
                  <img
                    src={conv.otherUser.avatar_url}
                    alt={conv.otherUser.name}
                    className="messages-conv-avatar"
                  />
                  {conv.unread && <span className="messages-conv-unread-dot" />}
                </div>

                <div className="messages-conv-info">
                  <div className="messages-conv-header">
                    <span className="messages-conv-name">{conv.otherUser.name}</span>
                    <span className="messages-conv-time">{formatTime(conv.lastMessageAt)}</span>
                  </div>
                  <span className="messages-conv-listing">{conv.listing.title}</span>
                  <span className="messages-conv-preview">{conv.lastMessage}</span>
                </div>

                <img
                  src={conv.listing.image_url}
                  alt={conv.listing.title}
                  className="messages-conv-thumbnail"
                />
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Right panel — active chat thread */}
      <div className="messages-thread">
        {activeConv && (
          <>
            {/* Thread header */}
            <div className="messages-thread-header">
              <img
                src={activeConv.otherUser.avatar_url}
                alt={activeConv.otherUser.name}
                className="messages-thread-avatar"
              />
              <div className="messages-thread-header-info">
                <span className="messages-thread-name">{activeConv.otherUser.name}</span>
                <span className="messages-thread-listing">{activeConv.listing.title}</span>
              </div>
              <img
                src={activeConv.listing.image_url}
                alt={activeConv.listing.title}
                className="messages-thread-thumbnail"
              />
            </div>

            {/* Message bubbles */}
            <div className="messages-bubble-list">
              {messages.map((msg) => {
                const isMine = msg.sender_id === CURRENT_USER_ID;
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
        )}
      </div>
    </div>
  );
}
