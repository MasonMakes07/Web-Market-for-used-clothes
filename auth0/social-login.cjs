/** Auth0 Post Login Action for the user-approved Google/Apple fallback.
 * Configure TRITONS_CLIENT_ID. Replace the campus-only Action for this app.
 * This verifies a social account, not UCSD enrollment.
 */
exports.onExecutePostLogin = async (event, api) => {
  const clientId = event.secrets.TRITONS_CLIENT_ID;
  if (!clientId) {
    api.access.deny("Account setup is incomplete.");
    return;
  }
  if (event.client.client_id !== clientId) return;
  const connection = event.connection.name;
  const email = event.user.email;
  if (
    !["google-oauth2", "apple"].includes(connection) ||
    event.user.email_verified !== true ||
    typeof email !== "string" ||
    !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
  ) {
    api.access.deny("Sign in with a verified Google or Apple account.");
    return;
  }
  api.accessToken.setCustomClaim("https://tritonsthrift.tech/identity", {
    connection,
    email,
    email_verified: true,
  });
};
