---
name: Imported Expo dependencies
description: Environment constraints encountered when installing the imported Expo mobile project.
---

The imported Expo project can arrive without `node_modules`. Its existing pnpm lockfile may reject a frozen install when the package override configuration differs, while a non-frozen install may be blocked by the Replit package firewall on a transitive archive.

**Why:** This prevents treating an environment-level dependency failure as a product-code regression or rewriting the project's dependency setup during a focused bug fix.

**How to apply:** Keep the existing Expo/React Native structure and dependency manifests unchanged unless setup is explicitly requested; report verification limits when the workflow cannot reach the app because dependencies are unavailable.