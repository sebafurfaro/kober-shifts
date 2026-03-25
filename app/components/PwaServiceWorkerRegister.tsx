"use client";

import * as React from "react";

/**
 * Registra el service worker en /sw.js (PWA). Actualizaciones sin caché agresiva.
 */
export function PwaServiceWorkerRegister() {
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    void (async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
      } catch (e) {
        console.warn("[PWA] Service worker registration failed:", e);
      }
    })();
  }, []);

  return null;
}
