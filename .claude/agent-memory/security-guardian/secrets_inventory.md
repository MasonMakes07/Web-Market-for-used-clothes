---
name: Secrets Inventory
description: Tracks all secret/credential locations and their handling status in the PersonalAssistant project
type: project
---

Secrets loaded via pydantic-settings from .env (confirmed in .gitignore):

| Secret | Config field | Status |
|---|---|---|
| auth0_domain | settings.auth0_domain | Env var, OK |
| auth0_client_id | settings.auth0_client_id | Env var, OK |
| auth0_client_secret | settings.auth0_client_secret | Env var, OK -- must only be used server-side in code exchange |
| auth0_audience | settings.auth0_audience | Env var, OK |
| secret_key | settings.secret_key | Env var, OK -- do NOT reuse for Fernet encryption |
| database_url | settings.database_url | Env var, defaults to local SQLite |
| FERNET_KEY | NOT YET ADDED | Must be added for Phase 2 refresh token encryption |
| GOOGLE_CLIENT_ID/SECRET | NOT YET ADDED | May be needed if not using Auth0 social connection broker |

**Why:** Tracking this prevents accidental exposure as new features add credentials.

**How to apply:** Check this list when adding new secrets or reviewing PRs that touch config.py or .env.
