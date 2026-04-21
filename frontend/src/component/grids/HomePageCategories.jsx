// ===========================================
// src/component/grids/HomePageCategories.jsx
// FINAL FIX — No duplicates, stable keys
// ===========================================

import React from "react";
import { Link } from "react-router-dom";
import "./HomePageCategories.css";

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
import Mandap from "../../assets/mandap.jpg";
import Mattress from "../../assets/materss.jpg";
import Tirpal from "../../assets/tirpal.jpg";
import Wrought from "../../assets/wrought.jpg";
import Essiential from "../../assets/weading.jpg";

// ==========================
// Static fallback categories
// ==========================
const staticCategories = [
  { name: "Artificial Flowers", img: Flower, link: "/categories/Artificial Flowers" },
  { name: "Catering & Hotelware", img: Hotelware, link: "/categories/Catering & Hotelware" },
  { name: "Carpets & Matting", img: Carpet, link: "/categories/Carpets & Matting" },
  { name: "Essentials", img: Essiential, link: "/categories/Essentials" },
  { name: "Fabrics", img: Fabrics, link: "/categories/Fabrics" },
  { name: "Far Moti & Jhumer", img: Jhumer, link: "/categories/Far Moti & Jhumer" },
  { name: "Fiber Props", img: Mandap, link: "/categories/Fiber Props" },
  { name: "Furniture", img: Furniture, link: "/categories/Furniture" },
  { name: "Hanging & Props", img: Hanging, link: "/categories/Hanging & Props" },
  { name: "Imported Fabric 9 Width", img: ImportedFabric, link: "/categories/Imported Fabric 9 Width" },
  { name: "Gaddi, Mattress", img: Mattress, link: "/categories/Gaddi, Mattress" },
  { name: "Madeups", img: Mandap, link: "/categories/Madeups" },
  { name: "MDF Setup", img: Jhumer, link: "/categories/MDF Setup" },
  { name: "Tirpal", img: Tirpal, link: "/categories/Tirpal" },
  { name: "Wrought Iron Setup", img: Wrought, link: "/categories/Wrought Iron Setup" },
];

// ==========================
// COMPONENT
// ==========================
const HomePageCategories = ({ categories = [] }) => {
  // Ensure always array
  const safeCategories = Array.isArray(categories) ? categories : [];

  // Decide source of truth
  const categoriesToShow =
    safeCategories.length > 0
      ? safeCategories.map((cat) => ({
          _key: cat._id || cat.name, // ⭐ stable key
          name: cat.name || "Unnamed Category",
          img: cat.imageUrl || "",
          link:
            cat.link && cat.link.trim().length > 0
              ? cat.link
              : `/categories/${encodeURIComponent(cat.name || "")}`,
        }))
      : staticCategories.map((cat) => ({
          ...cat,
          _key: cat.name, // ⭐ stable key for fallback
        }));

  return (
    <div className="home-page-categories">
      <div className="fabric-container">

        {/* Header */}
        <div className="fabric-header">
          <h2>Categories</h2>
        </div>

        {/* Grid */}
        <div className="fabric-grid">
          {categoriesToShow.map((cat) => (
            <Link
              to={cat.link}
              key={cat._key}
              className="fabric-card"
            >
              <img
                src={cat.img}
                alt={cat.name}
                className="card-image"
                loading="lazy"
              />

              <div className="card-content">
                <h3>{cat.name}</h3>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
};

export default HomePageCategories;
