import React from 'react';
import "../styles/Footer.css";
import { FaFacebookF, FaInstagram, FaMapMarkerAlt, FaPhoneAlt, FaRegClock } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="footer-section">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Column 1: About */}
          <div className="footer-column about-column">
            <h3 className="footer-title">Bhavya Event Mart</h3>
            <p>
              Supplying excellence with our premium collection for every celebration.
            </p>
            <div className="footer-socials">
              <a href="https://facebook.com/YourPageID" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <FaFacebookF />
              </a>
              <a href="https://www.instagram.com/bhavyaeventmart?igsh=MXQ3c3VhaWMxa3kweA==">
                <FaInstagram />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="footer-column">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-links">
              <li><a href="/fabrics">Explore Fabrics</a></li>
              <li><a href="/ready-mades">Discover Ready-Mades</a></li>
              <li><a href="/best-sellers">Our Best Sellers</a></li>
              <li><a href="/appointment">Book an Appointment</a></li>
              <li><a href="/locate">Locate Warehouse</a></li>
              
            </ul>
          </div>
          

          {/* Column 3: Categories */}
          <div className="footer-column">
            <h4 className="footer-heading">Product Categories</h4>
            <ul className="footer-links">
              <li><a href="/categories/fabrics">Fabrics</a></li>
              <li><a href="/categories/furniture">Furniture</a></li>
              <li><a href="/categories/flowers">Artificial Flowers</a></li>
              <li><a href="/categories/catering">Catering & Hotelware</a></li>
              <li><a href="/categories/carpets">Carpets & Matting</a></li>
              <li><a href="/categories">View All Categories →</a></li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div className="footer-column">
            <h4 className="footer-heading">Visit Us</h4>
            <div className="contact-info">
              <p><FaMapMarkerAlt className="contact-icon" />plot No: 142, Cuttack Road, Opposite of Bhagwan Tower, Laxmisagar, Bhubaneswar - 751006</p>
              <p><FaPhoneAlt className="contact-icon" />+91 7750992598</p>
              <p><FaRegClock className="contact-icon" />Mon – Sat: 10:15 AM - 9:00 PM</p>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
           
        </div>
      </div>
      <div className="footer-copyright">
        <p>© {new Date().getFullYear()} Bhavya Event Mart. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;