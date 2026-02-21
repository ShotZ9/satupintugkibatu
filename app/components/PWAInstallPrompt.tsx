"use client";

import { useEffect, useState } from "react";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showAndroid, setShowAndroid] = useState(false);
  const [showIOS, setShowIOS] = useState(false);

  useEffect(() => {
    // Android
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowAndroid(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // iOS detection
    const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

    if (isIOS && !isStandalone) {
      setShowIOS(true);
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
    setShowAndroid(false);
  };

  if (!showAndroid && !showIOS) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-4 rounded-2xl shadow-xl z-50 w-80 text-center">
      {showAndroid && (
        <>
          <h3 className="font-semibold mb-2">Install Satu Pintu</h3>
          <p className="text-sm opacity-80 mb-3">
            Tambahkan ke layar utama agar akses lebih cepat 🚀
          </p>
          <button
            onClick={installAndroid}
            className="w-full bg-white text-black py-2 rounded-lg font-semibold"
          >
            Install App
          </button>
        </>
      )}

      {showIOS && (
        <>
          <h3 className="font-semibold mb-2">Install di iPhone</h3>
          <p className="text-sm opacity-80">
            Tekan tombol <strong>Share</strong> lalu pilih <strong>Add to Home Screen</strong> 📲
          </p>
        </>
      )}
    </div>
  );
}