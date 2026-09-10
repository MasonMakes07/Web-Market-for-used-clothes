"""Private phone testing for the local development server only.

The separately generated pairing token never exposes the OpenAI credential.
Routes are mounted only by the local dev launcher, not the production scanner.
Requests must come through the loopback Vite proxy and retain normal scan quotas.
"""

import ipaddress
import os
import secrets
import time

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from backend.scanner import app, scan

bearer = HTTPBearer(auto_error=False)


# Pairing permits only the local owner's test scans, never a student login.
async def owner_subject(
    request: Request, credentials: HTTPAuthorizationCredentials = Depends(bearer)
):
    expected = os.getenv("OWNER_PREVIEW_TOKEN", "")
    try:
        local_proxy = (
            request.client is not None
            and ipaddress.ip_address(request.client.host).is_loopback
        )
    except ValueError:
        local_proxy = False
    try:
        unexpired = float(os.getenv("OWNER_PREVIEW_EXPIRES", "0")) > time.time()
    except ValueError:
        unexpired = False
    if (
        not unexpired
        or os.getenv("OWNER_PREVIEW_ENABLED") != "true"
        or len(expected) < 32
        or not local_proxy
    ):
        raise HTTPException(404, "Not found")
    if (
        credentials is None
        or credentials.scheme.lower() != "bearer"
        or not secrets.compare_digest(
            credentials.credentials.encode(), expected.encode()
        )
    ):
        raise HTTPException(
            401,
            "Open the private phone testing link provided on your Mac to connect this phone.",
        )
    return "local-owner-phone-preview"


@app.get("/owner/status")
async def owner_status(subject: str = Depends(owner_subject)):
    """Checks pairing without billing or claiming university verification."""
    return {"connected": bool(os.getenv("OPENAI_API_KEY")), "mode": "owner-preview"}


@app.post("/owner/scan")
async def owner_scan(request: Request, subject: str = Depends(owner_subject)):
    """Shares validation, caching, and paid-attempt quotas with authenticated scanning."""
    return await scan(request, subject)
