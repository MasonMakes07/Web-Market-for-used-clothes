/**
 * MessagesPage.jsx
 * Three-panel messaging layout:
 *   Section 1 (left)  — scrollable conversation list
 *   Section 2 (center) — active chat thread, auto-scrolls to latest message
 *   Section 3 (right)  — scrollable meetup spot selector; clicking a spot
 *                        sends a proposal message into Section 2 with ✓/✗ buttons
 */

import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { useMessages } from "../hooks/useMessages.jsx";
import "./MessagesPage.css";

// UCSD meetup locations — images live in /public/
const MEETUP_SPOTS = [
  {
    id: "warren_bear",
    name: "Warren Bear",
    desc: "Warren College, near CSE Building",
    image: "/[Location] Warren Bear.jpg",
  },
  {
    id: "64_degrees",
    name: "64 Degrees",
    desc: "Warren College dining hall",
    image: "/[Location] 64 Degrees.png",
  },
  {
    id: "goodys",
    name: "Goody's Marketplace",
    desc: "Convenience store, ERC area",
    image: "/[Location] Goody's Marketplace.png",
  },
  {
    id: "bistro",
    name: "The Bistro",
    desc: "Dining & coffee, campus center",
    image: "/[Location] The Bistro.png",
  },
  {
    id: "geisel",
    name: "Geisel Library",
    desc: "Iconic campus library entrance",
    image: "/[Location] Geisel.png",
  },
  {
    id: "sun_god",
    name: "Sun God Lawn",
    desc: "Open lawn area, Muir College",
    image: "/[Location] Sun God Lawn.png",
  },
  {
    id: "panda",
    name: "Panda Express",
    desc: "Panda Express @ Price Center",
    image: "/[Location] Panda Express @ Price Center.png",
  },
];

// Prefix tokens used to encode special message types
const PROPOSAL_PREFIX  = "__MEETUP__:";
const ACCEPT_PREFIX    = "__MEETUP_OK__:";
const DECLINE_PREFIX   = "__MEETUP_NO__:";
const TIME_PREFIX      = "__TIME__:";
const TIME_OK_PREFIX   = "__TIME_OK__:";
const TIME_NO_PREFIX   = "__TIME_NO__:";

// Returns spot data by name, or null if not found
function findSpot(name) {
  return MEETUP_SPOTS.find((s) => s.name === name) || null;
}

