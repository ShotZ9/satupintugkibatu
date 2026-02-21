"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

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
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="fixed top-[env(safe-area-inset-top)] mt-4 left-1/2 -translate-x-1/2 bg-black text-white px-9 py-3 rounded-xl shadow-lg flex items-center gap-4 z-[9999]"
    >
      <span>Versi baru tersedia 🚀</span>
      <button
        onClick={updateApp}
        className="bg-white text-black px-3 py-2 rounded-md text-sm font-semibold"
      >
        Update
      </button>
    </motion.div>
  );
}