import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          <i className="fas fa-trophy"></i>
          SAI Talent
        </Link>

        <button 
          className="mobile-menu-toggle" 
          onClick={toggleMenu}
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
        >
          <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
        </button>

        <nav className={`nav ${isMenuOpen ? 'nav-open' : ''}`}>
          <Link 
            to="/" 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            <i className="fas fa-home"></i>
            Home
          </Link>
          <Link 
            to="/sports-category" 
            className={`nav-link ${location.pathname.startsWith('/sports-category') ? 'active' : ''}`}
          >
            <i className="fas fa-running"></i>
            Sports
          </Link>
          <Link 
            to="/about" 
            className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}
          >
            <i className="fas fa-info-circle"></i>
            About
          </Link>
          <Link 
            to="/contact" 
            className={`nav-link ${location.pathname === '/contact' ? 'active' : ''}`}
          >
            <i className="fas fa-envelope"></i>
            Contact
          </Link>
        </nav>

        <div className={`auth-section ${isMenuOpen ? 'nav-open' : ''}`}>
          {isAuthenticated ? (
            <div className="user-menu-container">
              <button 
                className="user-menu-trigger"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-expanded={isMenuOpen}
                aria-haspopup="true"
              >
                <span className="user-avatar">
                  <i className="fas fa-user-circle"></i>
                </span>
                <span className="user-name">{user.name}</span>
                <i className={`fas fa-chevron-${isMenuOpen ? 'up' : 'down'}`}></i>
              </button>
              
              <div className={`user-dropdown ${isMenuOpen ? 'show' : ''}`}>
                <Link 
                  to={user.userType === 'sai_official' ? '/sai-dashboard' : '/dashboard'} 
                  className="dropdown-item"
                >
                  <i className="fas fa-tachometer-alt"></i>
                  <span>Dashboard</span>
                </Link>
                <button 
                  onClick={logout} 
                  className="dropdown-item"
                >
                  <i className="fas fa-sign-out-alt"></i>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="login-btn">
                Login
              </Link>
              <span className="divider">/</span>
              <Link to="/register" className="register-btn">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