// Builds a Google Calendar "add event" URL — no API key required
function buildCalendarUrl(spotName, isoDateTime, itemTitle) {
  const start = new Date(isoDateTime);
  const end = new Date(start.getTime() + 60 * 60 * 1000); // 1-hour block
  const pad = (d) => d.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Triton Thrift Meetup${itemTitle ? `: ${itemTitle}` : ""}`,
    location: spotName,
    dates: `${pad(start)}/${pad(end)}`,
    details: "Meetup arranged via Triton Thrift",
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

// Formats an ISO datetime string for display (e.g. "Sat Apr 5 at 2:00 PM")
function formatDateTime(isoStr) {
  if (!isoStr) return "";
  return new Date(isoStr).toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

// Decodes internal meetup prefixes into human-readable preview text
function previewText(content) {
  if (!content) return "";
  if (content.startsWith(PROPOSAL_PREFIX))
    return `Meetup proposed: ${content.slice(PROPOSAL_PREFIX.length)}`;
  if (content.startsWith(ACCEPT_PREFIX))
    return `Meetup confirmed: ${content.slice(ACCEPT_PREFIX.length)}`;
  if (content.startsWith(DECLINE_PREFIX))
    return `Meetup declined: ${content.slice(DECLINE_PREFIX.length)}`;
  if (content.startsWith(TIME_PREFIX)) {
    const [spot, dt] = content.slice(TIME_PREFIX.length).split("|");
    return `Time proposed: ${spot} @ ${formatDateTime(dt)}`;
  }
  if (content.startsWith(TIME_OK_PREFIX))
    return `Time confirmed!`;
  if (content.startsWith(TIME_NO_PREFIX))
    return `Time declined`;
  return content;
}

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

// Renders a single message bubble — handles text, meetup proposals, time proposals, and responses
function MessageBubble({ msg, userId, allMessages, onAccept, onDecline, onAcceptTime, onDeclineTime, calendarUrl }) {
  const [imgFailed, setImgFailed] = useState(false);
  const isMine = msg.sender_id === userId;
  const { content } = msg;

  // ── Meetup proposal ─────────────────────────────────────────────────────────
  if (content.startsWith(PROPOSAL_PREFIX)) {
    const spotName = content.slice(PROPOSAL_PREFIX.length);
    const spot = findSpot(spotName);

    // Check if a response already exists for this spot name in the thread
    const alreadyResponded = allMessages.some(
      (m) =>
        (m.content.startsWith(ACCEPT_PREFIX) || m.content.startsWith(DECLINE_PREFIX)) &&
        (m.content.slice(ACCEPT_PREFIX.length) === spotName ||
          m.content.slice(DECLINE_PREFIX.length) === spotName)
    );

    return (
      <div className="messages-meetup-proposal">
        {spot?.image && !imgFailed ? (
          <img
            src={spot.image}
            alt={spotName}
            className="messages-meetup-img"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="messages-meetup-img-placeholder" />
        )}
        <p className="messages-meetup-name">{spotName}</p>
        {spot?.desc && <p className="messages-meetup-desc">{spot.desc}</p>}

        {isMine || alreadyResponded ? (
          <p className="messages-meetup-pending">
            {alreadyResponded ? "Response sent." : "Waiting for response..."}
          </p>
        ) : (
          <div className="messages-meetup-actions">
            <button
              className="messages-meetup-btn messages-meetup-btn--accept"
              onClick={() => onAccept(spotName)}
              aria-label={`Accept meetup at ${spotName}`}
            >
              ✓
            </button>
            <button
              className="messages-meetup-btn messages-meetup-btn--decline"
              onClick={() => onDecline(spotName)}
              aria-label={`Decline meetup at ${spotName}`}
            >
              ✗
            </button>
          </div>
        )}
        <span className="messages-bubble-time">{formatTime(msg.created_at)}</span>
      </div>
    );
  }

  // ── Meetup accepted ──────────────────────────────────────────────────────────
  if (content.startsWith(ACCEPT_PREFIX)) {
    const spotName = content.slice(ACCEPT_PREFIX.length);
    return (
      <div className="messages-system-msg messages-system-msg--ok">
        ✓ Meetup at <strong>{spotName}</strong> confirmed!
      </div>
    );
  }

  // ── Meetup declined ──────────────────────────────────────────────────────────
  if (content.startsWith(DECLINE_PREFIX)) {
    const spotName = content.slice(DECLINE_PREFIX.length);
    return (
      <div className="messages-system-msg messages-system-msg--no">
        ✗ <strong>{spotName}</strong> didn&apos;t work. Pick another spot.
      </div>
    );
  }

  // ── Time proposal ────────────────────────────────────────────────────────────
  if (content.startsWith(TIME_PREFIX)) {
    const payload = content.slice(TIME_PREFIX.length);
    const [spotName, isoDateTime] = payload.split("|");
    const alreadyRespondedTime = allMessages.some((m) => {
      if (m.content.startsWith(TIME_OK_PREFIX)) return m.content.slice(TIME_OK_PREFIX.length) === payload;
      if (m.content.startsWith(TIME_NO_PREFIX)) return m.content.slice(TIME_NO_PREFIX.length) === payload;
      return false;
    });
    return (
      <div className="messages-time-proposal">
        <p className="messages-time-proposal-label">📅 Proposed time</p>
        <p className="messages-time-proposal-spot">📍 {spotName}</p>
        <p className="messages-time-proposal-dt">{formatDateTime(isoDateTime)}</p>
        {isMine || alreadyRespondedTime ? (
          <p className="messages-meetup-pending">
            {alreadyRespondedTime ? "Response sent." : "Waiting for response..."}
          </p>
        ) : (
          <div className="messages-meetup-actions">
            <button
              className="messages-meetup-btn messages-meetup-btn--accept"
              onClick={() => onAcceptTime(payload)}
              aria-label="Accept this time"
            >✓</button>
            <button
              className="messages-meetup-btn messages-meetup-btn--decline"
              onClick={() => onDeclineTime(payload)}
              aria-label="Decline this time"
            >✗</button>
          </div>
        )}
        <span className="messages-bubble-time">{formatTime(msg.created_at)}</span>
      </div>
    );
  }

  // ── Time confirmed ───────────────────────────────────────────────────────────
  if (content.startsWith(TIME_OK_PREFIX)) {
    const payload = content.slice(TIME_OK_PREFIX.length);
    const [spotName, isoDateTime] = payload.split("|");
    return (
      <div className="messages-system-msg messages-system-msg--ok messages-system-msg--calendar">
        ✓ Meetup at <strong>{spotName}</strong> on <strong>{formatDateTime(isoDateTime)}</strong> confirmed!
        {calendarUrl && (
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="messages-calendar-link"
          >
            Add to Google Calendar
          </a>
        )}
      </div>
    );
  }

  // ── Time declined ────────────────────────────────────────────────────────────
  if (content.startsWith(TIME_NO_PREFIX)) {
    return (
      <div className="messages-system-msg messages-system-msg--no">
        ✗ That time didn&apos;t work. Propose another.
      </div>
    );
  }

  // ── Regular text bubble ──────────────────────────────────────────────────────
  return (
    <div className={`messages-bubble-wrap ${isMine ? "messages-bubble-wrap--mine" : ""}`}>
      <div className={`messages-bubble ${isMine ? "messages-bubble--mine" : "messages-bubble--theirs"}`}>
        {content}
      </div>
      <span className="messages-bubble-time">{formatTime(msg.created_at)}</span>
    </div>
  );
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
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [proposedDate, setProposedDate] = useState("");
  const [proposedTime, setProposedTime] = useState("");
  const bottomRef = useRef(null);
  const todayStr = new Date().toISOString().slice(0, 10);

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

  // Scroll to the latest message whenever a new message is added
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeConv = conversations.find(
    (c) =>
      activeThread &&
      c.listingId === activeThread.listingId &&
      c.otherUserId === activeThread.otherUserId
  );

  // Sends a plain text message
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

  // Enter to send, Shift+Enter for newline
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Sends a meetup proposal message for the selected spot
  async function handleSpotSelect(spot) {
    if (!activeThread) return;
    try {
      await sendMessage(
        `${PROPOSAL_PREFIX}${spot.name}`,
        activeThread.otherUserId,
        activeThread.listingId
      );
    } catch {
      // Error is set in useMessages context
    }
  }

  // Sends a meetup acceptance message
  async function handleAccept(spotName) {
    if (!activeThread) return;
    try {
      await sendMessage(
        `${ACCEPT_PREFIX}${spotName}`,
        activeThread.otherUserId,
        activeThread.listingId
      );
    } catch {
      // Error is set in useMessages context
    }
  }

  // Sends a meetup decline message
  async function handleDecline(spotName) {
    if (!activeThread) return;
    try {
      await sendMessage(
        `${DECLINE_PREFIX}${spotName}`,
        activeThread.otherUserId,
        activeThread.listingId
      );
    } catch {
      // Error is set in useMessages context
    }
  }

  // Derive confirmed spot from the most recent __MEETUP_OK__ message
  const confirmedSpot = [...messages].reverse()
    .find((m) => m.content.startsWith(ACCEPT_PREFIX))
    ?.content.slice(ACCEPT_PREFIX.length) || null;

  // Derive confirmed time payload (SpotName|ISO) from __TIME_OK__ message
  const confirmedTimePayload = messages
    .find((m) => m.content.startsWith(TIME_OK_PREFIX))
    ?.content.slice(TIME_OK_PREFIX.length) || null;

  // Build Google Calendar URL once time is confirmed
  const calendarUrl = confirmedTimePayload
    ? (() => {
        const [spot, dt] = confirmedTimePayload.split("|");
        return buildCalendarUrl(spot, dt, activeConv?.listing?.title);
      })()
    : null;

  // Sends a time proposal message
  async function handleProposeTime() {
    if (!activeThread || !proposedDate || !proposedTime || !confirmedSpot) return;
    const isoDateTime = `${proposedDate}T${proposedTime}`;
    setShowTimePicker(false);
    setProposedDate("");
    setProposedTime("");
    try {
      await sendMessage(
        `${TIME_PREFIX}${confirmedSpot}|${isoDateTime}`,
        activeThread.otherUserId,
        activeThread.listingId
      );
    } catch {
      // Error is set in useMessages context
    }
  }

  // Sends a time acceptance message
  async function handleAcceptTime(payload) {
    if (!activeThread) return;
    try {
      await sendMessage(
        `${TIME_OK_PREFIX}${payload}`,
        activeThread.otherUserId,
        activeThread.listingId
      );
    } catch {
      // Error is set in useMessages context
    }
  }

  // Sends a time decline message
  async function handleDeclineTime(payload) {
    if (!activeThread) return;
    try {
      await sendMessage(
        `${TIME_NO_PREFIX}${payload}`,
        activeThread.otherUserId,
        activeThread.listingId
      );
    } catch {
      // Error is set in useMessages context
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
        <p className="messages-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="messages">

      {/* ── Section 1: Conversation list (independently scrollable) ── */}
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
                      <span className="messages-conv-preview">{previewText(conv.lastMessage?.content)}</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      {/* ── Section 2: Active chat thread (scrolls to latest message) ── */}
      <div className="messages-thread">
        {activeConv ? (
          <>
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

            <div className="messages-bubble-list">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  userId={userId}
                  allMessages={messages}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                  onAcceptTime={handleAcceptTime}
                  onDeclineTime={handleDeclineTime}
                  calendarUrl={calendarUrl}
                />
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Schedule bar — shown when spot confirmed but time not yet set */}
            {confirmedSpot && !confirmedTimePayload && (
              <div className="messages-schedule-bar">
                <span className="messages-schedule-bar-text">
                  📍 <strong>{confirmedSpot}</strong> confirmed
                </span>
                <button
                  className="messages-propose-time-btn"
                  onClick={() => setShowTimePicker((v) => !v)}
                >
                  {showTimePicker ? "Cancel" : "Propose Time"}
                </button>
              </div>
            )}

            {/* Inline date/time picker */}
            {showTimePicker && confirmedSpot && (
              <div className="messages-time-picker-row">
                <input
                  type="date"
                  className="messages-date-input"
                  value={proposedDate}
                  min={todayStr}
                  onChange={(e) => setProposedDate(e.target.value)}
                />
                <input
                  type="time"
                  className="messages-time-input"
                  value={proposedTime}
                  onChange={(e) => setProposedTime(e.target.value)}
                />
                <button
                  className="messages-send-btn"
                  onClick={handleProposeTime}
                  disabled={!proposedDate || !proposedTime}
                >
                  Send
                </button>
              </div>
            )}

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

      {/* ── Section 3: Meetup spot selector (independently scrollable) ── */}
      <aside className="messages-spots">
        <h2 className="messages-spots-title">Select a Meeting Spot</h2>
        <ul className="messages-spots-list">
          {MEETUP_SPOTS.map((spot) => (
            <li key={spot.id}>
              <button
                className="messages-spot-card"
                onClick={() => handleSpotSelect(spot)}
                disabled={!activeThread}
                aria-label={`Propose meetup at ${spot.name}`}
              >
                {spot.image ? (
                  <img
                    src={spot.image}
                    alt={spot.name}
                    className="messages-spot-img"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className="messages-spot-img-placeholder"
                  style={{ display: spot.image ? "none" : "flex" }}
                />
                <p className="messages-spot-name">{spot.name}</p>
                <p className="messages-spot-desc">{spot.desc}</p>
              </button>
            </li>
          ))}
        </ul>
      </aside>

    </div>
  );
}
