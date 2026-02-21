"use client";

import { useEffect, useState } from "react";

export default function PWAUpdater() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").then((registration) => {
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setShow(true);
      }

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            setWaitingWorker(newWorker);
            setShow(true);
          }
        });
      });
    });
  }, []);

  const updateApp = () => {
    waitingWorker?.postMessage({ type: "SKIP_WAITING" });
    window.location.reload();
  };

  if (!show) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-4 z-50">
      <span>Versi baru tersedia 🚀</span>
      <button
        onClick={updateApp}
        className="bg-white text-black px-3 py-1 rounded-md text-sm font-semibold"
      >
        Update
      </button>
    </div>
  );
}