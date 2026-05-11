// ===========================================
// src/pages/Home.jsx (Updated Login → Checkout Flow)
// ===========================================

import React, { useContext, useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Carousel } from "react-responsive-carousel";

import bannerImage1 from "../assets/Mandap6.jpg";
import bannerImage2 from "../assets/Mandap4.png";
import bannerImage3 from "../assets/Mandap5.jpg";
import bannerImage4 from "../assets/Manda16.jpg";
import bannerImage5 from "../assets/Hotelware.jpg";

import "../styles/Home.css";

import Navbar from "../component/Navbar";
import CategoriesSidebar from "../component/CategoriesSidebar.jsx";
import OfferPopup from "../component/OfferPopup";
import CartSidebar from "../component/CartSidebar.jsx";
import ReadyMade from "../component/grids/Readymade";
import HomePageCategories from "../component/grids/HomePageCategories";
import Checkout from "./Checkout.jsx";
import Footer from "../component/Footer.jsx";

import { CartContext } from "../context/CartContext.jsx";
import { ProductContext } from "../context/ProductContext";
import { UserContext } from "../context/UserContext";

import {
  FaMapMarkerAlt,
  FaClock,
  FaCalendarCheck,
  FaEnvelope,
  FaBars,
} from "react-icons/fa";

// ======================================================
// CONFIG
// ======================================================
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const STATIC_FALLBACK_BANNERS = [
  bannerImage1,
  bannerImage2,
  bannerImage3,
  bannerImage4,
  bannerImage5,
];

