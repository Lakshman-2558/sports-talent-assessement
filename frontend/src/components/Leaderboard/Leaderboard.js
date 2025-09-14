import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './Leaderboard.css';

const Leaderboard = ({ userType = 'athlete', showFilters = true }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    state: '',
    limit: 50
  });

  useEffect(() => {
    fetchLeaderboard();
  }, [userType, filters, fetchLeaderboard]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users/leaderboard', {
        params: {
          userType,
          ...filters
        }
      });

      if (response.data.success) {
        setLeaderboard(response.data.leaderboard);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [userType, filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankClass = (rank) => {
    if (rank === 1) return 'rank-gold';
    if (rank === 2) return 'rank-silver';
    if (rank === 3) return 'rank-bronze';
    return 'rank-default';
  };

  if (loading) {
    return (
      <div className="leaderboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h2>
          <i className="fas fa-trophy"></i>
          {userType === 'athlete' ? 'Athlete' : 'Coach'} Leaderboard
        </h2>
        
        {showFilters && (
          <div className="leaderboard-filters">
            <select
              value={filters.state}
              onChange={(e) => handleFilterChange('state', e.target.value)}
              className="filter-select"
            >
              <option value="">All States</option>
              <option value="Andhra Pradesh">Andhra Pradesh</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Gujarat">Gujarat</option>
              <option value="Rajasthan">Rajasthan</option>
              <option value="Punjab">Punjab</option>
              <option value="Haryana">Haryana</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
              <option value="West Bengal">West Bengal</option>
            </select>
            
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className="filter-select"
            >
              <option value={25}>Top 25</option>
              <option value={50}>Top 50</option>
              <option value={100}>Top 100</option>
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>
      )}

      {leaderboard.length === 0 ? (
        <div className="no-data">
          <i className="fas fa-users"></i>
          <p>No participants found</p>
        </div>
      ) : (
        <div className="leaderboard-list">
          {leaderboard.slice(0, 3).map((user) => (
            <div key={user.rank} className={`leaderboard-item podium ${getRankClass(user.rank)}`}>
              <div className="rank-badge">
                {getRankIcon(user.rank)}
              </div>
              <div className="user-info">
                <h3>{user.name}</h3>
                <p className="location">
                  <i className="fas fa-map-marker-alt"></i>
                  {user.location}
                </p>
                <p className="specialization">
                  <i className="fas fa-star"></i>
                  {user.specialization}
                </p>
              </div>
              <div className="user-stats">
                <div className="stat">
                  <span className="stat-value">{user.points.toLocaleString()}</span>
                  <span className="stat-label">Points</span>
                </div>
                <div className="stat">
                  <span className="stat-value">L{user.level}</span>
                  <span className="stat-label">Level</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{user.badgeCount}</span>
                  <span className="stat-label">Badges</span>
                </div>
              </div>
            </div>
          ))}

          <div className="leaderboard-table">
            <div className="table-header">
              <div className="header-cell rank-col">Rank</div>
              <div className="header-cell name-col">Name</div>
              <div className="header-cell location-col">Location</div>
              <div className="header-cell sport-col">Sport</div>
              <div className="header-cell points-col">Points</div>
              <div className="header-cell level-col">Level</div>
              <div className="header-cell badges-col">Badges</div>
            </div>
            
            {leaderboard.slice(3).map((user) => (
              <div key={user.rank} className="table-row">
                <div className="table-cell rank-col">
                  <span className="rank-number">#{user.rank}</span>
                </div>
                <div className="table-cell name-col">
                  <strong>{user.name}</strong>
                </div>
                <div className="table-cell location-col">
                  {user.location}
                </div>
                <div className="table-cell sport-col">
                  {user.specialization}
                </div>
                <div className="table-cell points-col">
                  <span className="points-value">{user.points.toLocaleString()}</span>
                </div>
                <div className="table-cell level-col">
                  <span className="level-badge">L{user.level}</span>
                </div>
                <div className="table-cell badges-col">
                  <span className="badge-count">
                    <i className="fas fa-medal"></i>
                    {user.badgeCount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
