import test from "node:test";
import assert from "node:assert/strict";
import action from "../auth0/ucsd-campus-login.cjs";

// Exercise the deployment Action with hostile identities rather than trusting an email hint.
test("campus Action rejects wrong providers, lookalike domains, and unverified email", async () => {
  const event = {
    secrets: { TRITONS_CLIENT_ID: "app", UCSD_CONNECTION_NAME: "campus" },
    client: { client_id: "app" },
    connection: { name: "campus" },
    user: { email: "student@ucsd.edu", email_verified: true },
  };
  for (const change of [
    { connection: { name: "google-oauth2" } },
    { user: { email: "student@ucsd.edu.evil.example", email_verified: true } },
    { user: { email: "student@ucsd.edu", email_verified: false } },
    { user: { email: "student@ucsd.edu", email_verified: "true" } },
    { secrets: {} },
  ]) {
    let denied = false;
    await action.onExecutePostLogin(
      { ...event, ...change },
      {
        access: {
          deny: () => {
            denied = true;
          },
        },
        accessToken: {
          setCustomClaim: () => assert.fail("must not issue a campus claim"),
        },
      },
    );
    assert.equal(denied, true);
  }
  let claim;
  await action.onExecutePostLogin(event, {
    access: {
      deny: () =>
        assert.fail("verified campus identity should pass identity check"),
    },
    accessToken: {
      setCustomClaim: (name, value) => {
        claim = { name, value };
      },
    },
  });
  assert.equal(claim.name, "https://tritonsthrift.tech/campus");
  assert.equal(claim.value.connection, "campus");
  assert.equal(claim.value.email_verified, true);
});
