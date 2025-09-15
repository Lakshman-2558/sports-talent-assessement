import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <div className="footer-logo">
            <i className="fas fa-trophy"></i>
            <span>SAI Talent Platform</span>
          </div>
          <p className="footer-description">
            Empowering athletes through innovative talent assessment
          </p>
        </div>

        <div className="footer-section">
          <h4 className="footer-title">Quick Links</h4>
          <ul className="footer-links">
            <li><Link to="/" className="footer-link">Home</Link></li>
            <li><Link to="/sports-category" className="footer-link">Sports</Link></li>
            <li><Link to="/about" className="footer-link">About Us</Link></li>
            <li><Link to="/contact" className="footer-link">Contact Us</Link></li>
            <li><Link to="/sports-category" className="footer-link">Sports Categories</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4 className="footer-title">Government Links</h4>
          <ul className="footer-links">
            <li><a href="https://sportsauthorityofindia.nic.in/" target="_blank" rel="noopener noreferrer" className="footer-link">SAI Official</a></li>
            <li><a href="https://www.mygov.in/" target="_blank" rel="noopener noreferrer" className="footer-link">MyGov India</a></li>
            <li><a href="https://kheloindia.gov.in/" target="_blank" rel="noopener noreferrer" className="footer-link">Khelo India</a></li>
            <li><a href="https://www.india.gov.in/" target="_blank" rel="noopener noreferrer" className="footer-link">India.gov.in</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-legal">
          <span>© {currentYear} Sports Authority of India. All Rights Reserved.</span>
          <div className="legal-links">
            <a href="https://sportsauthorityofindia.nic.in/" target="_blank" rel="noopener noreferrer" className="legal-link">SAI Official Website</a>
            <span> | </span>
            <a href="https://www.india.gov.in/" target="_blank" rel="noopener noreferrer" className="legal-link">Government of India</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;