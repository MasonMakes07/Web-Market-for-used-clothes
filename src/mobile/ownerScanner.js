// The pairing token grants only local preview scans and is unrelated to the OpenAI key.
// Keep it in this tab; remove it from the URL before navigation or sharing.
export function readOwnerPairing() {
  if (!import.meta.env.DEV) return "";
  const [route, query = ""] = window.location.hash.split("?");
  const params = new URLSearchParams(query);
  const incoming = params.get("pair");
  if (incoming) {
    params.delete("pair");
    const remaining = params.toString();
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}${window.location.search}${route}${remaining ? `?${remaining}` : ""}`,
    );
  }
  try {
    if (incoming && /^[a-f0-9]{48}$/.test(incoming))
      sessionStorage.setItem("tt-owner-pairing", incoming);
    return sessionStorage.getItem("tt-owner-pairing") || "";
  } catch {
    return incoming && /^[a-f0-9]{48}$/.test(incoming) ? incoming : "";
  }
}

// Verify the local server connection before showing a ready-to-scan state.
export async function checkOwnerPairing(token, signal) {
  const response = await fetch("/__owner-scanner/status", {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
  if (!response.ok)
    throw new Error(
      "Phone connection expired. Reopen your private testing link.",
    );
  const body = await response.json();
  if (!body.connected || body.mode !== "owner-preview")
    throw new Error(
      "The scanner server is not ready. Keep the Mac's scanner running.",
    );
  return true;
}
