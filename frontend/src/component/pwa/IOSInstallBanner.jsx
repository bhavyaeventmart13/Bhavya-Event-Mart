import React from "react";
import "../../styles/PWA.css";

export default function IOSInstallBanner({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="pwa-ios-banner">
      <div className="pwa-ios-card">
        <button className="pwa-close" onClick={onClose}>×</button>
        <h3>Add to Home Screen</h3>
        <ol>
          <li>Tap the <strong>Share</strong> icon in Safari (bottom bar).</li>
          <li>Scroll and tap <strong>Add to Home Screen</strong>.</li>
          <li>Tap <strong>Add</strong> to finish.</li>
        </ol>
      </div>
    </div>
  );
}
