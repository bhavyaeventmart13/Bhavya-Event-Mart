// ===========================================
// src/component/Navbar.jsx (UPDATED WITH CATEGORY SEARCH)
// ===========================================
import React, { useState, useRef, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Navbar.css";
import logoImage from "../assets/finallogo.jpg";

import { UserContext } from "../context/UserContext"; 
import { CartContext } from "../context/CartContext.jsx";
import { FaShoppingCart, FaSearch, FaUpload } from "react-icons/fa";
import { ProductContext } from "../context/ProductContext";
import noImage from "../assets/react.svg";
import { FaUserCircle } from "react-icons/fa";

const Navbar = () => {
  // ================= GLOBAL AUTH =================
  const {
    user,
    login,
    register,
    logout,
    showAuthPopup,
    setShowAuthPopup,
    pendingCheckout,
    setPendingCheckout,
    triggerCheckout,
    setTriggerCheckout,
  } = useContext(UserContext);

  // ================= CART CONTEXT =================
  const { cart, openCart } = useContext(CartContext);

  // ================= LOCAL STATES =================
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeAuthView, setActiveAuthView] = useState("login");

  // FORM STATES
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [fpPhone, setFpPhone] = useState("");
  const [fpOtpSent, setFpOtpSent] = useState(false);
  const [fpOtp, setFpOtp] = useState("");
  const [fpNewPassword, setFpNewPassword] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef(null);

  // 1️⃣ UPDATED IMPORT FROM PRODUCT CONTEXT
  const {
    searchTerm,
    setSearchTerm,
    searchResults,
    categories,          // ✅ ADDED: From your latest ProductContext
    fetchCategoryProducts, 
    preloadProduct,
  } = useContext(ProductContext);
// userupload 

const [showUploadPopup, setShowUploadPopup] = useState(false);
const [uploadFile, setUploadFile] = useState(null);
const [uploadNote, setUploadNote] = useState("");
  const [showAppPopup, setShowAppPopup] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_URL || "https://pankaj-cloth-webapp.onrender.com";

  // ================== 2️⃣ LOCAL SEARCH LOGIC (FOR CATEGORIES) ==================
  const search = searchTerm.toLowerCase();
  
  /* CATEGORY MATCH */
  const matchedCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(search)
  );

  /* SUBCATEGORY MATCH */
  const matchedSubcategories = categories.flatMap(cat =>
    (cat.subcategories || [])
      .filter(sub => (sub.name || sub).toLowerCase().includes(search))
      .map(sub => ({
        categoryName: cat.name,
        subName: sub.name || sub
      }))
  );

  // ================== 3️⃣ HANDLER FUNCTIONS ==================
  const handleCategorySearchClick = (categoryName) => {
    fetchCategoryProducts(categoryName); 
    navigate(`/categories/${encodeURIComponent(categoryName)}`);
    setSearchTerm("");
    setShowSearch(false);
  };

  const handleSubcategorySearchClick = (categoryName, subName) => {
    fetchCategoryProducts(categoryName, subName);
    navigate(
      `/categories/${encodeURIComponent(categoryName)}/${encodeURIComponent(subName)}`
    );
    setSearchTerm("");
    setShowSearch(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false);
      }
    };
    if (showSearch) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSearch]);

  const logoutAndHome = () => {
    localStorage.clear();
    logout();
    setShowProfileDropdown(false);
    setShowAuthPopup(false);
    setActiveAuthView("login");
    navigate("/", { replace: true });
  };

  const handleClosePopup = () => {
    setShowAuthPopup(false);
    setActiveAuthView("login");
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    if (!user) {
      setShowAuthPopup(true);
      setActiveAuthView("login");
      return;
    }
    setShowProfileDropdown((prev) => !prev);
  };

  const handleCartClick = (e) => {
    e.preventDefault();
    openCart();
  };

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

 const doLogin = async () => {
  if (!loginIdentifier.trim() || !loginPassword.trim()) {
    return alert("Please fill all fields");
  }

  const result = await login({
    identifier: loginIdentifier.trim(),
    password: loginPassword.trim(),
  });

  if (!result.success) {
    return alert(result.message || "Login failed");
  }

  alert("Login successful");

  setShowAuthPopup(false);

  if (pendingCheckout) {
    setTriggerCheckout(true);
    setPendingCheckout(false);
  }
const loggedUser = result.data;

// 🔥 SAFE CHECK (handles delay + state sync)
if (
  loggedUser?.role === "admin" ||
  loggedUser?.isAdmin === true
) {
  navigate("/admin/products");
} else {
  navigate("/");

}
};

  const doRegister = async () => {
    if (!regName || !regPhone || !regPassword || !regConfirm) return alert("Fill all fields");
    if (regPassword !== regConfirm) return alert("Passwords do not match");
    const result = await register({
      name: regName.trim(),
      phone: regPhone.trim(),
      address: regAddress.trim(),
      password: regPassword,
    });
    if (!result.success) return alert(result.message);
    alert("Account created!");
    setActiveAuthView("login");
    setLoginIdentifier(regPhone.trim());
  };

  const sendForgotOtp = async () => {
    if (!fpPhone) return alert("Enter phone");
    const res = await fetch(`${API_BASE}/api/auth/forgot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: fpPhone.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      alert("OTP sent");
      setFpOtpSent(true);
    } else alert(data.message);
  };

  const resetForgotPassword = async () => {
    if (!fpPhone || !fpOtp || !fpNewPassword) return alert("Fill all fields");
    const res = await fetch(`${API_BASE}/api/auth/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: fpPhone.trim(),
        otp: fpOtp.trim(),
        newPassword: fpNewPassword,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      alert("Password updated!");
      setFpOtpSent(false);
      setActiveAuthView("login");
    } else alert(data.message);
  };
 const [uploading, setUploading] = useState(false);

