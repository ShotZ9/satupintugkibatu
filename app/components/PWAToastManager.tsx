"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function PWAToastManager() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installType, setInstallType] = useState<"android" | "ios" | null>(null);

  // =========================
  // SERVICE WORKER UPDATE
  // =========================
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").then((registration) => {
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setUpdateAvailable(true);
      }

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            setWaitingWorker(newWorker);
            setUpdateAvailable(true);
          }
        });
      });
    });
  }, []);

  const updateApp = () => {
    waitingWorker?.postMessage({ type: "SKIP_WAITING" });
    window.location.reload();
  };

  // =========================
  // INSTALL PROMPT
  // =========================
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setInstallType("android");
    };

    window.addEventListener("beforeinstallprompt", handler);

    const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

    if (isIOS && !isStandalone) {
      setInstallType("ios");
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const installAndroid = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setInstallType(null);
  };

  const closeInstall = () => {
    setInstallType(null);
  };

  // PRIORITY: UPDATE > INSTALL
  const show = updateAvailable || installType !== null;
  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed top-[env(safe-area-inset-top)] mt-4 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-4 z-[9999] max-w-sm w-[90%]"
      >
        {/* ================= UPDATE ================= */}
        {updateAvailable && (
          <>
            <div className="flex-1">
              <p className="font-semibold">Versi baru tersedia 🚀</p>
              <p className="text-sm opacity-80">
                Update untuk mendapatkan fitur terbaru
              </p>
            </div>
            <button
              onClick={updateApp}
              className="bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold"
            >
              Update
            </button>
          </>
        )}

        {/* ================= INSTALL ================= */}
        {!updateAvailable && installType === "android" && (
          <>
            <div className="flex-1">
              <p className="font-semibold">Install Satu Pintu</p>
              <p className="text-sm opacity-80">
                Tambahkan ke layar utama agar akses lebih cepat
              </p>
            </div>

            <button
              onClick={installAndroid}
              className="bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold"
            >
              Install
            </button>

            <button
              onClick={closeInstall}
              className="text-white opacity-60 hover:opacity-100 text-sm"
            >
              ✕
            </button>
          </>
        )}

        {!updateAvailable && installType === "ios" && (
          <>
            <div className="flex-1">
              <p className="font-semibold">Install di iPhone</p>
              <p className="text-sm opacity-80">
                Tekan Share → Add to Home Screen 📲
              </p>
            </div>

            <button
              onClick={closeInstall}
              className="text-white opacity-60 hover:opacity-100 text-sm"
            >
              ✕
            </button>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}