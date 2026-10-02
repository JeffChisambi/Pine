/**
 * Per-build identity.
 *
 * app.json holds everything shared. The store bundle differs in one thing:
 * it is simply named "Pine" rather than "Pine Virtual".
 *
 * It keeps com.pine.app. A separate package (com.pine.virtual) was tried and
 * reverted on request: the Firebase project has only one Android app
 * registered, com.pine.app, so a different package fails the Google Services
 * step at build time and would ship without push notifications until a new
 * app is registered in Firebase.
 *
 * Note what that package means on Google Play: a bundle uploaded under
 * com.pine.app belongs to the existing Pine listing and replaces the live app
 * for everyone who has it installed.
 *
 * Driven by APP_VARIANT, set in the `store` profile in eas.json, so tester
 * APKs and local runs keep the name in app.json.
 */
const STORE_NAME = 'Pine';

module.exports = ({ config }) => {
  if (process.env.APP_VARIANT !== 'store') return config;

  return { ...config, name: STORE_NAME };
};
