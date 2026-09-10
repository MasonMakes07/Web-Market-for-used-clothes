import test from "node:test";
import assert from "node:assert/strict";
import { isAuthCallback } from "../src/mobile/nativeCallback.js";

test("native OAuth callback rejects unrelated and malformed deep links", () => {
  assert.equal(
    isAuthCallback(
      "tech.tritonsthrift.app://auth/callback?code=test&state=test",
    ),
    true,
  );
  for (const url of [
    "invalid",
    "https://auth/callback",
    "tech.tritonsthrift.app://evil/callback",
    "tech.tritonsthrift.app://auth/callback/extra",
    "tech.tritonsthrift.app://user@auth/callback",
  ]) {
    assert.equal(isAuthCallback(url), false);
  }
});
