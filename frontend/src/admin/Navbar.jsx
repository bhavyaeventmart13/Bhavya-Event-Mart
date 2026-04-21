import React from 'react';
import { FaSearch, FaBell } from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="top-navbar">
      <div className="navbar-left">
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search products, orders, customers..."
            className="search-input"
          />
        </div>
      </div>
      <div className="navbar-right">
        <div className="notification-bell">
          <FaBell />
          <span className="notification-dot"></span>
        </div>
        <div className="user-profile">
          <div className="avatar">PK</div>
          <div className="user-info">
            <span className="user-name">Pankaj Kumar</span>
            <span className="user-role">Store Admin</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;