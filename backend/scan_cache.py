"""Per-account scan deduplication with SQLite leases; no raw photos are stored.

Successful results are reused for 24 hours. Concurrent duplicate requests are
rejected before billing. Uses the same persistent database as usage quotas.
"""

import hashlib
import json
import os
import sqlite3
import time
import uuid
from contextlib import closing
from pathlib import Path

from fastapi import HTTPException


# Keep pricing and model changes separate from previously computed results.
def claim_scan(subject, payload):
    path = Path(
        os.getenv(
            "SCAN_USAGE_DB",
            str(Path(__file__).parent / "runtime" / "scan-usage.sqlite3"),
        )
    )
    path.parent.mkdir(parents=True, exist_ok=True)
    digest = hashlib.sha256(
        json.dumps(
            {
                "version": 3,
                "model": os.getenv("OPENAI_SCAN_MODEL", "gpt-5.4-mini"),
                "payload": payload.model_dump(),
            },
            sort_keys=True,
        ).encode()
    ).hexdigest()
    now, lease = time.time(), uuid.uuid4().hex
    with closing(sqlite3.connect(path, timeout=10)) as db, db:
        db.execute(
            "CREATE TABLE IF NOT EXISTS scan_cache (subject TEXT, digest TEXT, lease TEXT, expires REAL, result TEXT, PRIMARY KEY(subject, digest))"
        )
        db.execute("BEGIN IMMEDIATE")
        db.execute("DELETE FROM scan_cache WHERE expires <= ?", (now,))
        row = db.execute(
            "SELECT result FROM scan_cache WHERE subject = ? AND digest = ?",
            (subject, digest),
        ).fetchone()
        if row:
            if row[0]:
                return (str(path), subject, digest, None), json.loads(row[0])
            raise HTTPException(
                409,
                "This item is already being scanned. Wait a moment before trying again.",
            )
        db.execute(
            "INSERT INTO scan_cache VALUES (?, ?, ?, ?, NULL)",
            (subject, digest, lease, now + 120),
        )
    return (str(path), subject, digest, lease), None


# Publish only the result owned by this lease; failures leave no cached answer.
def finish_scan(claim, result=None):
    path, subject, digest, lease = claim
    with closing(sqlite3.connect(path, timeout=10)) as db, db:
        if result is None:
            db.execute(
                "DELETE FROM scan_cache WHERE subject = ? AND digest = ? AND lease = ?",
                (subject, digest, lease),
            )
        else:
            db.execute(
                "UPDATE scan_cache SET result = ?, expires = ? WHERE subject = ? AND digest = ? AND lease = ?",
                (json.dumps(result), time.time() + 86400, subject, digest, lease),
            )
