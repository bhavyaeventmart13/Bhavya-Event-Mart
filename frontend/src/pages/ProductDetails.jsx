import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import noImage from "../assets/react.svg";
import "../styles/ProductDetails.css";

import { FaHeart, FaTruck, FaShieldAlt, FaBars, FaArrowLeft } from "react-icons/fa";

import Navbar from "../component/Navbar";
import Footer from "../component/Footer";
import CategoriesSidebar from "../component/CategoriesSidebar";

import { ProductContext } from "../context/ProductContext";
import { CartContext } from "../context/CartContext.jsx";
import { UserContext } from "../context/UserContext";

import CartSidebar from "../component/CartSidebar.jsx";
import Checkout from "./Checkout.jsx";

const ProductDetails = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
const category = location.state?.category;
const subcategory = location.state?.subcategory;
const scrollKey = location.state?.scrollKey;
  // PRODUCT CONTEXT
  const { products, preloadedProduct } = useContext(ProductContext);

  // CART CONTEXT
  const {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    showCart,
    openCart,
    closeCart,
  } = useContext(CartContext);

  // USER CONTEXT
  const {
    user,
    pendingCheckout,
    setPendingCheckout,
    showAuthPopup,
    setShowAuthPopup,
  } = useContext(UserContext);

  // STATES
  const [product, setProduct] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);

  const [showCheckout, setShowCheckout] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);

  const [showSwipeHint, setShowSwipeHint] = useState(false);

  // MOBILE RESPONSIVE LOGIC
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

 
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Helper
  const getImg = (p) =>
    Array.isArray(p?.imageUrls) && p.imageUrls.length > 0
      ? p.imageUrls[0]?.url || p.imageUrls[0]
      : noImage;

  // LOAD PRODUCT
  useEffect(() => {
    const load = async () => {
      if (!product) setLoading(true);
      try {
        let found = null;

        if (
          preloadedProduct &&
          preloadedProduct._id === productId &&
          Array.isArray(preloadedProduct.imageUrls) &&
          Array.isArray(preloadedProduct.sizes) &&
          preloadedProduct.sizes.length > 0
        ) {
          found = preloadedProduct;
        }

        if (!found && products?.length > 0) {
          found = products.find((p) => p._id === productId);
        }

        if (!found) {
          const res = await fetch(`https://bhavya-event-mart.onrender.com/api/products/${productId}`);
          const all = await res.json();
          found = all;
        }

        if (found) {
          setProduct(found);
          setQuantity(1);

          // ✅ DEFAULT IMAGE LOGIC (COLOR FIRST)
          if (!selectedImage) {
            if (found.colors?.length > 0) {
              setSelectedImage(found.colors[0].image);
            } else if (found.imageUrls?.length > 0) {
              setSelectedImage(found.imageUrls[0]);
            }
          }

          if (found.sizes?.length > 0) setSelectedSize(found.sizes[0]);

          const categoryNames =
            found.categories?.map((c) =>
              typeof c === "string" ? c : c.name
            ) || [];

          const rec =
            products
              ?.filter(
                (p) =>
                  p._id !== found._id &&
                  p.categories?.some((c) =>
                    categoryNames.includes(
                      typeof c === "string" ? c : c.name
                    )
                  )
              )
              .slice(0, 6) || [];

          setRecommended(rec);
        }
      } catch (err) {
        console.error("❌ Product load error:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [productId, products, preloadedProduct]);

  useEffect(() => {
    if (location.state?.fromRecommendation) {
      setShowSwipeHint(true);

      const timer = setTimeout(() => {
        setShowSwipeHint(false);
        window.history.replaceState({}, document.title);
      }, 1800);

      return () => clearTimeout(timer);
    }
  }, [location.key]);

  // ================= ADD TO CART =================
  const handleAddToCart = () => {
    if (!selectedSize) return alert("Please select a size.");

    addToCart({
      id: product._id,
      name: product.name,
      image:
        typeof selectedImage === "string"
          ? selectedImage
          : selectedImage?.url || noImage,
      size: selectedSize.size,
      price: selectedSize.discountedPrice ?? selectedSize.originalPrice,
      quantity,
    });

    openCart();
  };

  // ================= LOADING STATES =================
  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );
  }

  if (!product)
    return <div className="product-not-found">Product not found.</div>;

  const activePrice =
    selectedSize?.discountedPrice ?? selectedSize?.originalPrice;
  const discountPercent = selectedSize?.discountPercent ?? 0;
  const gstPercent = selectedSize?.gstPercent ?? 0;

return (
  <>
    <Navbar />

    {isMobile && (
      <button
        className="sidebar-toggle"
        onClick={() => setIsSidebarOpen(true)}
        style={{ margin: "10px 15px" }}
      >
        <FaBars style={{ marginRight: "8px" }} />
        Categories
      </button>
    )}

    <div className="page-wrapper">
      {/* SIDEBAR */}
      {isMobile && (
        <CategoriesSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}

      {!isMobile && (
        <div className="categories-sidebar-container">
          <CategoriesSidebar />
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="home-main">

        {/* ✅ BREADCRUMB INSIDE MAIN */}
        <div className="product-header-top">
          <div className="breadcrumb">
            {/* BACK BUTTON */}
<span
  className="back-btn"
  onClick={() => {
    if (category) {
      if (subcategory) {
        navigate(
          `/categories/${encodeURIComponent(category)}/${encodeURIComponent(subcategory)}`,
          { state: { scrollKey } }
        );
      } else {
        navigate(
          `/categories/${encodeURIComponent(category)}`,
          { state: { scrollKey } }
        );
      }
    } else {
      navigate("/");
    }
  }}
>
  <FaArrowLeft style={{ marginRight: "6px" }} />
  Back
</span>
            {category && (
              <span
                onClick={() =>
                  navigate(`/categories/${encodeURIComponent(category)}`, {
                    state: { scrollKey }
                  })
                }
                className="breadcrumb-link"
              >
                {category}
              </span>
            )}

            {subcategory && (
              <>
                <span> / </span>
                <span
                  onClick={() =>
                    navigate(
                      `/categories/${encodeURIComponent(category)}/${encodeURIComponent(subcategory)}`,
                      {
                        state: { scrollKey }
                      }
                    )
                  }
                  className="breadcrumb-link"
                >
                  {subcategory}
                </span>
              </>
            )}

            <span> &gt; </span>

            <span className="breadcrumb-current">
              {product.name}
            </span>

          </div>
        </div>

        {/* PRODUCT SECTION */}
        <div className="product-details-container fade-in">
          <div className="product-details-grid">

            {/* LEFT IMAGES */}
            <div className="product-left-column">
              <div className="product-images">
                <div className="main-image-container">
                  <img
                    src={
                      typeof selectedImage === "string"
                        ? selectedImage
                        : selectedImage?.url || noImage
                    }
                    alt={product.name}
                    className="main-product-image product-change"
                    onClick={() => setShowImagePreview(true)}
                    style={{ cursor: "zoom-in" }}
                  />
                </div>

                {product.colors?.length > 0 && (
                  <div className="color-selector">
                    <p className="section-title">Select Color</p>
                    <div className="color-dots">
                      {product.colors.map((c, i) => (
                        <button
                          key={i}
                          className={`color-dot ${
                            selectedImage === c.image ? "active" : ""
                          }`}
                          title={c.name}
                          style={{ backgroundColor: c.hex || "#ccc" }}
                          onClick={() => setSelectedImage(c.image)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="product-right-column">
              <div className="product-info">

                <div className="product-title-header">
                  <h1 className="product-name product-change">
                    {product.name}
                  </h1>

                  {product.refNumber && (
                    <span className="product-ref">
                      PC: {product.refNumber.replace("PC-", "")}
                    </span>
                  )}
                </div>

                <div className="price-and-stock">
                  <div className="product-price-container">
                    <span className="product-price-discounted">
                      ₹{activePrice}
                    </span>

                    {discountPercent > 0 && (
                      <>
                        <span className="product-price-original">
                          ₹{selectedSize?.originalPrice}
                        </span>
                        <span className="product-price-discount-percent">
                          ({discountPercent}% OFF)
                        </span>
                      </>
                    )}
                  </div>

                  <p className="product-stock available">
                    Status: Available
                  </p>

                  {product.stockUnits !== undefined && (
                    <p className="product-stock-units">
                      Stock Units: {product.stockUnits}
                    </p>
                  )}
               

                  </div>

                  {gstPercent > 0 && (
                    <p className="gst-info">
                      Inclusive of {gstPercent}% GST applied
                    </p>
                  )}

                  <div className="description-category-wrapper">
                    <div className="description-section">
                      <p className="section-title">Description</p>
                      <p className="description-text">
                        {product.description || "No description available."}
                      </p>
                    </div>
                  </div>
                </div>
                {!product.colors?.length && product.imageUrls?.length > 1 && (
                  <div className="thumbnail-container">
                    {product.imageUrls.map((img, i) => (
                      <img
                        key={i}
                        src={img.url || img}
                        alt={product.name}
                        className={`thumbnail-image ${
                          (selectedImage?.url || selectedImage) === (img.url || img)
                            ? "active"
                            : ""
                        }`}
                        onClick={() => setSelectedImage(img)}
                      />
                    ))}
                  </div>
                )}

                <div className="size-section right-column-size-section">
                  <p className="section-title">Select Size</p>
                  <div className="size-selector scrollable-size-row">
                    {product.sizes?.map((s, i) => (
                      <div
                        key={i}
                        className={`size-box ${selectedSize?.size === s.size ? "selected" : ""
                          }`}
                        onClick={() => setSelectedSize(s)}
                      >
                        <span className="size-box-mtr">{s.size}</span>
                        {s.discountPercent > 0 ? (
                          <>
                            <span className="size-box-price-original">
                              ₹{s.originalPrice}
                            </span>
                            <div className="size-box-discount-row">
                              <span className="size-box-price-discounted">
                                ₹{s.discountedPrice}
                              </span>
                              <span className="size-box-discount-text">
                                ({s.discountPercent}% OFF)
                              </span>
                            </div>
                          </>
                        ) : (
                          <span className="size-box-price-discounted">
                            ₹{s.originalPrice}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="product-actions-group right-column-actions">
                  <div className="product-actions-main-row">
                    <button
                      className="add-to-cart-button"
                      onClick={handleAddToCart}
                    >
                      Add to Cart
                    </button>
                    <button className="wishlist-button">
                      <FaHeart />
                    </button>
                  </div>
                </div>

                <div className="product-footer-info right-column-footer-info">
                  <div className="product-highlights">
                    <div className="highlight-line">
                      <FaTruck /> Fast & Reliable Delivery
                    </div>
                    <div className="highlight-line">
                      <FaTruck /> Prices include GST
                    </div>
                    <div className="highlight-line">
                      <FaShieldAlt /> 100% Quality Guarantee
                    </div>
                    <div className="highlight-line">
                      <FaHeart /> Trusted by Thousands
                    </div>
                  </div>

                  <div className="share-section align-top">
                    <span
                      className="share-text-link"
                      onClick={() => {
                        const text = `Check out this product: ${product.name}\n${window.location.href}`;
                        window.open(
                          `https://api.whatsapp.com/send?text=${encodeURIComponent(
                            text
                          )}`,
                          "_blank"
                        );
                      }}
                    >
                      Share Product
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* RECOMMENDED */}
            {recommended.length > 0 && (
              <div className="recommended-section">
                <h2 className="recommended-title">You May Also Like</h2>
                <div className="recommended-grid">
                  {recommended.map((rec) => (
                    <div
                      key={rec._id}
                      className="recommended-card"
                      onClick={() =>
                        navigate(`/product/${rec._id}`, {
                          state: { fromRecommendation: true },
                        })
                      }
                    >
                      <div className="card-image-wrapper">
                        <img
                          src={getImg(rec)}
                          alt={rec.name}
                          className="card-image"
                          loading="lazy"
                          onError={(e) => (e.target.src = noImage)}
                        />
                      </div>
                      <div className="card-content">
                        <h3>{rec.name}</h3>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {showImagePreview && (
            <div
              className="image-preview-overlay"
              onClick={() => setShowImagePreview(false)}
            >
              <div
                className="image-preview-container"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="close-preview-btn"
                  onClick={() => setShowImagePreview(false)}
                >
                  ×
                </button>
                <img
                  src={
                    typeof selectedImage === "string"
                      ? selectedImage
                      : selectedImage?.url || noImage
                  }
                  alt="Full Preview"
                  className="image-preview-full"
                />
              </div>
            </div>
          )}
          <Footer />
        </div>
      </div>

      <CartSidebar
        show={showCart}
        onClose={closeCart}
        cart={cart}
        updateQty={updateQuantity}
        removeItem={removeFromCart}
        onCheckout={() => {
          if (!user) {
            setPendingCheckout(true);
            setShowAuthPopup(true);
            return;
          }
          setShowCheckout(true);
        }}
      />

      <Checkout
        show={showCheckout}
        onClose={() => setShowCheckout(false)}
      />
    </>
  );
};

export default ProductDetails;