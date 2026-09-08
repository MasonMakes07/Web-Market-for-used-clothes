import { useEffect, useRef } from "react";
import Icon from "./icons.jsx";

// Accessible modal uses the native focus trap and restores focus on close.
export function Modal({ title, children, onClose, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = "";
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`tt-modal ${wide ? "tt-modal-wide" : ""}`}
      aria-label={title}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="tt-modal-inner">
        <div className="tt-modal-heading">
          <h2>{title}</h2>
          <button
            className="tt-icon-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

// Graceful image fallback keeps sample inventory legible without third-party image access.
export function ItemImage({ src, alt, ...props }) {
  return (
    <img
      src={src || "/item-placeholder.svg"}
      alt={alt}
      {...props}
      onError={(event) => {
        event.currentTarget.onerror = null;
        event.currentTarget.src = "/item-placeholder.svg";
      }}
    />
  );
}

// Listing actions are separate buttons so saving never opens the item.
export function ItemCard({ item, saved, onSave, onOpen }) {
  return (
    <article className="tt-item">
      <div className="tt-item-photo">
        <button
          onClick={() => onOpen(item)}
          className="tt-photo-button"
          aria-label={`View ${item.title}`}
        >
          <ItemImage src={item.photos[0]} alt={item.title} loading="lazy" />
        </button>
        <button
          className={`tt-save ${saved ? "is-saved" : ""}`}
          aria-label={`${saved ? "Unsave" : "Save"} ${item.title}`}
          aria-pressed={saved}
          onClick={() => onSave(item.id)}
        >
          <Icon name="heart" size={19} />
        </button>
        {item.condition === "Like new" && (
          <span className="tt-photo-label">Like new</span>
        )}
        {item.status !== "active" && (
          <span className="tt-status-label">{item.status}</span>
        )}
      </div>
      <button className="tt-item-text" onClick={() => onOpen(item)}>
        <div className="tt-item-price">
          {item.price === 0 ? "Free" : `$${item.price}`}
          <span>{item.size || item.category}</span>
        </div>
        <h3>{item.title}</h3>
        <p>
          <span className="tt-college-dot" />
          {item.college} College{" "}
          <span>· {item.sample ? "Sample" : "Your listing"}</span>
        </p>
      </button>
    </article>
  );
}

// Gives empty states an action rather than a dead end.
export function EmptyState({
  icon = "bag",
  title,
  children,
  action,
  onAction,
}) {
  return (
    <div className="tt-empty">
      <span>
        <Icon name={icon} size={32} />
      </span>
      <h2>{title}</h2>
      <p>{children}</p>
      {action && (
        <button className="tt-button" onClick={onAction}>
          {action}
          <Icon name="arrow" size={18} />
        </button>
      )}
    </div>
  );
}