// ======================================================
// HOME COMPONENT
// ======================================================
const Home = () => {
  // ---------------- CONTEXT ----------------
  const {
    products,
    fetchCategoryProducts,
    searchTerm,
    searchResults,
  } = useContext(ProductContext);

  const { cart, showCart, closeCart, updateQuantity, removeFromCart } =
    useContext(CartContext);

  const {
    user,
    pendingCheckout,
    setPendingCheckout,
    showAuthPopup,
    setShowAuthPopup,
    triggerCheckout,
    setTriggerCheckout,
  } = useContext(UserContext);
// SAME image resolver as ProductDetails
const getImg = (p) =>
  p.thumbnailUrl ||
  p.thumbnailUrls?.[0] ||
  (Array.isArray(p?.imageUrls) && p.imageUrls.length > 0
    ? p.imageUrls[0]?.url || p.imageUrls[0]
    : "/noimage.png");

  // ---------------- DERIVED ----------------
  const isSearching = searchTerm.trim().length > 0;

  const hasSearchResults =
    searchResults.products.length > 0 ||
    searchResults.categories.length > 0 ||
    searchResults.subcategories.length > 0;

  // ---------------- STATE ----------------
  const [showCheckout, setShowCheckout] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [banners, setBanners] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [homeCategories, setHomeCategories] = useState([]);
  const [homeVideos, setHomeVideos] = useState([]);
const [allCategories, setAllCategories] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  // ---------------- AUTH FLOW ----------------
  // useEffect(() => {
  //   if (!user) setShowAuthPopup(true);
  // }, [user, setShowAuthPopup]);

  useEffect(() => {
    if (showAuthPopup) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
  }, [showAuthPopup]);

  // ---------------- RESPONSIVE ----------------
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  useEffect(() => {
  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/categories`);
      const data = await res.json();

      const formatted = data.map((cat) => ({
        name: cat.name,
        thumbnail: cat.thumbnail || "",
      }));

      setAllCategories(formatted);
    } catch (err) {
      console.error("❌ Category fetch error:", err);
    }
  };

  fetchCategories();
}, []);

  // ---------------- PREFETCH ----------------
  useEffect(() => {
    if (!products || products.length === 0) {
      fetchCategoryProducts("Artificial Flowers");
    }
  }, [products, fetchCategoryProducts]);

  // ---------------- FETCH HOME DATA ----------------
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/home`);
        const data = await res.json();
        if (!alive) return;

        setBanners(data.banners || []);
        setBestSellers(data.bestSellers || []);
        setHomeCategories(data.homeCategories || []);
        setHomeVideos(data.homeVideos || []);
      } catch (err) {
        console.error("❌ Homepage fetch failed:", err);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // ---------------- CHECKOUT TRIGGER ----------------
  useEffect(() => {
    if (triggerCheckout) {
      setTriggerCheckout(false);
      setShowCheckout(true);
    }
  }, [triggerCheckout, setTriggerCheckout]);

  // ---------------- HANDLERS ----------------
  const handleCheckoutClick = () => {
    if (!user) {
      setPendingCheckout(true);
      setShowAuthPopup(true);
      return;
    }
    setShowCheckout(true);
  };

  const carouselImages =
    banners.length > 0
      ? banners.map((b) => b.imageUrl).filter(Boolean)
      : STATIC_FALLBACK_BANNERS;

  // ======================================================
  // RENDER
  // ======================================================
  return (
    <div>
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

      <div className="home-layout">
        <CategoriesSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <div className="home-main">
          {/* CAROUSEL */}
          <div className="carousel-wrapper">
            <Carousel
              autoPlay
              infiniteLoop
              showThumbs={false}
              showStatus={false}
              interval={2500}
              swipeable
              emulateTouch
            >
              {carouselImages.map((src, idx) => (
                <div key={idx}>
                  <img src={src} alt={`banner-${idx}`} loading="lazy" />
                </div>
              ))}
            </Carousel>
          </div>

          {/* HERO */}
          <div className="hero-text-container">
            <div className="hero-inner">
              <div className="hero-content">
                <h1 className="hero-title">
                Bhavya Event Mart 
                </h1>
                <p className="hero-tagline">
                  House Of Event Supply 
                </p>
              
              </div>
            </div>
          </div>

          {/* VIDEOS */}
          {homeVideos.length > 0 && (
            <div className="reels-section" style={{ margin: "15px 0 25px" }}>
              <div
                className="reels-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(5, 1fr)",
                  gap: "14px",
                }}
              >
                {homeVideos.slice(0, 5).map((video) => (
                  <div
                    key={video._id}
                    style={{
                      aspectRatio: "9 / 16",
                      borderRadius: "12px",
                      overflow: "hidden",
                      background: "#000",
                    }}
                  >
                    <video
                      src={video.videoUrl}
                      poster={video.thumbnailUrl}
                      controls
                      muted
                      loop
                      playsInline
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

         
            <div className="grid-section">
              <ReadyMade bestSellers={bestSellers} />
              <hr className="section-divider" />
             <HomePageCategories categories={allCategories} />
            </div>
          

          <MemoContactSection />
        </div>
      </div>

      {/* CART */}
      <CartSidebar
        show={showCart}
        onClose={closeCart}
        cart={cart}
        updateQty={updateQuantity}
        removeItem={removeFromCart}
        onCheckout={handleCheckoutClick}
      />

      {/* CHECKOUT */}
      <Checkout show={showCheckout} onClose={() => setShowCheckout(false)} />

      <OfferPopup />
    </div>
  );
};

// ======================================================
// CONTACT SECTION
// ======================================================
const ContactSection = () => {
  const address =
    "plot No: 142, Cuttack Road, Opposite of Bhagwan Tower, Laxmisagar, Bhubaneswar - 751006";

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    address
  )}`;

  return (
    <footer className="footer-section">
      <div className="footer-header">
        <h2>Visit Our Warehouse</h2>
        <p>Experience our premium collection in person.</p>
      </div>

      <div className="info-grid grid-top">
        <InfoCard
          icon={<FaMapMarkerAlt />}
          title="Address"
          content={<address>{address}</address>}
        />
        <InfoCard
          icon={<FaClock />}
          title="Hours"
          content={<p>Mon–Sat: 10:15 am - 9:00 pm</p>}
        />
        
      </div>

      <div className="info-grid grid-bottom">
        <InfoCard
          icon={<FaMapMarkerAlt />}
          title="Visit our warehouse"
          content={
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn full-width-btn"
            >
              Locate Warehouse →
            </a>
          }
        />
        <InfoCard
          icon={<FaEnvelope />}
          title="Expect a call from us"
          content={
            <form className="subscription-form">
              <input type="number" placeholder="Enter your Number" required />
              <button type="submit">Submit</button>
            </form>
          }
        />
      </div>

      <Footer />
    </footer>
  );
};

const MemoContactSection = React.memo(ContactSection);

const InfoCard = React.memo(({ icon, title, content }) => (
  <div className="info-card">
    <div className="card-title">
      {icon}
      <h3>{title}</h3>
    </div>
    <div className="card-content">{content}</div>
  </div>
));

export default Home;
