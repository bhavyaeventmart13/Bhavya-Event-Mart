// src/component/pwa/InstallButton.jsx
import React from "react";
import usePWAInstall from "../../hooks/usePWAInstall";
import FakeInstallModal from "./FakeInstallModal";
import IOSInstallBanner from "./IOSInstallBanner";
import "../../styles/PWA.css";

const InstallButton = () => {
  const {
    isIos,
    installed,
    canInstall,
    promptInstall,
    showIOSGuide,
    setShowIOSGuide,
  } = usePWAInstall();

  const [showFakeInstall, setShowFakeInstall] = React.useState(false);

  if (installed) return null; // Already installed, hide button

  const handleInstall = async () => {
    const { outcome } = await promptInstall();

    if (outcome === "accepted") {
      // Chrome/Android accepted prompt
      setShowFakeInstall(true);
    } else if (outcome === "ios-guide") {
      // iOS Safari – show banner manually
      setShowIOSGuide(true);
    } else {
      console.log("Install cancelled or unavailable");
    }
  };

  return (
    <>
      {canInstall && (
        <button className="install-btn" onClick={handleInstall}>
          📲 Install App
        </button>
      )}

      {/* Fake progress modal for fun (Android/Chrome) */}
      <FakeInstallModal open={showFakeInstall} onDone={() => setShowFakeInstall(false)} />

      {/* iOS Safari banner */}
      <IOSInstallBanner open={showIOSGuide} onClose={() => setShowIOSGuide(false)} />
    </>
  );
};

export default InstallButton;
