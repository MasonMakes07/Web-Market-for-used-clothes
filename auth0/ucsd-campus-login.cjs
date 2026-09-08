/** Auth0 Post Login Action: bind verified UCSD identity to the real campus connection.
 * Configure TRITONS_CLIENT_ID and UCSD_CONNECTION_NAME as Action secrets.
 * This proves identity, not current enrollment: the API maintains student approval.
 */
exports.onExecutePostLogin = async (event, api) => {
  const clientId = event.secrets.TRITONS_CLIENT_ID;
  // Missing scope fails closed; unrelated tenant applications are untouched when configured.
  if (!clientId) {
    api.access.deny("Campus login setup is incomplete.");
    return;
  }
  if (event.client.client_id !== clientId) return;
  const connection = event.secrets.UCSD_CONNECTION_NAME;
  const email = event.user.email;
  if (
    !connection ||
    event.connection.name !== connection ||
    event.user.email_verified !== true ||
    typeof email !== "string" ||
    !/^[^@\s]+@ucsd\.edu$/i.test(email)
  ) {
    api.access.deny(
      "Sign in through the approved UCSD connection with a verified UCSD account.",
    );
    return;
  }
  api.accessToken.setCustomClaim("https://tritonsthrift.tech/campus", {
    connection,
    email: email.toLowerCase(),
    email_verified: true,
  });
};
