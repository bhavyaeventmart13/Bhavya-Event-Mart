// ===========================================
// src/grids/CategoryGrid.jsx
// ===========================================
import React, { useEffect, useState } from "react";
import "../grids/Readymade.css";
import noImage from "../../assets/react.svg";
import { useNavigate } from "react-router-dom";

const CategoryGrid = ({ categoryName, subcategoryName }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // -------------------------------
  // Fetch products from backend
  // -------------------------------
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let url = `https://bhavya-event-mart.onrender.com/api/products?category=${encodeURIComponent(
          categoryName
        )}`;

        if (subcategoryName) {
          url += `&subcategory=${encodeURIComponent(subcategoryName)}`;
        }

        const res = await fetch(url);
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("❌ Error fetching products:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();

    // ✅ Refresh grid when new product is added
    const handleProductAdded = () => fetchProducts();
    window.addEventListener("productAdded", handleProductAdded);

    return () => {
      window.removeEventListener("productAdded", handleProductAdded);
    };
  }, [categoryName, subcategoryName]);

  // -------------------------------
  // Render
  // -------------------------------
  if (loading) return null; // 👈 Prevents flicker while loading

  return (
    <div className="fabric-container fade-in">
      <div className="fabric-header">
        <h2>{subcategoryName || categoryName}</h2>
      </div>

      <div className="fabric-grid fade-in">
        {products.length === 0 ? (
          <p style={{ color: "#f5f5f5" }}>No products found</p>
        ) : (
          products.map((product) => (
            <div
              className="fabric-card"
              key={product._id}
              onClick={() => navigate(`/product/${product._id}`)}
              style={{ cursor: "pointer" }}
            >
              <img
                src={
                  Array.isArray(product.imageUrls) &&
                  product.imageUrls.length > 0
                    ? product.imageUrls[0]
                    : noImage
                }
                alt={product.name || "Product"}
                className="card-image"
                onError={(e) => (e.target.src = noImage)}
              />
              <div className="card-content">
                <h3>{product.name || "Unnamed Product"}</h3>
                {Array.isArray(product.sizes) && product.sizes.length > 0 ? (
                  <p>₹{product.sizes[0].price}</p>
                ) : (
                  <p>₹0</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CategoryGrid;
