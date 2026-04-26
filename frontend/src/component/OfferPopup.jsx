import React, { useEffect, useState } from "react";
import "../styles/OfferPopup.css";

const OfferPopup = () => {
  const [popups, setPopups] = useState([]);
  const [visiblePopups, setVisiblePopups] = useState([]);

  const isMobile = window.innerWidth <= 768;

  useEffect(() => {
    const fetchPopups = async () => {
      try {
        const res = await fetch(
          "https://bhavya-event-mart.onrender.com/api/popups"
        );
        const data = await res.json();

        if (res.ok && Array.isArray(data) && data.length > 0) {
          const activePopups = data.filter((item) => item.isActive);
          setPopups(activePopups);

          // show after small delay
          setTimeout(() => {
            setVisiblePopups(activePopups.map((p) => p._id));
          }, 1000);
        }
      } catch (err) {
        console.error("❌ Error fetching offers:", err);
      }
    };

    fetchPopups();
  }, []);

  const handleClose = (id) => {
    setVisiblePopups((prev) => prev.filter((pid) => pid !== id));
  };

  if (popups.length === 0) return null;

  return (
    <div className="offer-overlay">
      {popups
        .filter((popup) => visiblePopups.includes(popup._id))
        .map((popup, index) => (
          <div
            key={popup._id}
            className="offer-card-floating"
            style={{
  top: window.innerWidth <= 768
    ? `${80 + index * 148}px`   // 📱 mobile spacing
    : `${80 + index * 145}px`   // 🖥️ desktop spacing
}}

          >
            <button
              className="close-offer"
              onClick={() => handleClose(popup._id)}
            >
              ×
            </button>

            {popup.imageUrl && (
              <img
                src={popup.imageUrl}
                alt={popup.title}
                className="offer-thumb-large"
                onError={(e) => (e.target.style.display = "none")}
              />
            )}

            <div className="offer-text-large">
              <h3>{popup.title}</h3>
              <p>{popup.description}</p>

              {popup.link && (
                <a
                  href={popup.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="offer-btn"
                >
                  View →
                </a>
              )}
            </div>
          </div>
        ))}
    </div>
  );
};

export default OfferPopup;
