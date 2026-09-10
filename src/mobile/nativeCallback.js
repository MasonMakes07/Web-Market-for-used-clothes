export const nativeCallback = "tech.tritonsthrift.app://auth/callback";

// Ignore unrelated deep links before allowing the OAuth SDK to validate state/PKCE.
export function isAuthCallback(url) {
  try {
    const parsed = new URL(url);
    return (
      `${parsed.protocol}//${parsed.host}${parsed.pathname}` ===
        nativeCallback &&
      !parsed.username &&
      !parsed.password &&
      !parsed.port
    );
  } catch {
    return false;
  }
}
