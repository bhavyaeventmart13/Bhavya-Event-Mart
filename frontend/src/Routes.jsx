// ===========================================
// src/AppRoutes.jsx (CLEAN FINAL VERSION - FIXED)
// ===========================================

import React from "react";
import { Routes, Route } from "react-router-dom";

/* ===============================
   ✅ General User Pages
=============================== */
import Home from "./pages/Home.jsx";
import Products from "./pages/Products.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import About from "./pages/About.jsx";
import Blog from "./pages/Blog.jsx";
import ProductDetailsRoute from "./pages/ProductDetailsRoute";

import ReadyMade from "./pages/ReadyMade.jsx";
import Showroom from "./pages/Showroom.jsx";
import AllCategories from "./pages/AllCategories.jsx";
import VerifyUploads from "./pages/VerifyUploads.jsx";

/* ===============================
   ✅ User Account / Authentication Pages
=============================== */
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Account from "./pages/Account.jsx";
import MyOrders from "./pages/MyOrders.jsx";
import OrderTracking from "./pages/OrderTracking.jsx";

/* ===============================
   ✅ Admin Panel Pages
=============================== */
import AdminDashboard from "./admin/Dashboard.jsx";
import Product from "./admin/Product.jsx";
import AddProduct from "./admin/Addproduct.jsx";
import AddPopup from "./admin/AddPopup.jsx";
import Inventory from "./admin/Inventory.jsx";
import Orders from "./admin/Orders.jsx";
import Analytics from "./admin/Analytics.jsx";
import Settings from "./admin/Settings.jsx";
import Communication from "./admin/Communication.jsx";

/* ✅ Protect Admin Routes */
import AdminGate from "./admin/AdminGate.jsx";

import QuickOrderForm from "./pages/QuickOrderForm.jsx";
import QuickOrders from "./admin/QuickOrders.jsx";

/* ===============================
   ✅ Reusable / Test Components
=============================== */
import HomePageCategories from "./component/grids/HomePageCategories.jsx";
import ProductGrid from "./component/grids/ProductGrid.jsx";
import CustomerRequests from "./admin/CustomerRequests.jsx";

/* ✅ FIXED IMPORTS */
import TaskDashboard from "./admin/TaskDashboard.jsx";
import MyTasks from "./pages/MyTasks.jsx";

/* ===============================
   ✅ Main Application Routes
=============================== */
const AppRoutes = () => {
  return (
    <Routes>
      {/* ===========================================================
          🏠 PUBLIC PAGES
      =========================================================== */}
      <Route path="/" element={<Home />} />
      <Route path="/products" element={<Products />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/about" element={<About />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/readymade" element={<ReadyMade />} />
      <Route path="/showroom" element={<Showroom />} />

      {/* ===========================================================
          🔐 AUTH / ACCOUNT ROUTES
      =========================================================== */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/account" element={<Account />} />
      <Route path="/orders" element={<MyOrders />} />
      <Route path="/order/:id" element={<OrderTracking />} />

      {/* ✅ TASK + QUICK ORDER */}
      <Route path="/quick-order" element={<QuickOrderForm />} />
      <Route path="/admin/quick-orders" element={<QuickOrders />} />
      <Route path="/admin/tasks" element={<TaskDashboard />} />
      <Route path="/my-tasks" element={<MyTasks />} />

      {/* ===========================================================
          🛠️ ADMIN PANEL (Protected)
      =========================================================== */}
      <Route
        path="/admin"
        element={
          <AdminGate>
            <AdminDashboard />
          </AdminGate>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <AdminGate>
            <AdminDashboard />
          </AdminGate>
        }
      />

      <Route
        path="/admin/products"
        element={
          <AdminGate>
            <Product />
          </AdminGate>
        }
      />

      <Route
        path="/admin/products/add"
        element={
          <AdminGate>
            <AddProduct />
          </AdminGate>
        }
      />

      <Route
        path="/admin/popup/add"
        element={
          <AdminGate>
            <AddPopup />
          </AdminGate>
        }
      />

      <Route
        path="/admin/inventory"
        element={
          <AdminGate>
            <Inventory />
          </AdminGate>
        }
      />

      <Route
        path="/admin/orders"
        element={
          <AdminGate>
            <Orders />
          </AdminGate>
        }
      />

      <Route
        path="/admin/analytics"
        element={
          <AdminGate>
            <Analytics />
          </AdminGate>
        }
      />

      <Route
        path="/admin/settings"
        element={
          <AdminGate>
            <Settings />
          </AdminGate>
        }
      />

      <Route
        path="/admin/customer-requests"
        element={
          <AdminGate>
            <CustomerRequests />
          </AdminGate>
        }
      />

      <Route
        path="/verify-uploads"
        element={
          <AdminGate>
            <VerifyUploads />
          </AdminGate>
        }
      />

      <Route
        path="/admin/communication"
        element={
          <AdminGate>
            <Communication />
          </AdminGate>
        }
      />

      {/* ===========================================================
          🧵 CATEGORY & PRODUCT ROUTES
      =========================================================== */}
      <Route path="/categories/:categoryName" element={<AllCategories />} />
      <Route
        path="/categories/:categoryName/:subcategoryName"
        element={<AllCategories />}
      />

      <Route
        path="/product/:productId"
        element={<ProductDetailsRoute />}
      />

      {/* ===========================================================
          🧩 TEST ROUTES
      =========================================================== */}
      <Route path="/productgrid" element={<ProductGrid />} />
      <Route
        path="/homepagecategories"
        element={<HomePageCategories />}
      />

      {/* ===========================================================
          ⚠️ 404 FALLBACK
      =========================================================== */}
      <Route
        path="*"
        element={
          <h2
            style={{
              color: "white",
              textAlign: "center",
              padding: "4rem 0",
              fontWeight: "400",
            }}
          >
            404 - Page Not Found
          </h2>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
