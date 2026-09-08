import { useState } from "react";
import Icon from "./icons.jsx";
import { SPOTS, newId } from "./data.js";
import { EmptyState, ItemImage } from "./components.jsx";
import { downloadCalendar, googleCalendarUrl } from "./calendar.js";

// Formats calendar instants using the device's timezone, including date changes.
function readable(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

// Local chat and pickup state exercise the complete flow without pretending to send remotely.
export default function Inbox({ data, change, activeId, setActiveId, notify }) {
  const [text, setText] = useState("");
  const [scheduling, setScheduling] = useState(false);
  const [spot, setSpot] = useState(SPOTS[0]);
  const [time, setTime] = useState("");
  const threads = data.threads.filter(
    (thread) => !data.blocked.includes(thread.seller),
  );
  const thread = threads.find((item) => item.id === activeId);
  const listing = data.listings.find((item) => item.id === thread?.listingId);

  // All preview messages remain on this device and are labeled accordingly.
  function send(event) {
    event.preventDefault();
    if (!text.trim() || !thread) return;
    change((current) => ({
      ...current,
      threads: current.threads.map((item) =>
        item.id === thread.id
          ? {
              ...item,
              messages: [
                ...item.messages,
                {
                  id: newId(),
                  from: "me",
                  text: text.trim(),
                  at: new Date().toISOString(),
                },
              ],
            }
          : item,
      ),
    }));
    setText("");
  }

  // Replaces a proposal with a new stable event identity and validates future time.
  function propose(event) {
    event.preventDefault();
    const start = new Date(time);
    if (!Number.isFinite(start.getTime()) || start <= new Date()) {
      notify("Choose a pickup time in the future.");
      return;
    }
    change((current) => ({
      ...current,
      threads: current.threads.map((item) =>
        item.id === thread.id
          ? {
              ...item,
              meetup: {
                id: newId(),
                spot,
                start: start.toISOString(),
                status: "proposed",
              },
            }
          : item,
      ),
    }));
    setScheduling(false);
    notify("Pickup proposed in your local preview.");
  }

  // The explicit simulation is never confused with another student's real acceptance.
  function meetupStatus(status) {
    change((current) => ({
      ...current,
      threads: current.threads.map((item) =>
        item.id === thread.id
          ? { ...item, meetup: { ...item.meetup, status } }
          : item,
      ),
    }));
    notify(
      status === "confirmed"
        ? "Sample acceptance simulated. Try the calendar buttons."
        : "Pickup cancelled. Update any calendar copy yourself.",
    );
  }

  return (
    <section>
      <div className="tt-page-heading">
        <div>
          <p className="tt-eyebrow">
            FROM “IS THIS AVAILABLE?” TO “SEE YOU THERE.”
          </p>
          <h1>Your campus conversations.</h1>
          <p>Good finds, friendly faces, easy pickups.</p>
        </div>
      </div>
      <div className={`tt-inbox ${thread ? "tt-thread-open" : ""}`}>
        <aside className="tt-thread-list">
          <div className="tt-section-title">
            <h2>Messages</h2>
            <span>{threads.length}</span>
          </div>
          {threads.length ? (
            threads.map((item) => {
              const product = data.listings.find(
                (listing) => listing.id === item.listingId,
              );
              return (
                <button
                  className={`tt-thread-item ${item.id === activeId ? "active" : ""}`}
                  key={item.id}
                  onClick={() => {
                    setActiveId(item.id);
                    setText("");
                    setScheduling(false);
                  }}
                >
                  <ItemImage src={product?.photos[0]} alt="" />
                  <div>
                    <strong>
                      {item.seller}
                      <span>{item.college}</span>
                    </strong>
                    <p>{product?.title || "Listing no longer available"}</p>
                    <small>
                      {item.messages.at(-1)?.text || "Start the conversation"}
                    </small>
                  </div>
                </button>
              );
            })
          ) : (
            <p className="tt-muted">
              Message a seller from any listing to start.
            </p>
          )}
          <p className="tt-local-note">
            Preview conversations are stored here, not sent to other people.
          </p>
        </aside>
        <div className="tt-chat-pane">
          {thread ? (
            <>
              <div className="tt-chat-header">
                <button
                  className="tt-icon-button tt-mobile-back"
                  aria-label="Back to conversations"
                  onClick={() => setActiveId(null)}
                >
                  <Icon name="back" />
                </button>
                <span className="tt-avatar">{thread.seller[0]}</span>
                <div>
                  <strong>{thread.seller}</strong>
                  <p>{thread.college} College · sample seller</p>
                </div>
                <button
                  className="tt-icon-button"
                  aria-label={`Block ${thread.seller} in preview`}
                  onClick={() => {
                    change((current) => ({
                      ...current,
                      blocked: [...current.blocked, thread.seller],
                    }));
                    setActiveId(null);
                    notify(
                      "Seller blocked in this device preview. Unblock them in Profile.",
                    );
                  }}
                >
                  <Icon name="shield" />
                </button>
              </div>
              {listing && (
                <div className="tt-chat-listing">
                  <ItemImage src={listing.photos[0]} alt="" />
                  <span>
                    {listing.title}
                    <strong>${listing.price}</strong>
                  </span>
                  <span className="tt-soft-label">{listing.status}</span>
                </div>
              )}
              <div className="tt-chat-messages" aria-label="Conversation">
                <p className="tt-chat-date">
                  LOCAL PREVIEW · NO MESSAGES ARE SENT
                </p>
                {thread.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`tt-bubble ${message.from === "me" ? "tt-bubble-me" : ""}`}
                  >
                    <p>{message.text}</p>
                    <small>
                      {message.from === "me"
                        ? "Saved locally"
                        : "Sample message"}
                    </small>
                  </div>
                ))}
                {thread.meetup && (
                  <div className="tt-meetup-card">
                    <div className="tt-meetup-title">
                      <Icon name="calendar" />
                      <strong>Campus pickup</strong>
                      <span>{thread.meetup.status}</span>
                    </div>
                    <h3>{thread.meetup.spot}</h3>
                    <p>{readable(thread.meetup.start)}</p>
                    {thread.meetup.status === "proposed" && (
                      <button
                        className="tt-button tt-full"
                        onClick={() => meetupStatus("confirmed")}
                      >
                        Simulate sample seller accepting
                      </button>
                    )}
                    {thread.meetup.status === "confirmed" && (
                      <>
                        <div className="tt-calendar-actions">
                          <a
                            className="tt-button tt-button-secondary"
                            href={googleCalendarUrl(
                              thread.meetup,
                              listing?.title || "Item pickup",
                            )}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Google Calendar ↗
                          </a>
                          <button
                            className="tt-button tt-button-secondary"
                            onClick={() =>
                              downloadCalendar(
                                thread.meetup,
                                listing?.title || "Item pickup",
                              )
                            }
                          >
                            Apple / .ics
                            <Icon name="calendar" size={16} />
                          </button>
                        </div>
                        <small>
                          Calendar copies won’t automatically update if plans
                          change.
                        </small>
                      </>
                    )}
                    {thread.meetup.status !== "cancelled" && (
                      <button
                        className="tt-text-button"
                        onClick={() => meetupStatus("cancelled")}
                      >
                        Cancel pickup
                      </button>
                    )}
                  </div>
                )}
              </div>
              {scheduling && (
                <form className="tt-schedule-form" onSubmit={propose}>
                  <div className="tt-section-title">
                    <h3>Meet you on campus</h3>
                    <button
                      type="button"
                      className="tt-icon-button"
                      aria-label="Close pickup form"
                      onClick={() => setScheduling(false)}
                    >
                      <Icon name="close" size={18} />
                    </button>
                  </div>
                  <label>
                    Meetup spot
                    <select
                      value={spot}
                      onChange={(event) => setSpot(event.target.value)}
                    >
                      {SPOTS.map((value) => (
                        <option key={value}>{value}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Date and time{" "}
                    <span>
                      {Intl.DateTimeFormat().resolvedOptions().timeZone}
                    </span>
                    <input
                      required
                      type="datetime-local"
                      value={time}
                      onChange={(event) => setTime(event.target.value)}
                    />
                  </label>
                  <button className="tt-button tt-full" type="submit">
                    Propose pickup
                    <Icon name="arrow" size={17} />
                  </button>
                </form>
              )}
              <form className="tt-message-form" onSubmit={send}>
                <button
                  type="button"
                  className="tt-icon-button"
                  aria-label="Schedule a campus pickup"
                  aria-expanded={scheduling}
                  onClick={() => setScheduling(!scheduling)}
                >
                  <Icon name="calendar" />
                </button>
                <input
                  aria-label="Message"
                  value={text}
                  maxLength={2000}
                  placeholder="Write a message…"
                  onChange={(event) => setText(event.target.value)}
                />
                <button
                  type="submit"
                  className="tt-send-button"
                  disabled={!text.trim()}
                  aria-label="Save message in preview"
                >
                  <Icon name="send" size={20} />
                </button>
              </form>
            </>
          ) : (
            <EmptyState icon="chat" title="A good find starts a conversation">
              Choose a chat, or find something you love and message its seller.
            </EmptyState>
          )}
        </div>
      </div>
    </section>
  );
}
