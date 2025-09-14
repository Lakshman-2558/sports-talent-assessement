import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            <i className="fas fa-trophy"></i>
            <span>SAI Talent Platform</span>
          </Link>

          <nav className={`nav ${isMenuOpen ? 'nav-open' : ''}`}>
            <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>
              <i className="fas fa-home"></i>
              Home
            </Link>
            <Link to="/sports-category" className="nav-link" onClick={() => setIsMenuOpen(false)}>
              <i className="fas fa-running"></i>
              Sports Category
            </Link>
            <Link to="/contact" className="nav-link" onClick={() => setIsMenuOpen(false)}>
              <i className="fas fa-envelope"></i>
              Contact
            </Link>
            <Link to="/about" className="nav-link" onClick={() => setIsMenuOpen(false)}>
              <i className="fas fa-info-circle"></i>
              About
            </Link>
            <Link to="/puzzle-games" className="nav-link" onClick={() => setIsMenuOpen(false)}>
              <i className="fas fa-puzzle-piece"></i>
              Puzzle Games
            </Link>
          </nav>

          <div className="auth-section">
            {isAuthenticated ? (
              <div className="user-menu">
                <span className="user-name">Welcome, {user.name}</span>
                <Link 
                  to={user.userType === 'sai_official' ? '/sai-dashboard' : '/dashboard'} 
                  className="nav-link"
                >
                  <i className="fas fa-tachometer-alt"></i>
                  Dashboard
                </Link>
                <button onClick={logout} className="logout-btn">
                  <i className="fas fa-sign-out-alt"></i>
                  Logout
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn btn-secondary">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Register
                </Link>
              </div>
            )}
          </div>

          <button className="mobile-menu-toggle" onClick={toggleMenu}>
            <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
