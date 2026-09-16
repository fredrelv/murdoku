import type { CapacitorConfig } from "@capacitor/cli";

// The Android app is a thin WebView pointed at the production Vercel
// deployment — NOT a static export. Auth relies on first-party httpOnly
// cookies, which only work when the WebView loads the real HTTPS origin
// (server.url below), never a local file:// or capacitor:// origin.
// Replace PRODUCTION_URL once the app is deployed to Vercel.
const PRODUCTION_URL = process.env.MURDOKU_MOBILE_URL ?? "https://murdoku.vercel.app";

const config: CapacitorConfig = {
  appId: "app.murdoku.game",
  appName: "Murdoku",
  webDir: "mobile/www",
  server: {
    url: PRODUCTION_URL,
    androidScheme: "https",
    cleartext: false,
    allowNavigation: [new URL(PRODUCTION_URL).hostname],
  },
};

export default config;
