/**
 * Per-build identity.
 *
 * app.json holds everything shared. The one thing that differs is who the
 * build claims to be:
 *
 *   store builds  →  "Pine", com.pine.virtual
 *   everything else → the values in app.json
 *
 * The store bundle must NOT carry com.pine.app: that is the live Pine app's
 * package on Google Play, and uploading under it would replace the real app
 * for everyone who has installed it. A separate package means the two are
 * separate listings and can sit side by side on a phone.
 *
 * Driven by APP_VARIANT, set in the `store` profile in eas.json, so a local
 * run or a tester APK is unaffected.
 */
const STORE_NAME = 'Pine';
const STORE_PACKAGE = 'com.pine.virtual';

module.exports = ({ config }) => {
  if (process.env.APP_VARIANT !== 'store') return config;

  return {
    ...config,
    name: STORE_NAME,
    android: {
      ...config.android,
      package: STORE_PACKAGE,
    },
  };
};
