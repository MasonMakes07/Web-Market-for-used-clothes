"""Owner pairing tests verify private local access without weakening campus routes."""

import asyncio
import os
import subprocess
import time
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.testclient import TestClient

from backend import owner_preview, scanner


class OwnerPreviewTests(unittest.TestCase):
    """Exercise local-only pairing, expiry, ordinary auth, and billing isolation."""

    def setUp(self):
        self.token = "a" * 48
        self.environment = patch.dict(
            os.environ,
            {
                "OWNER_PREVIEW_ENABLED": "true",
                "OWNER_PREVIEW_TOKEN": self.token,
                "OWNER_PREVIEW_EXPIRES": str(time.time() + 3600),
                "OPENAI_API_KEY": "test-only",
            },
        )
        self.environment.start()

    def tearDown(self):
        self.environment.stop()

    def authorize(self, host="127.0.0.1", token=None):
        """Call the dependency with a synthetic socket peer and provided token."""
        request = SimpleNamespace(client=SimpleNamespace(host=host))
        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer", credentials=token or self.token
        )
        return asyncio.run(owner_preview.owner_subject(request, credentials))

    def test_pairing_requires_local_peer_valid_token_and_unexpired_dev_mode(self):
        self.assertEqual(self.authorize(), "local-owner-phone-preview")
        for host, token in [("192.168.1.20", self.token), ("127.0.0.1", "wrong")]:
            with self.assertRaises(HTTPException):
                self.authorize(host, token)
        for override in [
            {"OWNER_PREVIEW_ENABLED": "false"},
            {"OWNER_PREVIEW_EXPIRES": "0"},
            {"OWNER_PREVIEW_TOKEN": "short"},
        ]:
            with patch.dict(os.environ, override), self.assertRaises(HTTPException):
                self.authorize()

    def test_production_import_does_not_mount_owner_routes(self):
        """A fresh production scanner import must not expose the dev-only routes."""
        output = subprocess.check_output(
            [
                os.sys.executable,
                "-c",
                "from backend.scanner import app; print(any(r.path.startswith('/owner') for r in app.routes))",
            ],
            text=True,
        )
        self.assertEqual(output.strip(), "False")

    def test_owner_token_does_not_unlock_campus_route(self):
        with patch.object(scanner, "request_draft", new_callable=AsyncMock) as paid:
            response = TestClient(scanner.app).post(
                "/scan",
                json={"images": []},
                headers={"Authorization": f"Bearer {self.token}"},
            )
            self.assertIn(response.status_code, (401, 503))
            paid.assert_not_awaited()

    def test_owner_endpoint_reuses_validation_and_quota_pipeline(self):
        """Authenticated local traffic uses the shared scanner handler."""

        async def loopback_app(scope, receive, send):
            scope["client"] = ("127.0.0.1", 12345)
            await scanner.app(scope, receive, send)

        client = TestClient(loopback_app)
        with patch.object(
            owner_preview,
            "scan",
            new_callable=AsyncMock,
            return_value={"draft": {"title": "Shirt"}},
        ) as scan:
            self.assertEqual(
                client.post(
                    "/owner/scan",
                    json={},
                    headers={"Authorization": f"Bearer {self.token}"},
                ).status_code,
                200,
            )
            self.assertEqual(scan.call_args.args[1], "local-owner-phone-preview")
            self.assertEqual(client.post("/owner/scan", json={}).status_code, 401)
            self.assertEqual(scan.await_count, 1)
