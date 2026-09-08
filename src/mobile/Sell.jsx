import { useEffect, useRef, useState } from "react";
import Icon from "./icons.jsx";
import { CATEGORIES, CONDITIONS, GENDERS } from "./data.js";
import { preparePhoto } from "./storage.js";
import { scanPhotos, useSession } from "./Session.jsx";
import { ItemImage } from "./components.jsx";

// Camera-first listing editor; real AI results always require review before application.
export default function Sell({ draft, updateDraft, onPublish, notify }) {
  const input = useRef(null);
  const camera = useRef(null);
  const controller = useRef(null);
  const uploadLock = useRef(false);
  const dragDepth = useRef(0);
  const session = useSession();
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [consent, setConsent] = useState(false);
  const [researchPrices, setResearchPrices] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => () => controller.current?.abort(), []);

  // Resizes images before persisting and prevents a batch from exceeding six photos.
  async function addPhotos(selectedFiles) {
    const files = Array.from(selectedFiles || []);
    if (!files.length || uploadLock.current || scanning) return;
    if (files.length + draft.photos.length > 6) {
      setError("You can add up to six photos.");
      return;
    }
    uploadLock.current = true;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const photos = await Promise.all(files.map(preparePhoto));
      updateDraft({ photos: [...draft.photos, ...photos] });
    } catch (err) {
      setError(err.message);
    } finally {
      uploadLock.current = false;
      setBusy(false);
    }
  }

  // Reset the picker so selecting the same photo again still triggers a change.
  function upload(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    void addPhotos(files);
  }

  // Dropped photos use the same limits and image validation as the phone picker.
  function dropPhotos(event) {
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    void addPhotos(event.dataTransfer.files);
  }

  // Requires consent and authenticated access; the server separately checks pilot approval.
  async function scan() {
    if (!session.configured) {
      setError(
        "The AI service is not connected yet. Your photos and manual listing work now; see setup instructions to connect the scanner.",
      );
      return;
    }
    if (!session.user) {
      try {
        await session.login();
      } catch {
        setError("Sign-in could not start. Please try again.");
      }
      return;
    }
    setScanning(true);
    setError("");
    setResult(null);
    controller.current = new AbortController();
    const timeout = setTimeout(() => controller.current?.abort(), 45000);
    try {
      const token = await session.token();
      const response = await scanPhotos(
        draft.photos,
        token,
        controller.current.signal,
        researchPrices,
      );
      setResult(response);
    } catch (err) {
      setError(
        err.name === "AbortError"
          ? "The scan timed out. Your photos are saved; try again or continue manually."
          : err.message,
      );
    } finally {
      clearTimeout(timeout);
      setScanning(false);
    }
  }

  // Applies only editable item attributes; prices are never invented by image recognition.
  function applyResult() {
    const item = result.draft;
    updateDraft({
      title: item.title,
      category: CATEGORIES.includes(item.category) ? item.category : "Clothing",
      brand: item.brand || "",
      size: item.size || "",
      description: item.description || "",
    });
    setResult((current) => ({ ...current, applied: true }));
    notify(
      "AI details added. Check the tag, condition, and price before posting.",
    );
  }

  // Native form validation and domain checks also apply when the price is zero.
  function publish(event) {
    event.preventDefault();
    if (!draft.photos.length) {
      setError("Add at least one photo before posting.");
      return;
    }
    const price = Number(draft.price);
    if (
      !draft.title.trim() ||
      draft.price === "" ||
      !Number.isFinite(price) ||
      price < 0 ||
      price > 100000
    ) {
      setError("Add a title and a valid price from $0 to $100,000.");
      return;
    }
    onPublish({
      ...draft,
      title: draft.title.trim(),
      price: Math.round(price * 100) / 100,
    });
  }

  const field = (name) => ({
    value: draft[name],
    onChange: (event) => updateDraft({ [name]: event.target.value }),
  });
  return (
    <section className="tt-sell">
      <div className="tt-page-heading">
        <div>
          <p className="tt-eyebrow">SELL ON TRITONS THRIFTS</p>
          <h1>
            {draft.editingId
              ? "Polish your listing."
              : "Pass on something good."}
          </h1>
          <p>A few photos. A few details. A new home on campus.</p>
        </div>
        <span className="tt-soft-label">
          <Icon name="check" size={15} /> Draft stays on this device
        </span>
      </div>
      <div className="tt-listing-progress" aria-label="Listing checklist">
        {[
          ["Photos", draft.photos.length > 0],
          ["Item details", Boolean(draft.title.trim())],
          [
            "Asking price",
            draft.price !== "" &&
              Number.isFinite(Number(draft.price)) &&
              Number(draft.price) >= 0 &&
              Number(draft.price) <= 100000,
          ],
        ].map(([label, complete], index) => (
          <span key={label} className={complete ? "is-complete" : ""}>
            <span>
              {complete ? <Icon name="check" size={15} /> : `0${index + 1}`}
            </span>
            {label}
            <span className="tt-sr-only">
              {complete ? " added" : " needed"}
            </span>
          </span>
        ))}
      </div>
      {error && (
        <p className="tt-error" role="alert">
          {error}
        </p>
      )}
      <form onSubmit={publish} className="tt-sell-layout">
        <div>
          <section
            className={`tt-panel tt-photo-uploader ${dragging ? "is-dragging" : ""}`}
            aria-label="Listing photos"
            aria-busy={busy}
            onDragEnter={(event) => {
              event.preventDefault();
              dragDepth.current += 1;
              setDragging(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect =
                busy || scanning || draft.photos.length >= 6 ? "none" : "copy";
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              dragDepth.current = Math.max(0, dragDepth.current - 1);
              if (!dragDepth.current) setDragging(false);
            }}
            onDrop={dropPhotos}
          >
            <div className="tt-section-title">
              <h2>
                <span className="tt-editor-number">01</span> The first
                impression
              </h2>
              <span>{draft.photos.length}/6</span>
            </div>
            <p className="tt-muted">
              Add a photo from your phone or take one now. Include the tag for a
              better AI match.
            </p>
            <div className="tt-photo-actions">
              <button
                type="button"
                className="tt-button"
                disabled={busy || scanning || draft.photos.length >= 6}
                onClick={() => input.current.click()}
              >
                <Icon name="plus" size={19} /> Add photo
              </button>
              <button
                type="button"
                className="tt-button tt-button-secondary"
                disabled={busy || scanning || draft.photos.length >= 6}
                onClick={() => camera.current.click()}
              >
                <Icon name="camera" size={19} /> Take photo
              </button>
            </div>
            <div className="tt-upload-grid">
              {draft.photos.map((photo, index) => (
                <div className="tt-upload-photo" key={photo.slice(-80) + index}>
                  <ItemImage src={photo} alt={`Listing photo ${index + 1}`} />
                  <button
                    type="button"
                    disabled={busy || scanning}
                    aria-label={`Remove photo ${index + 1}`}
                    onClick={() => {
                      updateDraft({
                        photos: draft.photos.filter((_, i) => i !== index),
                      });
                      setResult(null);
                    }}
                  >
                    <Icon name="close" size={16} />
                  </button>
                  {index === 0 ? (
                    <span>Cover</span>
                  ) : (
                    <button
                      type="button"
                      className="tt-make-cover"
                      disabled={busy || scanning}
                      aria-label={`Make photo ${index + 1} the cover`}
                      onClick={() => {
                        updateDraft({
                          photos: [
                            photo,
                            ...draft.photos.filter((_, i) => i !== index),
                          ],
                        });
                        setResult(null);
                      }}
                    >
                      Make cover
                    </button>
                  )}
                </div>
              ))}
              {draft.photos.length < 6 && (
                <button
                  disabled={busy || scanning}
                  className="tt-upload-add"
                  aria-label="Choose listing photos"
                  type="button"
                  onClick={() => input.current.click()}
                >
                  <span className="tt-upload-camera">
                    <Icon name="camera" size={28} />
                  </span>
                  <strong>
                    {busy
                      ? "Preparing…"
                      : dragging
                        ? "Drop photos here"
                        : draft.photos.length
                          ? "Add more"
                          : "Your next listing starts here"}
                  </strong>
                  {!draft.photos.length && (
                    <span>
                      Tap to choose photos
                      <span className="tt-desktop-drop-hint">
                        {" "}
                        or drag them here
                      </span>
                    </span>
                  )}
                </button>
              )}
            </div>
            <input
              ref={input}
              aria-label="Add listing photos from your library"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              multiple
              onChange={upload}
              hidden
            />
            <input
              ref={camera}
              aria-label="Take a listing photo"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={upload}
              hidden
            />
            <p className="tt-upload-help" role="status">
              {busy
                ? "Preparing your photos…"
                : draft.photos.length
                  ? `${draft.photos.length} of 6 photos added. Your first 3 photos will be used for an AI scan.`
                  : "Up to 6 photos · 15 MB per photo"}
            </p>
          </section>
          <section className="tt-scan-panel">
            <span className="tt-assistant-badge">OPTIONAL · AI ASSIST</span>
            <span className="tt-sparkle-tile">
              <Icon name="sparkle" size={25} />
            </span>
            <div>
              <p className="tt-eyebrow">LESS TYPING. MORE THRIFTING.</p>
              <h2>Let your photos do the work.</h2>
              <p>
                Let AI help with the title, category, and details. You make the
                final call.
              </p>
            </div>
            <label className="tt-consent">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
              />{" "}
              Send up to 3 photos to OpenAI for this scan.
            </label>
            <label className="tt-consent">
              <input
                type="checkbox"
                checked={researchPrices}
                onChange={(event) => setResearchPrices(event.target.checked)}
                disabled={scanning}
              />{" "}
              Also find comparable asking prices on the web.
            </label>
            <button
              type="button"
              className="tt-button tt-full"
              onClick={scan}
              disabled={
                !draft.photos.length ||
                !consent ||
                busy ||
                scanning ||
                session.loading
              }
            >
              <Icon name="sparkle" size={19} />
              {scanning
                ? "Looking at your item…"
                : session.configured && !session.user
                  ? "Sign in to scan"
                  : "Scan my item"}
            </button>
            <small>
              {session.configured
                ? "Available to approved pilot accounts. Your price stays your choice."
                : "AI connection pending · manual listing is ready to use."}
            </small>
          </section>
          {result && (
            <section className="tt-panel tt-ai-result">
              <p className="tt-eyebrow">REVIEW YOUR AI DRAFT</p>
              <h2>{result.draft.title}</h2>
              <p>{result.draft.description}</p>
              <div className="tt-tags">
                <span>{result.draft.category}</span>
                {result.draft.brand && <span>{result.draft.brand}</span>}
                {result.draft.size && <span>Size {result.draft.size}</span>}
              </div>
              {result.draft.uncertainties?.map((note, index) => (
                <p className="tt-muted" key={index}>
                  • {note}
                </p>
              ))}
              <button
                type="button"
                className="tt-button tt-full"
                disabled={result.applied}
                onClick={applyResult}
              >
                {result.applied ? "Details applied" : "Use these details"}
                <Icon name="check" size={18} />
              </button>
              {result.pricing ? (
                <div className="tt-price-note">
                  <div>
                    <strong>
                      Comparable asking prices: ${result.pricing.min}–$
                      {result.pricing.max}
                    </strong>
                    <p>{result.pricing.note}</p>
                    {result.pricing.sources.map((source) => (
                      <div key={source.url}>
                        <a href={source.url} target="_blank" rel="noreferrer">
                          ${source.price} · {source.title} ↗
                        </a>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="tt-text-button"
                      onClick={() =>
                        updateDraft({ price: String(result.pricing.median) })
                      }
                    >
                      Use ${result.pricing.median} as my asking price
                    </button>
                  </div>
                </div>
              ) : (
                <p className="tt-muted">
                  No price evidence returned. Compare prices below or choose
                  your own price.
                </p>
              )}
            </section>
          )}
        </div>
        <section className="tt-panel tt-details-form">
          <div className="tt-section-title">
            <h2>
              <span className="tt-editor-number">02</span> Tell the story
            </h2>
            <Icon name="hanger" />
          </div>
          <p className="tt-muted">
            A few details help your item find the right person.
          </p>
          <label>
            Listing title
            <input
              required
              maxLength={100}
              placeholder="e.g. Vintage Levi’s straight-leg jeans"
              {...field("title")}
            />
          </label>
          <div className="tt-form-row">
            <label>
              Category
              <select {...field("category")}>
                {CATEGORIES.slice(1).map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label>
              Condition
              <select {...field("condition")}>
                {CONDITIONS.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="tt-form-row">
            <label>
              Brand <span>optional</span>
              <input
                maxLength={60}
                placeholder="Brand on the label"
                {...field("brand")}
              />
            </label>
            <label>
              Size <span>optional</span>
              <input
                maxLength={30}
                placeholder="e.g. M, 28, US 8"
                {...field("size")}
              />
            </label>
          </div>
          <label>
            Fits
            <select {...field("gender")}>
              {GENDERS.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            Description
            <textarea
              rows={4}
              maxLength={2000}
              placeholder="Fit, measurements, wear, and anything else a buyer should know…"
              {...field("description")}
            />
          </label>
          <div className="tt-editor-price-heading">
            <h2>
              <span className="tt-editor-number">03</span> Set your price
            </h2>
            <p>You decide what it’s worth. Free finds are welcome, too.</p>
          </div>
          <label>
            Your price <span>enter 0 to give it away</span>
            <div className="tt-price-input">
              <span>$</span>
              <input
                required
                type="number"
                inputMode="decimal"
                min="0"
                max="100000"
                step="0.01"
                placeholder="0.00"
                {...field("price")}
              />
            </div>
          </label>
          <div className="tt-price-note">
            <Icon name="search" size={20} />
            <div>
              <strong>A little price research helps</strong>
              <p>
                Compare similar items and their condition. Asking prices aren’t
                confirmed sale prices.
              </p>
              {draft.title.trim() && (
                <a
                  href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(draft.title.trim())}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Compare asking prices on eBay ↗
                </a>
              )}
            </div>
          </div>
          <div className="tt-editor-pickup">
            <Icon name="pin" size={20} />
            <div>
              <strong>Keep it local</strong>
              <span>Arrange a campus pickup with your buyer.</span>
            </div>
          </div>
          <button
            className="tt-button tt-full tt-publish"
            type="submit"
            disabled={busy || scanning}
          >
            {draft.editingId ? "Save listing changes" : "Post to my preview"}
            <Icon name="arrow" size={19} />
          </button>
          <p className="tt-form-footnote">
            This build saves listings on your device. Publishing to other
            students comes with the shared backend connection.
          </p>
        </section>
      </form>
    </section>
  );
}
