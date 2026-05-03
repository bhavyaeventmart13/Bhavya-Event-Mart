// ===========================================
// CategoriesSidebar.jsx (FINAL PRO VERSION)
// Hover + Click Lock + Outside Click Close + Navigation
// ===========================================

import React, { useState, useEffect, useCallback, useRef } from "react";
import { FiTag } from "react-icons/fi";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import "../styles/CategoriesSidebar.css";

// -----------------------------
// FALLBACK DATA
// -----------------------------
const fallbackCategories = [
  { _id: "1", name: "Showroom", subcategories: [] },
  { _id: "2", name: "Fabrics", subcategories: [] },
  {
    _id: "3",
    name: "Madeups",
    subcategories: [
      { _id: "3-1", name: "Ceiling Designer" },
      { _id: "3-2", name: "Digital Print Concept" },
      { _id: "3-3", name: "Light Ceiling" },
      { _id: "3-4", name: "Ceiling Jhumer" },
      { _id: "3-5", name: "Siding Fancy" },
      { _id: "3-6", name: "Round Table Cover & Runner" },
      { _id: "3-7", name: "Chair Cover & Ribbon" },
      { _id: "3-8", name: "Entry Drapes" },
      { _id: "3-9", name: "Imported Fabric" },
      { _id: "3-10", name: "Jhalars" },
      { _id: "3-11", name: "Table Frill" },
      { _id: "3-12", name: "Pannels" },
    ],
  },
  { _id: "4", name: "Carpets & Matting", subcategories: [] },
  { _id: "5", name: "Artificial Flowers", subcategories: [] },
  { _id: "6", name: "Furniture", subcategories: [] },
  { _id: "7", name: "Hanging & Props", subcategories: [] },
  { _id: "8", name: "Light Jhumers", subcategories: [] },
  { _id: "9", name: "Metal Props", subcategories: [] },
  { _id: "10", name: "Mirror Setups", subcategories: [] }
];

const CategoriesSidebar = ({ isOpen = false, onClose = () => {} }) => {
  const [categories, setCategories] = useState(fallbackCategories);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [expandedMobile, setExpandedMobile] = useState(null);
  const [clickedCategory, setClickedCategory] = useState(null);
  const [disableHover, setDisableHover] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const location = useLocation();
  const navigate = useNavigate();
  const resizeTimeout = useRef(null);

  /* -----------------------------------
     Resize detection
  ----------------------------------- */
  useEffect(() => {
    const handleResize = () => {
      clearTimeout(resizeTimeout.current);
      resizeTimeout.current = setTimeout(() => {
        setIsMobile(window.innerWidth <= 768);
      }, 120);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout.current);
    };
  }, []);

  /* -----------------------------------
     Close on outside click
  ----------------------------------- */
  useEffect(() => {
    const handleClickOutside = (e) => {
      const sidebar = document.querySelector(".categories-sidebar");

      if (sidebar && !sidebar.contains(e.target)) {
        setClickedCategory(null);
        setDisableHover(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /* -----------------------------------
     Load Categories
  ----------------------------------- */
  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const cached = sessionStorage.getItem("categories");

        if (cached) {
          if (isMounted) setCategories(JSON.parse(cached));
          return;
        }

        const res = await fetch(
          "https://bhavya-event-mart.onrender.com/api/categories"
        );

        if (!res.ok) throw new Error();

        const data = await res.json();

        const formatted = data.map((cat) => ({
          _id: cat._id,
          name: cat.name,
          subcategories: (cat.subcategories || []).map((sub) => ({
            _id: sub._id || sub.name,
            name: sub.name || sub,
          })),
        }));

        const finalData =
          formatted.length > 0 ? formatted : fallbackCategories;

        if (isMounted) setCategories(finalData);
        sessionStorage.setItem("categories", JSON.stringify(finalData));
      } catch {
        if (isMounted) setCategories(fallbackCategories);
      }
    };

    load();
    return () => (isMounted = false);
  }, []);

  /* -----------------------------------
     Helpers
  ----------------------------------- */
  const hasSubcategories = useCallback(
    (category) =>
      Array.isArray(category.subcategories) &&
      category.subcategories.length > 0,
    []
  );

  const openCategory = useCallback(
    (name) => {
      navigate(`/categories/${encodeURIComponent(name)}`);
      onClose();
    },
    [navigate, onClose]
  );

  const openSubcategory = useCallback(
    (cat, sub) => {
      navigate(
        `/categories/${encodeURIComponent(cat)}/${encodeURIComponent(sub)}`
      );
      onClose();
    },
    [navigate, onClose]
  );

  const handleMobileTap = useCallback(
    (e, category) => {
      if (!isMobile) return;

      e.preventDefault();
      e.stopPropagation();

      if (hasSubcategories(category)) {
        setExpandedMobile((prev) =>
          prev === category._id ? null : category._id
        );
      } else {
        openCategory(category.name);
      }
    },
    [isMobile, hasSubcategories, openCategory]
  );

  return (
    <>
      {isOpen && <div className="sidebar-overlay show" onClick={onClose} />}

      <aside
        className={`categories-sidebar ${isOpen ? "open" : ""}`}
        onMouseLeave={() => {
          if (!isMobile && !clickedCategory) {
            setDisableHover(false);
          }
        }}
      >
        {isMobile && (
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        )}

        {/* Header */}
        <div className="sidebar-header">
          <div className="logo-container">
            <FiTag className="logo-icon" />
          </div>
          <div className="header-text">
            <h2>Categories</h2>
            <p>Browse Products</p>
          </div>
        </div>

        {/* Menu */}
        <nav className="main-menu">
          <ul className="menu-list">
            {categories.map((category) => {
              const open =
                (isMobile && expandedMobile === category._id) ||
                (!isMobile &&
                  (clickedCategory === category._id ||
                    (clickedCategory === null &&
                      !disableHover &&
                      hoveredCategory === category._id)));

              return (
                <li
                  key={category._id}
                  className={`menu-item ${open ? "expanded" : ""}`}
                  onMouseEnter={() => {
                    if (!isMobile && !disableHover) {
                      setHoveredCategory(category._id);
                    }
                  }}
                  onMouseLeave={() => {
                    if (!isMobile) {
                      setHoveredCategory(null);
                    }
                  }}
                >
                  <a
                    href={`/categories/${encodeURIComponent(category.name)}`}
                    className={
                      location.pathname.includes(category.name)
                        ? "active"
                        : ""
                    }
                    onClick={(e) => {
                      e.preventDefault();

                      if (hasSubcategories(category)) {
                        if (isMobile) {
                          handleMobileTap(e, category);
                        } else {
                          // LOCK OPEN + NAVIGATE
                          setClickedCategory(category._id);
                          setDisableHover(true);
                          navigate(
                            `/categories/${encodeURIComponent(category.name)}`
                          );
                        }
                        return;
                      }

                      openCategory(category.name);
                    }}
                  >
                    <span className="icon">
                      <FiTag />
                    </span>
                    <span className="text">{category.name}</span>
                  </a>

                  {open && hasSubcategories(category) && (
                    <div className="submenu">
                      <ul>
                        {category.subcategories.map((sub) => (
                          <li key={sub._id} className="submenu-item">
                            <NavLink
                              to={`/categories/${encodeURIComponent(
                                category.name
                              )}/${encodeURIComponent(sub.name)}`}
                              onClick={() =>
                                openSubcategory(category.name, sub.name)
                              }
                            >
                              {sub.name}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default React.memo(CategoriesSidebar);