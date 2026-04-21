import React, { useEffect, useRef, useState } from "react";
import "./FakeInstallModel.css";

export default function FakeInstallModal({ open, onDone }) {
  const [progress, setProgress] = useState(0);

  const animationRef = useRef(null);
  const startTimeRef = useRef(null);

  const steps = [
    "Preparing app files…",
    "Optimizing images…",
    "Caching assets for offline use…",
    "Finalizing install…"
  ];

  const step = Math.min(steps.length - 1, Math.floor(progress / 25));

  useEffect(() => {
    if (!open) return;

    // Reset initial state
    setProgress(0);
    startTimeRef.current = null;

    const duration = 5000; // total animation time (5 sec)

    const animate = (timestamp) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const percent = Math.min(100, (elapsed / duration) * 100);

      setProgress(percent);

      if (percent < 100) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setTimeout(() => onDone?.(), 500);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [open, onDone]);

  if (!open) return null;

  return (
    <div className="pwa-modal-backdrop">
      <div className="pwa-modal-card">
        <h3>Installing bhavya event mart</h3>
        <p>{steps[step]}</p>

        <div className="pwa-progress">
          <div
            className="pwa-progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>

        <small>{Math.floor(progress)}%</small>
      </div>
    </div>
  );
}
