import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePageCategories.css";

// ==========================
// Static fallback items (matches Readymade style)
// ==========================
const staticCategories = [
  { name: "Artificial Flowers", thumbnail: "/assets/flower.jpg" },
  { name: "Catering & Hotelware", thumbnail: "/assets/Hotelware.jpg" },
  { name: "Carpets & Matting", thumbnail: "/assets/carpet.jpg" },
  { name: "Hanging & Props", thumbnail: "/assets/hanging.jpg" },
];

const HomePageCategories = ({ categories = [] }) => {
  const navigate = useNavigate();

  // ✅ Ensure array and memoize items to prevent duplicate renders/flickering
  const categoriesToShow = useMemo(() => {
    const safeCategories = Array.isArray(categories) ? categories : [];
    
    return safeCategories.length > 0
      ? safeCategories.map((cat) => ({
          _key: cat._id || cat.name, // Stable key
          name: cat.name || "Unnamed",
          thumbnail: cat.thumbnail || "/noimage.png",
        }))
      : staticCategories.map((cat) => ({
          ...cat,
          _key: cat.name, // Stable key for fallback
        }));
  }, [categories]);

  const handleClick = (cat) => {
    if (!cat?.name) return;
    navigate(`/categories/${encodeURIComponent(cat.name)}`);
  };

  return (
    <section className="homepage-categories">
      <div className="fabric-header"> {/* Reusing the same header class for consistency */}
        <h2 className="section-title">Categories</h2>
      </div>

      <div className="categories-grid">
        {categoriesToShow.map((cat) => (
          <div
            key={cat._key}
            className="category-card fade-in" // Added fade-in to match previous component
            onClick={() => handleClick(cat)}
          >
            {/* IMAGE */}
            <div className="card-image-wrapper">
              <img
                src={cat.thumbnail}
                alt={cat.name}
                className="card-image"
                loading="lazy"
              />
            </div>

            {/* TITLE */}
            <div className="card-content">
              <div className="card-title">
                {cat.name}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HomePageCategories;