// ===========================================
// src/component/grids/Readymade.jsx
// FINAL FIX — Stable keys, no duplicates
// ===========================================

import React, { useEffect, useState, useMemo } from "react";
import "./Readymade.css";

import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Carousel } from "react-responsive-carousel";

// ==========================
// Static fallback images
// ==========================
import Flower from "../../assets/flower.jpg";
import Hotelware from "../../assets/Hotelware.jpg";
import Carpet from "../../assets/carpet.jpg";
import Fabrics from "../../assets/fabrics.avif";
import Furniture from "../../assets/fernature.jpg";
import Hanging from "../../assets/hanging.jpg";
import ImportedFabric from "../../assets/importedfabric.jpg";
import Jhumer from "../../assets/jhumer.jpg";

// ==========================
// Static fallback items
// ==========================
const staticItems = [
  { name: "Artificial Flowers", img: Flower },
  { name: "Catering & Hotelware", img: Hotelware },
  { name: "Carpets & Matting", img: Carpet },
  { name: "Hanging & Props", img: Hanging },
  { name: "Imported Fabric 9 Width", img: ImportedFabric },
  { name: "Far Moti & Jhumer", img: Jhumer },
];

// ==========================
// COMPONENT
// ==========================
const ReadyMadeFabric = ({ bestSellers = [] }) => {
  // Mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 576);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 576);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Ensure array
  const safeBest = Array.isArray(bestSellers) ? bestSellers : [];

  // ✅ FIX: memoize items to prevent duplicate render
  const itemsToShow = useMemo(() => {
    return safeBest.length > 0
      ? safeBest.map((item) => ({
          _key: item._id || item.name, // stable key
          name: item.name || "Unknown Item",
          img: item.imageUrl || "",
        }))
      : staticItems.map((item) => ({
          ...item,
          _key: item.name, // stable key for fallback
        }));
  }, [safeBest]);

  return (
    <div className="fabric-container">
      <div className="fabric-header">
        <h2>Our Best Seller</h2>
      </div>

      <div className="category-carousel-wrapper">
        <Carousel
          autoPlay
          infiniteLoop
          showThumbs={false}
          showStatus={false}
          showIndicators={false}
          showArrows={false}
          centerMode={!isMobile}
          centerSlidePercentage={isMobile ? 90 : 25}
          interval={2500}
          swipeable
          emulateTouch
        >
          {itemsToShow.map((item) => (
            <div className="carousel-card-item" key={item._key}>
              <div className="fabric-card">
                <img
                  src={item.img}
                  alt={item.name}
                  className="card-image"
                  loading="lazy"
                />

                <div className="card-content">
                  <h3>{item.name}</h3>
                </div>
              </div>
            </div>
          ))}
        </Carousel>
      </div>
    </div>
  );
};

export default ReadyMadeFabric;
