// ===========================================
// src/admin/Sidebar.jsx (UPDATED WITH TASK DASHBOARD)
// ===========================================

import React from "react";
import { Link, useLocation } from "react-router-dom";

import { GoHome } from "react-icons/go";
import {
  FiPackage,
  FiFileText,
  FiSettings,
  FiImage,
  FiClipboard,
  FiMessageSquare,
  FiCheckSquare, // ✅ NEW ICON FOR TASKS
} from "react-icons/fi";

import { IoBarChartOutline } from "react-icons/io5";

import "./Sidebar.css";

const Sidebar = () => {
  const location = useLocation();

  // ==================================================
  // MENU ITEMS
  // ==================================================
  const menuItems = [
    {
      name: "Dashboard",
      icon: <GoHome />,
      path: "/admin/dashboard",
    },
    {
      name: "Products",
      icon: <FiPackage />,
      path: "/admin/products",
    },
   
    {
      name: "Orders",
      icon: <FiFileText />,
      path: "/admin/orders",
    },
  

    
    {
      name: "Analytics",
      icon: <IoBarChartOutline />,
      path: "/admin/analytics",
    },
    {
      name: "Settings",
      icon: <FiSettings />,
      path: "/admin/settings",
    },
  ];

  // ==================================================
  // ACTIVE MENU
  // ==================================================
  const getActiveItem = (path) => {
    return (
      location.pathname === path ||
      location.pathname.startsWith(path + "/")
    );
  };

  return (
    <nav className="sidebar">
      <div className="main-menu">
        <p className="menu-title">MAIN MENU</p>

        <ul className="menu-list">
          {menuItems.map((item) => (
            <li
              key={item.path}
              className={`menu-item ${
                getActiveItem(item.path) ? "active" : ""
              }`}
            >
              <Link to={item.path}>
                <span className="icon">{item.icon}</span>
                <span className="text">{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Sidebar;