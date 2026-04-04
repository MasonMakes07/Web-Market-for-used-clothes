---
name: Auth Architecture Review
description: Phase 2 security review findings for Auth0 JWT + Google Calendar integration -- critical requirements and vulnerability patterns
type: project
---

Phase 2 implements Auth0 (RS256 JWT via JWKS) + Google Calendar API with Fernet-encrypted refresh tokens in SQLite.

**Why:** First auth implementation for the app; getting the foundation right prevents cascading vulnerabilities.

**How to apply:**
- Fernet key MUST be a separate env var (FERNET_KEY), not derived from secret_key
- OAuth callback MUST validate state parameter (CSRF protection)
- JWT validation must explicitly set algorithms=["RS256"], validate iss/aud/exp
- Auth cookies must be httpOnly, Secure, SameSite=Lax -- never return tokens in JSON bodies
- Google refresh tokens encrypted before DB write, decrypted only on use
- Rate limiting required on /auth/* endpoints (5/min/IP) and standard rate on all authenticated endpoints
- Security headers middleware needed (HSTS, X-Content-Type-Options, X-Frame-Options, CSP, Referrer-Policy)
- Google API errors must be sanitized before returning to client
