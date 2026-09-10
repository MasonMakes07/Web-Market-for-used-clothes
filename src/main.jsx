import { Capacitor } from "@capacitor/core";
import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import Marketplace from "./mobile/Marketplace.jsx";

// The phone app is the default; keep the original site available for integration work.
const legacy = import.meta.env.VITE_APP_EXPERIENCE === "legacy";
// Entry-point lazy loading has no Fast Refresh exports of its own.
// eslint-disable-next-line react-refresh/only-export-components
const LegacyRoot = lazy(() => import("./LegacyRoot.jsx"));

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {legacy ? (
      <Suspense fallback={<p>Loading Triton Thrift…</p>}>
        <LegacyRoot />
      </Suspense>
    ) : (
      <Marketplace />
    )}
  </StrictMode>,
);

// Only production HTTPS builds register the offline fallback worker.
if (
  import.meta.env.PROD &&
  !Capacitor.isNativePlatform() &&
  "serviceWorker" in navigator &&
  window.isSecureContext
) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch((error) =>
        console.warn("Offline fallback could not start:", error.message),
      );
  });
}
