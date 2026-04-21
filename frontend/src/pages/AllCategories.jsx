import React from "react";
import {
  useEffect,
  useState,
  useMemo,
  useContext,
  useCallback,
  useRef,
} from "react";

import { useParams, useNavigate, useLocation } from "react-router-dom";
import "../styles/AllCategories.css";
import noImage from "../assets/react.svg";
import Navbar from "../component/Navbar";
import CategoriesSidebar from "../component/CategoriesSidebar";
import Footer from "../component/Footer";
import { ProductContext } from "../context/ProductContext";
import { CartContext } from "../context/CartContext.jsx";
import { FiMenu, FiShare2, FiArrowLeft } from "react-icons/fi";
import CartSidebar from "../component/CartSidebar.jsx";
import Checkout from "./Checkout.jsx";

/* ================= IMAGE WITH SKELETON ================= */
const ImageWithSkeleton = React.memo(({ src, alt }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="card-image-wrapper">
      {!loaded && <div className="img-skeleton" />}
      <img
        src={src}
        alt={alt}
        className="card-image"
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={(e) => (e.target.src = noImage)}
        style={{
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      />
    </div>
  );
});

/* ================= MAIN COMPONENT ================= */
const AllCategories = () => {
  const { categoryName, subcategoryName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const previousCategoryRef = useRef("");

  const category = decodeURIComponent(categoryName);
  const subcategory = subcategoryName
    ? decodeURIComponent(subcategoryName)
    : "";

  const scrollKey =
    location.state?.scrollKey ||
    `scroll-${category}-${subcategory}`;

  const {
    products,
    loadingCategory,
    preloadProduct,
    fetchCategoryProducts,
    setSearchTerm,
    setProducts,
  } = useContext(ProductContext);

  const {
    cart,
    showCart,
    closeCart,
    updateQuantity,
    removeFromCart,
  } = useContext(CartContext);

  /* ================= DISABLE BROWSER SCROLL ================= */
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  /* ================= CATEGORY LOAD (IMPROVED UX) ================= */
  useEffect(() => {
    if (!category) return;

    setIsNavigating(false);
    setSearchTerm("");

    const currentKey = `${category}__${subcategory}`;

    // If switching to new category, clear UI instantly (prevents stale flash)
    if (previousCategoryRef.current !== currentKey) {
      setProducts([]);
      previousCategoryRef.current = currentKey;
    }

    fetchCategoryProducts(category, subcategory);

  }, [
    category,
    subcategory,
    fetchCategoryProducts,
    setSearchTerm,
    setProducts,
  ]);

  /* ================= PRODUCTS ================= */
  const displayProducts = useMemo(() => {
    return Array.isArray(products) ? products : [];
  }, [products]);

  const sortedProducts = useMemo(() => {
    if (!displayProducts.length) return [];

    return [...displayProducts].sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );
  }, [displayProducts]);

  /* ================= SCROLL RESTORE ================= */
  useEffect(() => {
    if (loadingCategory) return;
    if (!products || products.length === 0) return;

    const savedProductId = sessionStorage.getItem(scrollKey);
    if (!savedProductId) return;

    let rafId;
    let tries = 0;
    const MAX_TRIES = 120;

    const tryScroll = () => {
      const el = document.getElementById(`product-${savedProductId}`);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.height > 0) {
          el.scrollIntoView({
            behavior: "auto",
            block: "center",
          });
          sessionStorage.removeItem(scrollKey);
          return;
        }
      }

      if (tries < MAX_TRIES) {
        tries++;
        rafId = requestAnimationFrame(tryScroll);
      }
    };

    rafId = requestAnimationFrame(tryScroll);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [products, loadingCategory, scrollKey]);

  /* ================= CLICK HANDLER ================= */
  const handleClick = useCallback(
    (productId) => {
      sessionStorage.setItem(scrollKey, productId);
      setIsNavigating(true);

      navigate(`/product/${productId}`, {
        state: { category, subcategory, scrollKey },
      });

      setTimeout(() => preloadProduct(productId), 0);
    },
    [navigate, preloadProduct, category, subcategory, scrollKey]
  );

  /* ================= BACK ================= */
  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  /* ================= SHARE ================= */
  const handleShare = async () => {
    const url = window.location.href;
    const label = `${subcategory || category}`;

    if (navigator.share) {
      await navigator.share({
        title: label,
        text: `Browse ${label} products`,
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied!");
    }
  };

  return (
    <>
      <Navbar />

      <div className="all-categories-page home-layout">
        <CategoriesSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="home-main">
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(true)}
          >
            <FiMenu size={20} /> Categories
          </button>

          <div className="fabric-container">
            <div className="fabric-inner">

              <div className="category-header-row">
                <button className="back-btn" onClick={handleBack}>
                  <FiArrowLeft style={{ marginRight: "6px" }} />
                  Back
                </button>

                <div className="product-total">
                  Total Products : {sortedProducts.length}
                </div>

                <div className="product-label">
                  {subcategory || category}
                </div>

                <button className="share-category-btn" onClick={handleShare}>
                  <FiShare2 size={16} />
                  <span>Share</span>
                </button>
              </div>

              {loadingCategory ? (
                <p style={{ textAlign: "center", color: "white" }}>

                </p>
              ) : sortedProducts.length > 0 ? (
                <div className="fabric-grid">
                  {sortedProducts.map((product) => (
                    <div
                      id={`product-${product._id}`}
                      key={product._id}
                      className="fabric-card"
                      onClick={() => handleClick(product._id)}
                    >
                      <ImageWithSkeleton
                        src={
                          product.thumbnailUrl ||
                          product.thumbnailUrls?.[0] ||
                          product.imageUrls?.[0]?.url ||
                          product.imageUrls?.[0] ||
                          product.image ||
                          noImage
                        }
                        alt={product.name}
                      />

                      <div className="card-content">
                        <h3 className="card-title">{product.name}</h3>

                        <p className="card-price">
                          ₹
                          {product.sizes?.[0]?.discountedPrice ??
                            product.sizes?.[0]?.originalPrice ??
                            "0"}
                        </p>
                        {product.stockUnits !== undefined && (
                          <div className="card-stock">
                            Stock: {product.stockUnits}
                          </div>
                        )}

                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ textAlign: "center", color: "white" }}>
                  No products found.
                </p>
              )}
            </div>
          </div>

          <Footer />
        </div>
      </div>

      <CartSidebar
        show={showCart}
        onClose={closeCart}
        cart={cart}
        updateQty={updateQuantity}
        removeItem={removeFromCart}
        onCheckout={() => setShowCheckout(true)}
      />

      <Checkout
        show={showCheckout}
        onClose={() => setShowCheckout(false)}
      />
    </>
  );
};

export default React.memo(AllCategories);