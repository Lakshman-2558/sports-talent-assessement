import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="official-footer">
      {/* Government Header Strip */}
      <div className="footer-gov-header">
        <div className="gov-emblem">
          <div className="emblem-circle">
            <span className="emblem-icon">🏛️</span>
          </div>
          <div className="emblem-text">
            <span className="emblem-title">GOVERNMENT OF INDIA</span>
            <span className="emblem-subtitle">भारत सरकार</span>
          </div>
        </div>
        <div className="footer-badges">
          <div className="official-badge">
            <span className="badge-icon">🏆</span>
            <span className="badge-text">SPORTS AUTHORITY OF INDIA</span>
          </div>
          <div className="digital-badge">
            <span className="badge-icon">🚀</span>
            <span className="badge-text">DIGITAL INDIA</span>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="footer-main">
        <div className="footer-content">
          {/* About Section */}
          <div className="footer-section">
            <h3 className="footer-title">
              <span className="title-icon">🎯</span>
              About SAI Platform
            </h3>
            <p className="footer-description">
              Revolutionizing sports talent identification across India through 
              AI-powered assessment technology, ensuring equal opportunities for 
              every aspiring athlete.
            </p>
            <div className="footer-stats">
              <div className="stat-item">
                <span className="stat-number">1M+</span>
                <span className="stat-label">Athletes</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">28</span>
                <span className="stat-label">States</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">95%</span>
                <span className="stat-label">Accuracy</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h3 className="footer-title">
              <span className="title-icon">🔗</span>
              Quick Links
            </h3>
            <ul className="footer-links">
              <li><Link to="/" className="footer-link">Home</Link></li>
              <li><Link to="/about" className="footer-link">About Us</Link></li>
              <li><Link to="/sports-category" className="footer-link">Sports Categories</Link></li>
              <li><Link to="/video-assessment" className="footer-link">Assessment</Link></li>
              <li><Link to="/dashboard" className="footer-link">Dashboard</Link></li>
              <li><Link to="/contact" className="footer-link">Contact</Link></li>
            </ul>
          </div>

          {/* Government Links */}
          <div className="footer-section">
            <h3 className="footer-title">
              <span className="title-icon">🏛️</span>
              Government Portals
            </h3>
            <ul className="footer-links">
              <li><a href="https://www.india.gov.in" className="footer-link" target="_blank" rel="noopener noreferrer">India.gov.in</a></li>
              <li><a href="https://www.sai.gov.in" className="footer-link" target="_blank" rel="noopener noreferrer">Sports Authority of India</a></li>
              <li><a href="https://www.digitalindia.gov.in" className="footer-link" target="_blank" rel="noopener noreferrer">Digital India</a></li>
              <li><a href="https://www.mygov.in" className="footer-link" target="_blank" rel="noopener noreferrer">MyGov</a></li>
              <li><a href="https://www.khelo.gov.in" className="footer-link" target="_blank" rel="noopener noreferrer">Khelo India</a></li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="footer-section">
            <h3 className="footer-title">
              <span className="title-icon">📞</span>
              Contact & Support
            </h3>
            <div className="contact-info">
              <div className="contact-item">
                <span className="contact-icon">📧</span>
                <span className="contact-text">support@saitalent.gov.in</span>
              </div>
              <div className="contact-item">
                <span className="contact-icon">📱</span>
                <span className="contact-text">1800-XXX-XXXX (Toll Free)</span>
              </div>
              <div className="contact-item">
                <span className="contact-icon">🕒</span>
                <span className="contact-text">Mon-Fri: 9:00 AM - 6:00 PM IST</span>
              </div>
            </div>
            <div className="social-links">
              <a href="#" className="social-link">📘</a>
              <a href="#" className="social-link">🐦</a>
              <a href="#" className="social-link">📸</a>
              <a href="#" className="social-link">📺</a>
            </div>
          </div>
        </div>
      </div>

      {/* Certifications & Compliance */}
      <div className="footer-certifications">
        <div className="cert-container">
          <div className="certification-badge">
            <span className="cert-icon">🔒</span>
            <div className="cert-text">
              <span className="cert-title">ISO 27001</span>
              <span className="cert-subtitle">Certified</span>
            </div>
          </div>
          <div className="certification-badge">
            <span className="cert-icon">🛡️</span>
            <div className="cert-text">
              <span className="cert-title">GDPR</span>
              <span className="cert-subtitle">Compliant</span>
            </div>
          </div>
          <div className="certification-badge">
            <span className="cert-icon">✅</span>
            <div className="cert-text">
              <span className="cert-title">STQC</span>
              <span className="cert-subtitle">Audited</span>
            </div>
          </div>
          <div className="certification-badge">
            <span className="cert-icon">🇮🇳</span>
            <div className="cert-text">
              <span className="cert-title">Made in</span>
              <span className="cert-subtitle">India</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="bottom-content">
          <div className="copyright">
            <span className="copyright-text">
              © 2024 Sports Authority of India. All Rights Reserved. | 
              Developed under Digital India Initiative
            </span>
          </div>
          <div className="footer-policies">
            <Link to="/privacy" className="policy-link">Privacy Policy</Link>
            <Link to="/terms" className="policy-link">Terms of Service</Link>
            <Link to="/accessibility" className="policy-link">Accessibility</Link>
            <Link to="/sitemap" className="policy-link">Sitemap</Link>
          </div>
        </div>
        <div className="footer-decoration">
          <div className="decoration-line"></div>
          <div className="decoration-emblem">🏛️</div>
          <div className="decoration-line"></div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="footer-floating-elements">
        <div className="floating-trophy">🏆</div>
        <div className="floating-medal">🥇</div>
        <div className="floating-star">⭐</div>
        <div className="floating-flag">🇮🇳</div>
      </div>
    </footer>
  );
};

export default Footer;
