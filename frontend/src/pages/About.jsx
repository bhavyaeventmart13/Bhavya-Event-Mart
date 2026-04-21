// ===========================================
// src/pages/About.jsx (Updated with Customers Section)
// ===========================================
import React, { useContext, useState } from "react";
import "../styles/About.css";

import Pankajsir from "../assets/Pankajsir.jpg"; 

// ✅ NEW: Customer Images
import userpic from "../assets/userpic.jpg";
import userpic1 from "../assets/userpic1.jpg";

import Navbar from "../component/Navbar";
import CategoriesSidebar from "../component/CategoriesSidebar.jsx";
import Footer from "../component/Footer.jsx";

// 🛒 Cart + Checkout
import CartSidebar from "../component/CartSidebar.jsx";
import Checkout from "./Checkout.jsx";
import { CartContext } from "../context/CartContext.jsx";

// --- DATA ---
const ownerData = [
  {
    id: 2,
    image: Pankajsir,
    altText: "Current Owner Pankaj Agrawal",
    name: "Current Leadership – Mr. Pankaj Agrawal",
    description: `
      Mr. Mayank Jain, the current leader of Bhavya Event Mart, has expanded the legacy 
      by including a wider range of products such as wedding tents, catering essentials, 
      artificial flowers, furniture, props, made-ups, and imported fabrics. His leadership blends 
      heritage with innovation, introducing modern designs, sustainable practices, and customer-focused 
      services, while preserving the trust built over generations.
    `,
  },
];

const featureData = [
  {
    id: 1,
    title: "Craftsmanship",
    text: "Every fabric, furniture piece, and decorative item is carefully crafted, reflecting skill, attention to detail, and timeless artistry.",
  },
  {
    id: 2,
    title: "Quality & Excellence",
    text: "We deliver high-quality fabrics, props, artificial flowers, and event essentials, blending beauty, durability, and comfort.",
  },
  {
    id: 3,
    title: "Diverse Range",
    text: "From silks and satins to furniture, made-ups, and event décor props, we provide a wide range of products for weddings and celebrations.",
  },
];

const About = () => {
  const { cart, showCart, closeCart, updateQuantity, removeFromCart } =
    useContext(CartContext);

  const [showCheckout, setShowCheckout] = useState(false);

  return (
    <>
      {/* Navbar */}
      <Navbar />

      <div className="home-layout">
        {/* Sidebar */}
        <div className="sidebar-container">
          <CategoriesSidebar />
        </div>

        {/* Main Section */}
        <section className="about-section">

          {/* --- Company Description --- */}
          <div className="about-company">
            <h2>About Bhavya Event Mart</h2>

            <p className="intro-paragraph">
              Established in 2025, <strong>Bhavya Event Mart</strong> has grown from a
              small fabric store into a trusted name in wedding and event décor.
              While fabrics remain our core strength, we also specialize in
              artificial flowers, furniture, props, made-ups, catering
              essentials, and imported fabrics.
              Over the years, Bhavya Event Mart has become a destination for
              decorators, event planners, and families seeking premium
              decorative products. Our collections have added elegance and
              sophistication to thousands of weddings, cultural events, and
              celebrations.Our mission is to combine traditional craftsmanship with modern
              designs, providing products that are both beautiful and
              functional.
            </p>
          </div>

      {/* ✅ Premium Happy Customers Section */}
<div className="customers-section">

  <div className="customers-container">
    
    <h2>Our Happy Customers & Celebrations</h2>

    <p className="customers-description">
      Every celebration tells a story — and we are proud to be a part of so many
      unforgettable moments. From weddings and family functions to corporate
      events, our products have helped create beautiful experiences filled with
      joy, elegance, and memories that last forever.
    </p>

    <p className="customers-subtext">
      Here’s a glimpse of the moments we’ve been honored to create.
    </p>

    <div className="customers-grid">
      <div className="customer-card">
        <img src={userpic} alt="Customer Event 1" />
      </div>

      <div className="customer-card">
        <img src={userpic1} alt="Customer Event 2" />
      </div>
    </div>

  </div>
</div>

          {/* --- Features --- */}
          <div className="feature-grid">
            {featureData.map((feature) => (
              <div className="feature-item" key={feature.id}>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </div>
            ))}
          </div>

        

          {/* Footer */}
          <Footer />
        </section>
      </div>

      {/* 🧾 Cart Sidebar */}
      <CartSidebar
        show={showCart}
        onClose={closeCart}
        cart={cart}
        updateQty={updateQuantity}
        removeItem={removeFromCart}
        onCheckout={() => setShowCheckout(true)}
      />

      {/* ✅ Checkout */}
      <Checkout
        show={showCheckout}
        onClose={() => setShowCheckout(false)}
      />
    </>
  );
};

export default About;