const handleUpload = async () => {
  if (!uploadFile) {
    alert("Please select an image");
    return;
  }

  // ✅ FIX 1: Token check
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please login");
    return;
  }

  // ✅ FIX 2: Prevent multiple clicks
  if (uploading) return;
  setUploading(true);

  try {
    const formData = new FormData();
    formData.append("image", uploadFile);
    formData.append("note", uploadNote);

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/user-uploads`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`, // ✅ FIXED
        },
        body: formData,
      }
    );

    const data = await res.json();

    if (res.ok) {
      alert("✅ Uploaded successfully");

      // reset
      setShowUploadPopup(false);
      setUploadFile(null);
      setUploadNote("");
    } else {
      alert(data.message || "Upload failed");
    }
  } catch (err) {
    console.error(err);
    alert("Upload failed");
  } finally {
    setUploading(false); // ✅ FIX 3
  }
};

  return (
    <nav className="navbar-container" style={{ zIndex: 9999 }}>
      <div className="logo">
        <Link to="/" className="logo-link">
          <img src={logoImage} alt="Logo" className="logo-image" />
          <span className="logo-main">Pankaj Cloth</span>
        </Link>
      </div>

      <button className="menu-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
        &#9776;
      </button>

      <div className={`navbar-links ${isMobileMenuOpen ? "active" : ""}`}>
        <Link to="/" onClick={handleLinkClick}>Home</Link>
        <Link to="/about" onClick={handleLinkClick}>About</Link>
        <Link to="/blog" onClick={handleLinkClick}>Blog</Link>
        <Link to="/readymade" onClick={handleLinkClick}>Testimonials</Link>
        <Link to="/showroom" onClick={handleLinkClick}>Career</Link>
        <a href="/privacy-policy.html" target="_blank" rel="noopener noreferrer" onClick={handleLinkClick}>
          Privacy Policy
        </a>
        <a href="/delete-account.html" target="_blank" rel="noopener noreferrer" onClick={handleLinkClick}>
          Delete Account
        </a>
      </div>
      

      <div className="navbar-right">
        
        <button className="app-download-btn" onClick={() => setShowAppPopup(true)}>
          Get App
        </button>
                <div
  className="upload-icon-container"
  onClick={() => {
    if (!user) {
      setShowAuthPopup(true);
      return;
    }
    setShowUploadPopup(true);
  }}
>
  <FaUpload title="Upload Design" />
</div>

        <div className="search-icon-container" onClick={() => setShowSearch(true)}>
          <FaSearch />
        </div>
        


        <div className="cart-icon-container" onClick={handleCartClick}>
          <FaShoppingCart className="cart-icon" />
          {cart.length > 0 && <span className="cart-count">{cart.length}</span>}
        </div>

        <div className="profile-container" ref={dropdownRef}>
          <div className="profile-icon" onClick={handleProfileClick}>
            <FaUserCircle size={22} />
          </div>

          {showProfileDropdown && user && (
            <div className="profile-dropdown">
              <p>{user.name || user.phone}</p>
             {user.role === "admin" && (
                <button
                  onClick={() => {
                    navigate("/admin/products");
                    setShowProfileDropdown(false);
                  }}
                >
                  Dashboard
                </button>
              )}
              <button
                onClick={() => {
                  navigate("/account");
                  setShowProfileDropdown(false);
                }}
              >
                My Account
              </button>
              <button onClick={logoutAndHome}>Logout</button>
            </div>
          )}
        </div>
      </div>

      {showSearch && (
        <div className="navbar-search-wrapper" ref={searchRef}>
          <input
            type="text"
            placeholder="Search products or categories..."
            className="navbar-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />

          <button
            className="navbar-search-close"
            onClick={() => {
              setShowSearch(false);
              setSearchTerm("");
            }}
          >
            ×
          </button>

          {/* 4️⃣ UPDATED SEARCH DROPDOWN JSX */}
          {searchTerm.trim() && (
            <div className="navbar-search-dropdown">
              
              {/* CATEGORIES */}
              {matchedCategories.map((cat, i) => (
                <div
                  key={`cat-${i}`}
                  className="search-item category"
                  onClick={() => handleCategorySearchClick(cat.name)}
                >
                   {cat.name}
                </div>
              ))}

              {/* SUBCATEGORIES */}
              {matchedSubcategories.map((sub, i) => (
                <div
                  key={`sub-${i}`}
                  className="search-item subcategory"
                  onClick={() => handleSubcategorySearchClick(sub.categoryName, sub.subName)}
                >
                   {sub.subName} <small>({sub.categoryName})</small>
                </div>
              ))}

              {/* PRODUCTS */}
              {searchResults.products.map((p) => (
                <div
                  key={p._id}
                  className="search-item"
                  onClick={() => {
                    preloadProduct(p._id); 
                    navigate(`/product/${p._id}`);
                    setSearchTerm("");
                    setShowSearch(false);
                  }}
                >
                  <img
                    src={
                      p.imageUrls?.length
                        ? p.imageUrls[0]?.url || p.imageUrls[0]
                        : p.image || noImage
                    }
                    alt={p.name}
                    onError={(e) => (e.target.src = noImage)}
                  />
                  <span>{p.name}</span>
                </div>
              ))}

              {/* EMPTY STATE */}
              {searchTerm &&
               matchedCategories.length === 0 &&
               matchedSubcategories.length === 0 &&
               searchResults.products.length === 0 && (
                <div className="search-empty">No results found</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* AUTH POPUP */}
      {showAuthPopup && !user && (
        <div className="auth-popup-wrapper">
          <div className="auth-popup-overlay" onClick={handleClosePopup}></div>
          <div className="auth-popup">
            <div className="auth-popup-header">
              <h3>
                {activeAuthView === "login"
                  ? "Login"
                  : activeAuthView === "register"
                  ? "Create Account"
                  : "Forgot Password"}
              </h3>
            </div>

            {activeAuthView === "login" && (
              <>
                <input
                  type="text"
                  placeholder="Phone or Email"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
                <button onClick={doLogin} className="login-primary-btn">
                  Login 
                </button>
                <div className="login-button-group">
                  <button onClick={() => setActiveAuthView("register")}>Create Account</button>
                  <button onClick={() => setActiveAuthView("forgot")}>Forgot Password?</button>
                </div>
              </>
            )}

            {activeAuthView === "register" && (
              <>
                <input type="text" placeholder="Full Name" value={regName} onChange={(e) => setRegName(e.target.value)} />
                <input type="text" placeholder="Phone Number" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} />
                <input type="text" placeholder="Address" value={regAddress} onChange={(e) => setRegAddress(e.target.value)} />
                <input type="password" placeholder="Password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
                <input type="password" placeholder="Confirm Password" value={regConfirm} onChange={(e) => setRegConfirm(e.target.value)} />
                <button onClick={doRegister}>Register</button>
                <div className="auth-links">
                  <button onClick={() => setActiveAuthView("login")}>Back to Login</button>
                </div>
              </>
            )}

            {activeAuthView === "forgot" && (
              <>
                {!fpOtpSent ? (
                  <>
                    <input type="text" placeholder="Phone Number" value={fpPhone} onChange={(e) => setFpPhone(e.target.value)} />
                    <button onClick={sendForgotOtp}>Send OTP</button>
                    <div className="auth-links">
                      <button onClick={() => setActiveAuthView("login")}>Back to Login</button>
                    </div>
                  </>
                ) : (
                  <>
                    <input type="text" placeholder="Enter OTP" value={fpOtp} onChange={(e) => setFpOtp(e.target.value)} />
                    <input type="password" placeholder="New Password" value={fpNewPassword} onChange={(e) => setFpNewPassword(e.target.value)} />
                    <button onClick={resetForgotPassword}>Reset Password</button>
                    <div className="auth-links">
                      <button onClick={() => setActiveAuthView("login")}>Back to Login</button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

     {showAppPopup && (
  <div className="app-popup-overlay" onClick={() => setShowAppPopup(false)}>
    <div className="app-popup" onClick={(e) => e.stopPropagation()}>
      <h3>Download Our App</h3>
      <p>
        To install our app, your phone may ask you to allow
        <strong> “Install from unknown sources”</strong>.<br /><br />
        This is a standard Android step and completely safe.
      </p>

      <a
        href="https://apps.apple.com/app/pankaj-cloth/id6758455759"
        download
        className="app-popup-download"
      >
        IOS
      </a>

      <br /> {/* 👈 added line break */}

      <a
        href="/pankaj-cloth.apk"
        download
        className="app-popup-download"
      >
        ANDROID
      </a>

      <button
        className="app-popup-close"
        onClick={() => setShowAppPopup(false)}
      >
        Close
      </button>
    </div>
  </div>
)}
{showUploadPopup && (
  <div className="auth-popup-wrapper">
    <div
      className="auth-popup-overlay"
      onClick={() => setShowUploadPopup(false)}
    ></div>

    <div className="auth-popup">
      <h3>Upload Your Requirement</h3>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
  const file = e.target.files[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Only image files allowed");
    return;
  }

  if (file.size > 3 * 1024 * 1024) {
    alert("Max file size is 3MB");
    return;
  }

  setUploadFile(file);
}}
      />

      <textarea
        placeholder="Add note (optional)"
        value={uploadNote}
        onChange={(e) => setUploadNote(e.target.value)}
      />

      <button onClick={handleUpload} disabled={uploading}>
  {uploading ? "Uploading..." : "Upload"}
</button>

      <button onClick={() => setShowUploadPopup(false)}>
        Cancel
      </button>
    </div>
  </div>
)}
    </nav>
  );
};

export default Navbar;