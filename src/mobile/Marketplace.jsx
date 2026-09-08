import { useEffect, useRef, useState } from "react";
import {
  HashRouter,
  NavLink,
  Route,
  Routes,
  useNavigate,
  useLocation,
} from "react-router-dom";
import Icon from "./icons.jsx";
import {
  initialState,
  migrate,
  COLLEGES,
  CATEGORIES,
  CONDITIONS,
  SPOTS,
  SELLERS,
  SAMPLE_FOLLOWERS,
  sampleSeller,
  STATE_VERSION,
  EMPTY_DRAFT,
  newId,
} from "./data.js";
import { readState, writeState } from "./storage.js";
import {
  EmptyState,
  ItemCard,
  ItemImage,
  Modal,
  RatingInput,
  Stars,
} from "./components.jsx";
import SessionProvider, { useSession } from "./Session.jsx";
import Sell from "./Sell.jsx";
import CampusAccount from "./CampusAccount.jsx";
import Inbox from "./Inbox.jsx";
import Jobs from "./Jobs.jsx";
import "./marketplace.css";

const tabs = [
  ["/", "discover", "Discover"],
  ["/saved", "heart", "Saved"],
  ["/sell", "plus", "Sell"],
  ["/jobs", "briefcase", "Jobs"],
  ["/inbox", "chat", "Inbox"],
  ["/profile", "user", "Profile"],
];

const GENDER_FILTERS = ["Men's", "Women's"];
// Gender isn't a meaningful attribute outside apparel, so a "Fits" filter
// narrows to these categories rather than pulling in unrelated Unisex items
// like electronics or books.
const GENDERED_CATEGORIES = ["Clothing", "Shoes", "Accessories"];

const EMPTY_FILTERS = Object.freeze({
  college: "",
  condition: "",
  price: "",
  sort: "newest",
  genders: Object.freeze([]),
});

// Root keeps the original website implementation available through the legacy entry switch.
export default function Marketplace() {
  return (
    <SessionProvider>
      <HashRouter>
        <PhoneApp />
      </HashRouter>
    </SessionProvider>
  );
}

