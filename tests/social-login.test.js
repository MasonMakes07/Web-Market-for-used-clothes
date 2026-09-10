import test from "node:test";
import assert from "node:assert/strict";
import action from "../auth0/social-login.cjs";

test("social Action verifies Google and Apple without issuing student claims", async () => {
  for (const provider of ["google-oauth2", "apple", "untrusted"]) {
    for (const verified of [true, false, "true"]) {
      let denied = false;
      let claim;
      await action.onExecutePostLogin(
        {
          secrets: { TRITONS_CLIENT_ID: "app" },
          client: { client_id: "app" },
          connection: { name: provider },
          user: { email: "person@example.com", email_verified: verified },
        },
        {
          access: {
            deny: () => {
              denied = true;
            },
          },
          accessToken: {
            setCustomClaim: (name, value) => {
              claim = { name, value };
            },
          },
        },
      );
      const allowed = provider !== "untrusted" && verified === true;
      assert.equal(denied, !allowed);
      if (allowed) {
        assert.equal(claim.name, "https://tritonsthrift.tech/identity");
        assert.equal(claim.value.connection, provider);
      } else assert.equal(claim, undefined);
    }
  }
});
