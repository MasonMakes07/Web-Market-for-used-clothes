"""Scanner contract tests use generated JWTs and mocked API calls, never paid requests."""

import base64
import io
import json
import os
import tempfile
import unittest
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import jwt
import httpx
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi.testclient import TestClient
from PIL import Image

from backend import scanner


class ScannerTests(unittest.TestCase):
    """Exercises authentication, quotas, input validation, and real response parsing."""

    def setUp(self):
        """Creates isolated storage, a valid compressed photo, and a signed test session."""
        self.directory = tempfile.TemporaryDirectory()
        self.environment = patch.dict(
            os.environ,
            {
                "AUTH0_DOMAIN": "test.auth0.com",
                "AUTH0_AUDIENCE": "test-api",
                "UCSD_AUTH0_CONNECTION": "campus",
                "APPROVED_AUTH0_SUBJECTS": "auth0|student",
                "OPENAI_API_KEY": "test-only-not-real",
                "SCAN_USAGE_DB": self.directory.name + "/usage.sqlite3",
                "SCAN_DAILY_LIMIT": "2",
                "SCAN_MONTHLY_LIMIT": "3",
            },
        )
        self.environment.start()
        self.client = TestClient(scanner.app)
        self.key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        self.jwks = patch.object(
            scanner,
            "key_client",
            return_value=SimpleNamespace(
                get_signing_key_from_jwt=lambda _: SimpleNamespace(
                    key=self.key.public_key()
                )
            ),
        )
        self.jwks.start()
        buffer = io.BytesIO()
        Image.new("RGB", (30, 30)).save(buffer, "JPEG")
        self.payload = {
            "images": [
                "data:image/jpeg;base64," + base64.b64encode(buffer.getvalue()).decode()
            ]
        }

    def tearDown(self):
        """Never leaks test configuration into another run."""
        self.jwks.stop()
        self.environment.stop()
        self.directory.cleanup()

    def headers(
        self, subject="auth0|student", audience="test-api", expiry=60, campus=None
    ):
        """Signs a short-lived test token with controllable claims."""
        now = int(datetime.now(timezone.utc).timestamp())
        token = jwt.encode(
            {
                "sub": subject,
                "aud": audience,
                "iss": "https://test.auth0.com/",
                "iat": now - 1,
                "exp": now + expiry,
                "https://tritonsthrift.tech/campus": (
                    campus
                    if campus is not None
                    else {
                        "connection": "campus",
                        "email": "student@ucsd.edu",
                        "email_verified": True,
                    }
                ),
            },
            self.key,
            algorithm="RS256",
        )
        return {"Authorization": f"Bearer {token}"}

    def test_authentication_and_approval_precede_paid_calls(self):
        """Anonymous, expired, wrong-audience and unapproved accounts cannot trigger billing."""
        with patch.object(scanner, "request_draft", new_callable=AsyncMock) as paid:
            self.assertEqual(
                self.client.post("/scan", json=self.payload).status_code, 401
            )
            self.assertEqual(
                self.client.post(
                    "/scan", json=self.payload, headers=self.headers(expiry=-1)
                ).status_code,
                401,
            )
            self.assertEqual(
                self.client.post(
                    "/scan", json=self.payload, headers=self.headers(audience="wrong")
                ).status_code,
                401,
            )
            self.assertEqual(
                self.client.post(
                    "/scan",
                    json=self.payload,
                    headers=self.headers(subject="auth0|unapproved"),
                ).status_code,
                403,
            )
            paid.assert_not_awaited()

    def test_invalid_image_and_body_size_rejected(self):
        """Remote URLs, invalid images, and too-large bodies never reach the model."""
        with patch.object(scanner, "request_draft", new_callable=AsyncMock) as paid:
            self.assertEqual(
                self.client.post(
                    "/scan",
                    json={"images": ["https://example.com/photo.jpg"]},
                    headers=self.headers(),
                ).status_code,
                422,
            )
            self.assertEqual(
                self.client.post(
                    "/scan",
                    json={"images": ["data:image/jpeg;base64,not-image"]},
                    headers=self.headers(),
                ).status_code,
                422,
            )
            self.assertEqual(
                self.client.post(
                    "/scan",
                    content=b"x" * (scanner.MAX_BODY + 1),
                    headers=self.headers(),
                ).status_code,
                413,
            )
            paid.assert_not_awaited()

    def test_persistent_quota_limits_attempts(self):
        """A new client cannot reset a subject's saved daily allowance."""
        with patch.object(
            scanner,
            "request_draft",
            new_callable=AsyncMock,
            return_value={"draft": {"title": "Shirt"}, "pricing": None},
        ) as paid:
            for count in (1, 2):
                self.assertEqual(
                    self.client.post(
                        "/scan",
                        json={"images": self.payload["images"] * count},
                        headers=self.headers(),
                    ).status_code,
                    200,
                )
            self.assertEqual(
                TestClient(scanner.app)
                .post(
                    "/scan",
                    json={"images": self.payload["images"] * 3},
                    headers=self.headers(),
                )
                .status_code,
                429,
            )
            self.assertEqual(paid.await_count, 2)

    def test_campus_identity_checks_before_billing(self):
        """A manually listed subject still needs genuine signed campus identity claims."""
        with patch.object(scanner, "request_draft", new_callable=AsyncMock) as paid:
            for campus in [
                {},
                {
                    "connection": "google-oauth2",
                    "email": "student@ucsd.edu",
                    "email_verified": True,
                },
                {
                    "connection": "campus",
                    "email": "student@ucsd.edu.evil.example",
                    "email_verified": True,
                },
                {
                    "connection": "campus",
                    "email": "student@ucsd.edu",
                    "email_verified": False,
                },
            ]:
                self.assertEqual(
                    self.client.post(
                        "/scan", json=self.payload, headers=self.headers(campus=campus)
                    ).status_code,
                    403,
                )
            with patch.dict(os.environ, {"UCSD_AUTH0_CONNECTION": ""}):
                self.assertEqual(
                    self.client.get("/account", headers=self.headers()).status_code, 503
                )
            self.assertEqual(
                self.client.get("/account", headers=self.headers()).json(),
                {"student_approved": True},
            )
            paid.assert_not_awaited()

    def test_duplicate_scans_reuse_result_only_for_same_account(self):
        """Identical retries cost nothing; changing price research starts a fresh scan."""
        with patch.object(
            scanner,
            "request_draft",
            new_callable=AsyncMock,
            return_value={"draft": {"title": "Shirt"}, "pricing": None},
        ) as paid:
            first = self.client.post("/scan", json=self.payload, headers=self.headers())
            second = self.client.post(
                "/scan", json=self.payload, headers=self.headers()
            )
            self.assertFalse(first.json()["cached"])
            self.assertTrue(second.json()["cached"])
            self.assertEqual(paid.await_count, 1)
            self.assertEqual(
                self.client.post(
                    "/scan",
                    json=self.payload,
                    headers=self.headers(subject="auth0|other"),
                ).status_code,
                403,
            )
            self.assertEqual(
                self.client.post(
                    "/scan",
                    json={**self.payload, "research_prices": True},
                    headers=self.headers(),
                ).status_code,
                200,
            )
            self.assertEqual(paid.await_count, 2)

    def test_concurrent_duplicate_is_blocked_before_quota(self):
        """An active SQLite lease prevents parallel duplicate billing."""
        claim, _ = scanner.claim_scan(
            "auth0|student", scanner.ScanRequest(**self.payload)
        )
        with patch.object(scanner, "reserve_scan") as reserve:
            self.assertEqual(
                self.client.post(
                    "/scan", json=self.payload, headers=self.headers()
                ).status_code,
                409,
            )
            reserve.assert_not_called()
        scanner.finish_scan(claim)

    def test_unconfigured_provider_never_uses_quota(self):
        """Manual listing stays available when the owner has not configured an API key."""
        with patch.dict(os.environ, {"OPENAI_API_KEY": ""}), patch.object(
            scanner, "reserve_scan"
        ) as reserve:
            self.assertEqual(
                self.client.post(
                    "/scan", json=self.payload, headers=self.headers()
                ).status_code,
                503,
            )
            reserve.assert_not_called()

    def test_prices_require_distinct_returned_evidence(self):
        """Invented links, duplicate links, invalid amounts and remembered prices are excluded."""
        body = {
            "output": [
                {
                    "type": "web_search_call",
                    "action": {
                        "sources": [
                            {"url": "https://example.com/one"},
                            {"url": "https://example.com/two"},
                        ]
                    },
                }
            ]
        }
        values = [
            {"title": "A", "url": "https://example.com/one", "price": 10},
            {"title": "B", "url": "https://example.com/two", "price": 20},
            {"title": "Made up", "url": "https://fake.example/three", "price": 999},
        ]
        result = scanner.verified_pricing(body, values)
        self.assertEqual(result["median"], 15)
        self.assertEqual(len(result["sources"]), 2)
        self.assertIsNone(scanner.verified_pricing(body, [values[0], values[0]]))
        self.assertIsNone(scanner.verified_pricing({}, values))

    def test_complete_model_response_and_request_contract(self):
        """Uses a mocked HTTP response to test the actual schema and paid-call limits."""
        result = {
            "draft": {
                "title": "Blue shirt",
                "category": "Clothing",
                "brand": None,
                "size": None,
                "description": "Blue shirt. Please confirm the material and condition.",
                "uncertainties": ["Size tag is unreadable."],
            },
            "comparables": [],
        }
        response = httpx.Response(
            200,
            request=httpx.Request("POST", "https://api.openai.com/v1/responses"),
            json={
                "status": "completed",
                "output": [
                    {
                        "type": "message",
                        "content": [
                            {"type": "output_text", "text": json.dumps(result)}
                        ],
                    }
                ],
            },
        )
        provider = AsyncMock()
        provider.post.return_value = response
        context = AsyncMock()
        context.__aenter__.return_value = provider
        with patch.object(scanner.httpx, "AsyncClient", return_value=context):
            actual = self.client.post(
                "/scan",
                json={**self.payload, "research_prices": True},
                headers=self.headers(),
            )
        self.assertEqual(actual.status_code, 200)
        self.assertEqual(actual.json()["draft"]["title"], "Blue shirt")
        self.assertIsNone(actual.json()["pricing"])
        request = provider.post.call_args.kwargs["json"]
        self.assertFalse(request["store"])
        self.assertEqual(request["max_tool_calls"], 1)
        self.assertEqual(request["tool_choice"], "required")
        self.assertEqual(request["max_output_tokens"], 1800)
        self.assertEqual(request["input"][0]["content"][1]["type"], "input_image")

    def test_provider_refusal_becomes_manual_fallback(self):
        """No refusal or partial output is displayed as a successful scan."""
        response = httpx.Response(
            200,
            request=httpx.Request("POST", "https://api.openai.com/v1/responses"),
            json={
                "status": "completed",
                "output": [
                    {
                        "type": "message",
                        "content": [
                            {"type": "refusal", "refusal": "Cannot identify this."}
                        ],
                    }
                ],
            },
        )
        provider = AsyncMock()
        provider.post.return_value = response
        context = AsyncMock()
        context.__aenter__.return_value = provider
        with patch.object(scanner.httpx, "AsyncClient", return_value=context):
            actual = self.client.post(
                "/scan", json=self.payload, headers=self.headers()
            )
        self.assertEqual(actual.status_code, 502)
        self.assertIn("manually", actual.json()["detail"])


if __name__ == "__main__":
    unittest.main()
