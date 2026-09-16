"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * No-ops entirely on the web. Inside the Capacitor Android WebView, wires
 * the hardware back button to in-app navigation instead of the OS default
 * (which would otherwise just close the WebView / app abruptly), and hides
 * the splash screen once the page has hydrated.
 */
export function CapacitorBootstrap() {
  const router = useRouter();

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    async function setup() {
      // Dynamic import: these packages only exist in the Android build and
      // must never be pulled into the plain web bundle's initial chunk.
      let Capacitor: typeof import("@capacitor/core").Capacitor;
      try {
        ({ Capacitor } = await import("@capacitor/core"));
      } catch {
        return; // not running inside a Capacitor shell
      }
      if (!Capacitor.isNativePlatform()) return;

      const [{ App }, { SplashScreen }] = await Promise.all([
        import("@capacitor/app"),
        import("@capacitor/splash-screen"),
      ]);

      const backListener = await App.addListener("backButton", () => {
        if (window.history.length > 1) {
          router.back();
        } else {
          App.exitApp();
        }
      });

      await SplashScreen.hide();
      cleanup = () => {
        backListener.remove();
      };
    }

    void setup();
    return () => cleanup?.();
  }, [router]);

  return null;
}