// Owns local persistence and navigation for the usable, explicitly labeled device preview.
function PhoneApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = useSession();
  const [data, setData] = useState(null);
  const [storageError, setStorageError] = useState("");
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All finds");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [install, setInstall] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [reset, setReset] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [toast, setToast] = useState("");
  const [activeThread, setActiveThread] = useState(null);
  const writes = useRef(Promise.resolve());
  const saveVersion = useRef(0);
  const [online, setOnline] = useState(navigator.onLine);

  // Each tab starts at its heading rather than inheriting another screen's scroll.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    let active = true;
    readState()
      .then((saved) => {
        if (!active) return;
        if (
          saved &&
          (!Number.isInteger(saved.version) ||
            saved.version < 1 ||
            saved.version > STATE_VERSION ||
            !Array.isArray(saved.listings) ||
            !Array.isArray(saved.threads))
        )
          throw new Error("Stored data needs a compatible version of the app.");
        setData(saved ? migrate(saved) : initialState());
      })
      .catch(() => {
        if (active) {
          setLoadError(true);
          setStorageError(
            "Your device data could not be opened. Enable browser storage and reload. Existing data has not been replaced.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!data) return;
    const version = ++saveVersion.current;
    // Debounce typing while serializing transactions so older writes cannot win.
    const timer = setTimeout(() => {
      setSaving(true);
      writes.current = writes.current
        .catch(() => {})
        .then(() => writeState(data))
        .then(() => {
          if (version === saveVersion.current) {
            setStorageError("");
            setSaving(false);
          }
        })
        .catch((error) => {
          setStorageError(`${error.message} Keep this page open and retry.`);
          setSaving(false);
        });
    }, 150);
    return () => clearTimeout(timer);
  }, [data]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  // Saves/removes a listing without changing the current navigation state.
  function toggleSaved(id) {
    setData((current) => ({
      ...current,
      saved: current.saved.includes(id)
        ? current.saved.filter((item) => item !== id)
        : [...current.saved, id],
    }));
  }

  // Following is device-local: the sample seller is never told about it. The
  // membership test lives inside the updater so two clicks in one task cannot
  // both read the pre-render list and add the same name twice.
  function toggleFollow(seller) {
    setData((current) => {
      const following = current.following.includes(seller);
      return {
        ...current,
        following: following
          ? current.following.filter((name) => name !== seller)
          : [...current.following, seller],
      };
    });
    setToast(
      data.following.includes(seller)
        ? `You unfollowed ${seller} in your preview.`
        : `You’re following ${seller} in your preview.`,
    );
  }

  // A score of 0 clears the rating rather than storing a zero-star review.
  function rateSeller(seller, score) {
    setData((current) => {
      const ratings = { ...current.ratings };
      if (score) ratings[seller] = score;
      else delete ratings[seller];
      return { ...current, ratings };
    });
    setToast(
      score
        ? `You rated ${seller} ${score} star${score === 1 ? "" : "s"} on this device.`
        : `Your rating for ${seller} was removed.`,
    );
  }

  // Starts a device-only conversation and opens it in Inbox.
  function message(item) {
    if (data.blocked.includes(item.seller)) {
      setToast("Unblock this seller in Profile before starting a chat.");
      return;
    }
    let thread = data.threads.find((value) => value.listingId === item.id);
    if (!thread) {
      thread = {
        id: newId(),
        listingId: item.id,
        seller: item.seller,
        college: item.college,
        messages: [],
        meetup: null,
      };
      setData((current) => ({
        ...current,
        threads: [...current.threads, thread],
      }));
    }
    setActiveThread(thread.id);
    setSelectedId(null);
    navigate("/inbox");
  }

  // Local publishing uses the local profile identity and does not claim campus verification.
  function publish(draft) {
    const existing = draft.editingId
      ? data.listings.find(
          (item) =>
            item.id === draft.editingId && item.sellerId === "local-owner",
        )
      : null;
    if (draft.editingId && !existing) {
      setToast("This listing no longer exists. Start a new draft.");
      return;
    }
    const item = {
      ...draft,
      id: existing?.id || newId(),
      sellerId: "local-owner",
      seller: data.profile.name.trim() || "You",
      college: data.profile.college,
      createdAt: existing?.createdAt || new Date().toISOString(),
      sample: false,
      status: existing?.status || "active",
    };
    delete item.editingId;
    setData((current) => ({
      ...current,
      listings: existing
        ? current.listings.map((value) => (value.id === item.id ? item : value))
        : [item, ...current.listings],
      draft: { ...EMPTY_DRAFT, photos: [] },
    }));
    setQuery("");
    setCategory("All finds");
    setFilters(EMPTY_FILTERS);
    navigate("/profile");
    setToast(
      existing
        ? "Listing changes saved in your device preview."
        : "Your listing is now in your device preview.",
    );
  }

  // Uses native sharing when available and a clipboard fallback on secure desktop origins.
  async function share(item) {
    const text = `${item.title} · $${item.price} · Tritons Thrifts (local preview)`;
    try {
      if (navigator.share)
        await navigator.share({ title: "Tritons Thrifts", text });
      else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setToast(
          "Listing details copied. Preview listings do not have public links yet.",
        );
      } else
        setToast(
          "Sharing is unavailable in this browser. Preview listings do not have public links yet.",
        );
    } catch (error) {
      if (error.name !== "AbortError")
        setToast("Could not share this item. Try again.");
    }
  }

  if (!data)
    return (
      <div className="tt-boot">
        <div className="tt-brand-symbol">
          <Icon name="logo" size={34} />
        </div>
        <h1>Tritons Thrifts</h1>
        <p>{loadError ? storageError : "Getting your campus finds ready…"}</p>
        {loadError && (
          <button
            className="tt-button"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        )}
      </div>
    );
  const selected = data.listings.find((item) => item.id === selectedId);
  const localListings = data.listings.filter(
    (item) => item.sellerId === "local-owner",
  );
  const filterCount =
    [filters.college, filters.condition, filters.price].filter(Boolean).length +
    filters.genders.length;

  // Filters combine rather than replacing one another; numeric sorts do not mutate saved data.
  function visibleListings(savedOnly) {
    const result = data.listings.filter(
      (item) =>
        (savedOnly || item.status === "active") &&
        !data.blocked.includes(item.seller) &&
        (!savedOnly || data.saved.includes(item.id)) &&
        (category === "All finds" || item.category === category) &&
        (!filters.college || item.college === filters.college) &&
        (!filters.condition || item.condition === filters.condition) &&
        (filters.price === "" || item.price <= Number(filters.price)) &&
        (!filters.genders.length ||
          (GENDERED_CATEGORIES.includes(item.category) &&
            (item.gender === "Unisex" ||
              filters.genders.includes(item.gender)))) &&
        `${item.title} ${item.category} ${item.brand || ""} ${item.size}`
          .toLowerCase()
          .includes(query.toLowerCase().trim()),
    );
    return result.sort((a, b) =>
      filters.sort === "low"
        ? a.price - b.price
        : filters.sort === "high"
          ? b.price - a.price
          : new Date(b.createdAt) - new Date(a.createdAt),
    );
  }

  // Shared discover/saved layout preserves the same working search and filter controls.
  function browse(savedOnly = false) {
    const items = visibleListings(savedOnly);
    return (
      <section>
        {!savedOnly && (
          <div className="tt-hero">
            <div className="tt-hero-copy">
              <span className="tt-hero-pill">
                <span /> SECONDHAND. FIRST CHOICE.
              </span>
              <h1>
                Good finds.
                <br />
                <em>Just a walk away.</em>
              </h1>
              <p>Buy, sell, and find your next favorite at UCSD.</p>
              <button
                className="tt-hero-button"
                onClick={() => navigate("/sell")}
              >
                List your first find
                <Icon name="arrow" size={18} />
              </button>
            </div>
            <div className="tt-hero-image">
              <img
                src="/[Location] Geisel.png"
                alt="Geisel Library on the UC San Diego campus"
              />
              <div className="tt-hero-caption">
                <Icon name="pin" size={16} /> Meet you at Geisel
              </div>
              <span className="tt-campus-stamp">
                UCSD<span>LOCAL FINDS</span>
              </span>
            </div>
          </div>
        )}
        {savedOnly && (
          <div className="tt-page-heading">
            <div>
              <p className="tt-eyebrow">THE ONES YOU’VE GOT YOUR EYE ON</p>
              <h1>Your little collection.</h1>
              <p>Keep the good finds close. Come back when you’re ready.</p>
            </div>
            <Icon name="heart" size={35} />
          </div>
        )}
        <div className="tt-category-row" aria-label="Item categories">
          {CATEGORIES.map((value, index) => (
            <button
              key={value}
              className={value === category ? "active" : ""}
              aria-pressed={value === category}
              onClick={() => setCategory(value)}
            >
              {index === 0 && <Icon name="discover" size={16} />}
              {value}
            </button>
          ))}
        </div>
        <div className="tt-feed-heading">
          <div>
            <p className="tt-eyebrow">
              {savedOnly ? "SAVED FOR LATER" : "THE CAMPUS EDIT"}
            </p>
            <h2>
              {query
                ? `Results for “${query}”`
                : savedOnly
                  ? "Worth a second look"
                  : category === "All finds"
                    ? "Your next campus find"
                    : category}
              <span>{items.length} finds</span>
            </h2>
          </div>
          <button
            className={`tt-filter-button ${filterCount ? "active" : ""}`}
            onClick={() => setFilterOpen(true)}
          >
            <Icon name="filter" size={18} />
            <span>Filters{filterCount ? ` (${filterCount})` : ""}</span>
          </button>
        </div>
        {items.length ? (
          <div className="tt-item-grid">
            {items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                saved={data.saved.includes(item.id)}
                onSave={toggleSaved}
                onOpen={(item) => setSelectedId(item.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={savedOnly ? "heart" : "search"}
            title={
              savedOnly
                ? "Make room for your next find."
                : "Nothing here just yet."
            }
            action="Explore all finds"
            onAction={() => {
              setQuery("");
              setCategory("All finds");
              setFilters(EMPTY_FILTERS);
              navigate("/");
            }}
          >
            Try another search or clear your filters. Save a listing with the
            heart to keep it here.
          </EmptyState>
        )}
        <div className="tt-community-strip">
          <Icon name="leaf" size={25} />
          <div>
            <strong>Small campus. Big secondhand energy.</strong>
            <p>A little less waste. A little more community.</p>
          </div>
          <span>Made for Tritons ♡</span>
        </div>
      </section>
    );
  }

  return (
    <div className="tt-app">
      <a
        className="tt-skip"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main").focus();
        }}
      >
        Skip to content
      </a>
      <header className="tt-header">
        <NavLink to="/" className="tt-brand" aria-label="Tritons Thrifts home">
          <span className="tt-brand-symbol">
            <Icon name="logo" size={30} />
          </span>
          <span>
            Tritons <span className="tt-brand-light">Thrifts</span>
            <small>THE UCSD MARKETPLACE</small>
          </span>
        </NavLink>
        <div className="tt-header-search">
          <Icon name="search" size={19} />
          <input
            aria-label="Search the marketplace"
            placeholder="Find your next favorite…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              if (!["/", "/saved"].includes(window.location.hash.slice(1)))
                navigate("/");
            }}
          />
          {query && (
            <button
              className="tt-icon-button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
            >
              <Icon name="close" size={16} />
            </button>
          )}
        </div>
        <button
          className="tt-campus"
          onClick={() => {
            navigate("/");
            setFilterOpen(true);
          }}
        >
          <Icon name="pin" size={18} />
          <span>UC San Diego</span>
          <span className="tt-campus-dot" />
        </button>
        <button
          className="tt-header-profile tt-avatar"
          onClick={() => navigate("/profile")}
          aria-label="Open your profile"
        >
          {data.profile.name === "Your name" ? "Y" : data.profile.name[0]}
        </button>
      </header>
      <div className="tt-shell">
        <nav className="tt-nav" aria-label="Main navigation">
          {tabs.map(([path, icon, label]) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/"}
              className={({ isActive }) =>
                `${isActive ? "active" : ""} ${label === "Sell" ? "tt-nav-sell" : ""}`
              }
            >
              <span>
                <Icon name={icon} size={21} />
              </span>
              <span>{label}</span>
            </NavLink>
          ))}
          <div className="tt-nav-bottom">
            <span className="tt-nav-flower">
              <Icon name="shell" size={26} />
            </span>
            <p>
              Your campus.
              <br />A little closer.
            </p>
            <button onClick={() => setInstall(true)}>
              <Icon name="share" size={17} /> Get the phone app
            </button>
            <button onClick={() => setPrivacy(true)}>About this preview</button>
          </div>
        </nav>
        <main className="tt-main" id="main" tabIndex={-1}>
          <div className="tt-preview-bar">
            <span>
              <span className={`tt-dot ${!online ? "offline" : ""}`} />
              {online ? "Campus preview" : "You’re offline"}
              <span className="tt-preview-detail">
                {" "}
                · Sample community, saved on this device
              </span>
            </span>
            <button onClick={() => setInstall(true)}>
              {saving ? "Saving…" : "Add to Home Screen"}
              <Icon name="arrow" size={14} />
            </button>
          </div>
          {storageError && (
            <div className="tt-error" role="alert">
              {storageError}
              <button
                className="tt-text-button"
                onClick={() => setData((current) => ({ ...current }))}
              >
                Retry saving
              </button>
            </div>
          )}
          {session.error && (
            <p role="alert" className="tt-error">
              Scanner login failed. Your local marketplace still works.
            </p>
          )}
          <Routes>
            <Route path="/" element={browse()} />
            <Route path="/saved" element={browse(true)} />
            <Route
              path="/sell"
              element={
                <Sell
                  draft={data.draft}
                  updateDraft={(updates) =>
                    setData((current) => ({
                      ...current,
                      draft: { ...current.draft, ...updates },
                    }))
                  }
                  onPublish={publish}
                  notify={setToast}
                />
              }
            />
            <Route path="/jobs" element={<Jobs />} />
            <Route
              path="/inbox"
              element={
                <Inbox
                  data={data}
                  change={setData}
                  activeId={activeThread}
                  setActiveId={setActiveThread}
                  notify={setToast}
                />
              }
            />
            <Route
              path="/profile"
              element={
                <section>
                  <div className="tt-page-heading">
                    <div>
                      <p className="tt-eyebrow">YOUR CORNER OF CAMPUS</p>
                      <h1>A good place to start.</h1>
                      <p>Your profile, your finds, your next chapter.</p>
                    </div>
                  </div>
                  <CampusAccount />
                  <div className="tt-profile-layout">
                    <section className="tt-panel tt-profile-card">
                      <span className="tt-avatar tt-avatar-large">
                        {data.profile.name[0]}
                      </span>
                      <h2>{data.profile.name}</h2>
                      <p>{data.profile.college} College</p>
                      <span className="tt-soft-label">
                        Device preview · not verified
                      </span>
                      <div className="tt-profile-stats">
                        <div>
                          <strong>{localListings.length}</strong>
                          <span>Listed</span>
                        </div>
                        <div>
                          <strong>
                            {
                              localListings.filter(
                                (item) => item.status === "sold",
                              ).length
                            }
                          </strong>
                          <span>Sold</span>
                        </div>
                        <div>
                          <strong>{SAMPLE_FOLLOWERS.length}</strong>
                          <span>Followers · sample</span>
                        </div>
                        <div>
                          <strong>{data.following.length}</strong>
                          <span>Following</span>
                        </div>
                      </div>
                      <label>
                        Your name
                        <input
                          maxLength={50}
                          value={data.profile.name}
                          onChange={(event) =>
                            setData((current) => ({
                              ...current,
                              profile: {
                                ...current.profile,
                                name: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                      <label>
                        College
                        <select
                          value={data.profile.college}
                          onChange={(event) =>
                            setData((current) => ({
                              ...current,
                              profile: {
                                ...current.profile,
                                college: event.target.value,
                              },
                            }))
                          }
                        >
                          {COLLEGES.map((value) => (
                            <option key={value}>{value}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        A little about you
                        <textarea
                          maxLength={300}
                          value={data.profile.bio}
                          onChange={(event) =>
                            setData((current) => ({
                              ...current,
                              profile: {
                                ...current.profile,
                                bio: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                      <label>
                        Favorite meetup spot
                        <select
                          value={data.profile.spot}
                          onChange={(event) =>
                            setData((current) => ({
                              ...current,
                              profile: {
                                ...current.profile,
                                spot: event.target.value,
                              },
                            }))
                          }
                        >
                          {SPOTS.map((value) => (
                            <option key={value}>{value}</option>
                          ))}
                        </select>
                      </label>
                      <p className="tt-muted">
                        Profile edits save on this device.
                      </p>
                    </section>
                    <div>
                      <section className="tt-panel">
                        <div className="tt-section-title">
                          <h2>Your listings</h2>
                          <button
                            className="tt-text-button"
                            onClick={() => navigate("/sell")}
                          >
                            Add a find +
                          </button>
                        </div>
                        {localListings.length ? (
                          localListings.map((item) => (
                            <div key={item.id} className="tt-own-listing">
                              <button onClick={() => setSelectedId(item.id)}>
                                <ItemImage src={item.photos[0]} alt="" />
                                <span>
                                  <strong>{item.title}</strong>
                                  <small>
                                    ${item.price} · {item.status}
                                  </small>
                                </span>
                              </button>
                              <select
                                aria-label={`Status of ${item.title}`}
                                value={item.status}
                                onChange={(event) =>
                                  setData((current) => ({
                                    ...current,
                                    listings: current.listings.map((value) =>
                                      value.id === item.id
                                        ? {
                                            ...value,
                                            status: event.target.value,
                                          }
                                        : value,
                                    ),
                                  }))
                                }
                              >
                                {["active", "reserved", "sold"].map((value) => (
                                  <option key={value}>{value}</option>
                                ))}
                              </select>
                            </div>
                          ))
                        ) : (
                          <EmptyState
                            title="Your closet has potential."
                            icon="hanger"
                            action="List something good"
                            onAction={() => navigate("/sell")}
                          >
                            Start with the thing you love but never wear.
                          </EmptyState>
                        )}
                      </section>
                      <section className="tt-panel tt-social">
                        <div className="tt-section-title">
                          <h2>Your campus circle</h2>
                          <Icon name="users" size={19} />
                        </div>
                        <p className="tt-muted">
                          Follows and ratings stay on this device. The students
                          below are part of the preview’s sample community.
                        </p>
                        <h3>Following ({data.following.length})</h3>
                        {data.following.length ? (
                          <ul className="tt-people">
                            {data.following.map((name) => (
                              <li key={name}>
                                <span className="tt-avatar">{name[0]}</span>
                                <span className="tt-person-copy">
                                  <strong>{name}</strong>
                                  {SELLERS[name] && (
                                    <Stars
                                      value={SELLERS[name].rating}
                                      count={SELLERS[name].reviews}
                                      size={11}
                                    />
                                  )}
                                </span>
                                <button
                                  className="tt-follow is-following"
                                  aria-pressed="true"
                                  onClick={() => toggleFollow(name)}
                                >
                                  Following
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="tt-muted">
                            Open a sample listing and tap Follow to start your
                            circle.
                          </p>
                        )}
                        <h3>Followers ({SAMPLE_FOLLOWERS.length})</h3>
                        <ul className="tt-people">
                          {SAMPLE_FOLLOWERS.map((name) => (
                            <li key={name}>
                              <span className="tt-avatar">{name[0]}</span>
                              <span className="tt-person-copy">
                                <strong>{name}</strong>
                                <small>Sample student</small>
                              </span>
                              <button
                                className={`tt-follow ${
                                  data.following.includes(name)
                                    ? "is-following"
                                    : ""
                                }`}
                                aria-pressed={data.following.includes(name)}
                                onClick={() => toggleFollow(name)}
                              >
                                {data.following.includes(name)
                                  ? "Following"
                                  : "Follow back"}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </section>
                      <section className="tt-panel tt-settings">
                        <h2>A few essentials</h2>
                        <button onClick={() => setInstall(true)}>
                          <Icon name="share" /> Install on your phone
                          <Icon name="arrow" size={17} />
                        </button>
                        <button onClick={() => setPrivacy(true)}>
                          <Icon name="shield" /> Privacy & preview details
                          <Icon name="arrow" size={17} />
                        </button>
                        {session.configured && !session.ownerPreview && (
                          <button
                            onClick={() =>
                              session.user ? session.logout() : session.login()
                            }
                          >
                            <Icon name="user" />
                            {session.user
                              ? "Sign out of scanner account"
                              : "Connect scanner account"}
                            <Icon name="arrow" size={17} />
                          </button>
                        )}
                        {data.blocked.map((name) => (
                          <button
                            key={name}
                            onClick={() => {
                              setData((current) => ({
                                ...current,
                                blocked: current.blocked.filter(
                                  (value) => value !== name,
                                ),
                              }));
                              setToast(`${name} unblocked in preview.`);
                            }}
                          >
                            Unblock {name}
                            <Icon name="plus" />
                          </button>
                        ))}
                        <button
                          className="tt-danger"
                          onClick={() => setReset(true)}
                        >
                          <Icon name="logout" /> Delete my local data
                          <Icon name="arrow" size={17} />
                        </button>
                      </section>
                    </div>
                  </div>
                </section>
              }
            />
            <Route
              path="*"
              element={
                <EmptyState
                  title="This path took a detour."
                  action="Back to campus"
                  onAction={() => navigate("/")}
                >
                  Let’s get you back to the marketplace.
                </EmptyState>
              }
            />
          </Routes>
          <footer className="tt-footer">
            <span>Tritons Thrifts © {new Date().getFullYear()}</span>
            <span>Student-built. Independently operated.</span>
            <button onClick={() => setPrivacy(true)}>Privacy & about</button>
          </footer>
        </main>
      </div>
      {selected && (
        <Modal title="A closer look" onClose={() => setSelectedId(null)} wide>
          <div className="tt-detail-layout">
            <div className="tt-detail-photos">
              {selected.photos.map((photo, index) => (
                <ItemImage
                  key={index}
                  src={photo}
                  alt={`${selected.title}, photo ${index + 1}`}
                />
              ))}
            </div>
            <div className="tt-detail-info">
              <p className="tt-eyebrow">
                {selected.category} ·{" "}
                {selected.sample ? "SAMPLE FIND" : "YOUR LOCAL LISTING"}
              </p>
              <h2>{selected.title}</h2>
              <p className="tt-detail-price">
                {selected.price === 0 ? "Free" : `$${selected.price}`}
              </p>
              <div className="tt-tags">
                <span>{selected.condition}</span>
                {selected.size && <span>Size {selected.size}</span>}
                {selected.gender && selected.gender !== "Unisex" && (
                  <span>{selected.gender}</span>
                )}
                <span>{selected.status}</span>
              </div>
              <p className="tt-detail-description">
                {selected.description || "Ask the seller for more details."}
              </p>
              <div className="tt-seller">
                <span className="tt-avatar">{selected.seller?.[0] || "Y"}</span>
                <div>
                  <strong>{selected.seller || "You"}</strong>
                  <p>
                    {selected.college} College ·{" "}
                    {selected.sample ? "sample profile" : "device profile"}
                  </p>
                  {sampleSeller(selected) && (
                    <p className="tt-seller-stats">
                      <Stars
                        value={sampleSeller(selected).rating}
                        count={sampleSeller(selected).reviews}
                      />
                      <span>
                        {sampleSeller(selected).followers} sample followers
                      </span>
                    </p>
                  )}
                </div>
                {sampleSeller(selected) && (
                  <button
                    className={`tt-follow ${
                      data.following.includes(selected.seller)
                        ? "is-following"
                        : ""
                    }`}
                    aria-pressed={data.following.includes(selected.seller)}
                    onClick={() => toggleFollow(selected.seller)}
                  >
                    {data.following.includes(selected.seller)
                      ? "Following"
                      : "Follow"}
                  </button>
                )}
              </div>
              {sampleSeller(selected) && (
                <div className="tt-rate-seller">
                  <div>
                    <strong>Rate this seller</strong>
                    <p>
                      Saved on your device. Sample ratings above belong to the
                      preview community and don’t change.
                    </p>
                  </div>
                  <RatingInput
                    label={`Your rating for ${selected.seller}`}
                    value={data.ratings[selected.seller] || 0}
                    onChange={(score) => rateSeller(selected.seller, score)}
                  />
                  {Boolean(data.ratings[selected.seller]) && (
                    <button
                      className="tt-text-button"
                      onClick={() => rateSeller(selected.seller, 0)}
                    >
                      Remove my rating
                    </button>
                  )}
                </div>
              )}
              <div className="tt-meetup-hint">
                <Icon name="pin" />
                <p>
                  <strong>Keep it on campus</strong>Arrange a public meetup in
                  chat. Pay the seller directly.
                </p>
              </div>
              {selected.sellerId !== "local-owner" && (
                <button
                  disabled={selected.status !== "active"}
                  className="tt-button tt-full"
                  onClick={() => message(selected)}
                >
                  <Icon name="chat" size={19} />
                  Message seller in preview
                </button>
              )}
              {selected.sellerId === "local-owner" && (
                <>
                  <button
                    className="tt-button tt-full"
                    onClick={() => {
                      setData((current) => ({
                        ...current,
                        draft: {
                          title: selected.title,
                          price: String(selected.price),
                          category: selected.category,
                          size: selected.size || "",
                          gender: selected.gender || "Unisex",
                          brand: selected.brand || "",
                          condition: selected.condition,
                          description: selected.description,
                          photos: selected.photos,
                          editingId: selected.id,
                        },
                      }));
                      setSelectedId(null);
                      navigate("/sell");
                    }}
                  >
                    Edit listing
                    <Icon name="arrow" size={18} />
                  </button>
                  <button
                    className="tt-text-button tt-danger"
                    onClick={() => {
                      setDeleteId(selected.id);
                      setSelectedId(null);
                    }}
                  >
                    Delete this listing
                  </button>
                </>
              )}
              <div className="tt-detail-actions">
                <button
                  className="tt-button tt-button-secondary"
                  onClick={() => toggleSaved(selected.id)}
                >
                  <Icon name="heart" size={18} />
                  {data.saved.includes(selected.id) ? "Saved" : "Save"}
                </button>
                <button
                  className="tt-button tt-button-secondary"
                  onClick={() => share(selected)}
                >
                  <Icon name="share" size={18} />
                  Share details
                </button>
              </div>
              <button
                className="tt-text-button"
                onClick={() => {
                  setData((current) => ({
                    ...current,
                    reports: [
                      ...current.reports,
                      { listingId: selected.id, at: new Date().toISOString() },
                    ],
                  }));
                  setToast(
                    "Report recorded locally. This preview is not connected to a moderation team.",
                  );
                }}
              >
                <Icon name="flag" size={15} /> Report listing in preview
              </button>
            </div>
          </div>
        </Modal>
      )}
      {filterOpen && (
        <Modal
          title="Find your kind of find"
          onClose={() => setFilterOpen(false)}
        >
          <div className="tt-filter-fields">
            <label>
              College
              <select
                value={filters.college}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    college: event.target.value,
                  }))
                }
              >
                <option value="">All colleges</option>
                {COLLEGES.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label>
              Condition
              <select
                value={filters.condition}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    condition: event.target.value,
                  }))
                }
              >
                <option value="">Any condition</option>
                {CONDITIONS.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <fieldset className="tt-filter-checks">
              <legend>Fits</legend>
              {GENDER_FILTERS.map((value) => (
                <label key={value} className="tt-checkbox">
                  <input
                    type="checkbox"
                    checked={filters.genders.includes(value)}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        genders: event.target.checked
                          ? [...current.genders, value]
                          : current.genders.filter((v) => v !== value),
                      }))
                    }
                  />
                  {value}
                </label>
              ))}
            </fieldset>
            <label>
              Maximum price
              <input
                type="number"
                min="0"
                placeholder="Any price"
                value={filters.price}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    price: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              Sort by
              <select
                value={filters.sort}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    sort: event.target.value,
                  }))
                }
              >
                <option value="newest">Newest finds</option>
                <option value="low">Price: low to high</option>
                <option value="high">Price: high to low</option>
              </select>
            </label>
            <button
              className="tt-button tt-full"
              onClick={() => setFilterOpen(false)}
            >
              Show finds
              <Icon name="arrow" size={17} />
            </button>
            <button
              className="tt-text-button"
              onClick={() => setFilters(EMPTY_FILTERS)}
            >
              Reset filters
            </button>
          </div>
        </Modal>
      )}
      {install && (
        <Modal
          title="Your campus, in your pocket."
          onClose={() => setInstall(false)}
        >
          <div className="tt-install">
            <span className="tt-brand-symbol">
              <Icon name="logo" size={30} />
            </span>
            <p>Add Tritons Thrifts to your Home Screen for one-tap access.</p>
            <ol>
              <li>
                Open this site in <strong>Safari on your iPhone</strong>.
              </li>
              <li>
                Tap <strong>Share</strong>, then{" "}
                <strong>Add to Home Screen</strong>.
              </li>
              <li>
                Enable <strong>Open as Web App</strong> if shown, and tap{" "}
                <strong>Add</strong>.
              </li>
            </ol>
            <div className="tt-price-note">
              <Icon name="bag" />
              <p>
                This is the web app foundation. Your preview data belongs to
                this browser and may be separate in the installed app. Public
                student accounts and the App Store release come next.
              </p>
            </div>
          </div>
        </Modal>
      )}
      {privacy && (
        <Modal
          title="Built for a closer campus."
          onClose={() => setPrivacy(false)}
        >
          <div className="tt-about">
            <p>
              Tritons Thrifts is an independent, student-built marketplace
              concept for UC San Diego.
            </p>
            <h3>What works in this preview</h3>
            <p>
              Browse sample items, save favorites, upload photos, create local
              listings, edit your profile, try chat, and export pickup events.
              Changes are stored in this browser using IndexedDB.
            </p>
            <h3>What is shared</h3>
            <p>
              Local listings, profiles, reports, messages, follows, and ratings
              are not sent to other students. Seller ratings and follower counts
              belong to the preview’s sample community and do not change when
              you rate or follow. Sample product photos load from Unsplash.
              Calendar buttons open your calendar provider with the event
              details.
            </p>
            <h3>AI photo scanning</h3>
            <p>
              When configured, scanning sends the selected photos to our server
              and OpenAI only after you select the consent checkbox and start a
              scan. The server requires an approved pilot account. AI details
              need your review; this build does not provide verified market
              prices.
            </p>
            <h3>Your controls</h3>
            <p>
              Remove photos in Sell, unblock sample sellers in Profile, or
              delete all your local data from Profile. Signing out of the
              scanner does not delete local preview data. No enrollment or
              identity verification is claimed by this preview.
            </p>
          </div>
        </Modal>
      )}
      {reset && (
        <Modal
          title="Delete your local preview data?"
          onClose={() => setReset(false)}
        >
          <p>
            This removes your photos, drafts, listings, messages, profile edits,
            and saved items from this browser. Sample inventory will be
            restored.
          </p>
          <div className="tt-detail-actions">
            <button
              className="tt-button tt-button-secondary"
              onClick={() => setReset(false)}
            >
              Keep my data
            </button>
            <button
              className="tt-button"
              onClick={() => {
                setData(initialState());
                setReset(false);
                setActiveThread(null);
                navigate("/");
                setToast("Local data reset. Sample inventory restored.");
              }}
            >
              Delete local data
            </button>
          </div>
        </Modal>
      )}
      {deleteId && (
        <Modal title="Delete this listing?" onClose={() => setDeleteId(null)}>
          <p>
            The listing and its saved-item entry will be removed from this
            device.
          </p>
          <div className="tt-detail-actions">
            <button
              className="tt-button tt-button-secondary"
              onClick={() => setDeleteId(null)}
            >
              Keep listing
            </button>
            <button
              className="tt-button"
              onClick={() => {
                setData((current) => ({
                  ...current,
                  listings: current.listings.filter(
                    (item) =>
                      item.id !== deleteId || item.sellerId !== "local-owner",
                  ),
                  saved: current.saved.filter((id) => id !== deleteId),
                  draft:
                    current.draft.editingId === deleteId
                      ? { ...EMPTY_DRAFT, photos: [] }
                      : current.draft,
                }));
                setDeleteId(null);
                setToast("Listing deleted from this device.");
              }}
            >
              Delete listing
            </button>
          </div>
        </Modal>
      )}
      {toast && (
        <div className="tt-toast" role="status">
          <Icon name="check" size={19} />
          <span>{toast}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
