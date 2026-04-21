import { useEffect, useState, useCallback } from "react";

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true; // iOS

const isIosSafari = () => {
  const ua = window.navigator.userAgent.toLowerCase();
  const iOS = /iphone|ipad|ipod/.test(ua);
  const safari = /^((?!chrome|android).)*safari/i.test(window.navigator.userAgent);
  return iOS && safari;
};

export default function usePWAInstall() {
  const [deferred, setDeferred] = useState(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installed, setInstalled] = useState(isStandalone());
  const [isIos, setIsIos] = useState(isIosSafari());

  useEffect(() => {
    const onBIP = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onInstalled = () => setInstalled(true);

    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (isIos) {
      setShowIOSGuide(true);
      return { outcome: "ios-guide" };
    }
    if (deferred) {
      deferred.prompt();
      const choice = await deferred.userChoice.catch(() => ({}));
      setDeferred(null);
      return choice; // { outcome: 'accepted' | 'dismissed' }
    }
    return { outcome: "unavailable" };
  }, [deferred, isIos]);

  return {
    isIos,
    installed,
    canInstall: !!deferred || isIos,
    promptInstall,
    showIOSGuide,
    setShowIOSGuide
  };
}
